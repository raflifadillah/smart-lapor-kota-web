use axum::{
    extract::{Path, Query, State},
    Json,
};
use serde_json::json;
use uuid::Uuid;

use crate::{
    db::DbPool,
    error::AppError,
    models::{
        incident::{Incident, SubmitVerificationRequest},
        telemetry::{FieldCrew, UpdateCrewStatusRequest},
    },
};

#[derive(serde::Deserialize)]
pub struct CrewTaskFilter {
    pub crew_id: Option<Uuid>,
    pub status: Option<String>,
}

pub async fn list_crew_tasks(
    State(pool): State<DbPool>,
    Query(filter): Query<CrewTaskFilter>,
) -> Result<Json<serde_json::Value>, AppError> {
    let tasks = sqlx::query_as::<_, Incident>(
        r#"
        SELECT
            id, ticket_number, user_id, reporter_name, reporter_phone, is_anonymous,
            category, title, description, landmark, kecamatan,
            latitude, longitude, photo_urls, severity, status,
            assigned_crew_id, assigned_team_name, materials_notes,
            notify_whatsapp, notify_sms, rating, feedback_text,
            created_at, updated_at, completed_at
        FROM incidents
        WHERE ($1::varchar IS NULL OR status = $1)
        ORDER BY
            CASE severity
                WHEN 'Tinggi' THEN 1
                WHEN 'Sedang' THEN 2
                ELSE 3
            END,
            created_at DESC
        "#,
    )
    .bind(filter.status.as_deref())
    .fetch_all(&pool)
    .await?;

    Ok(Json(json!({
        "status": "success",
        "count": tasks.len(),
        "tasks": tasks
    })))
}

pub async fn update_task_status(
    State(pool): State<DbPool>,
    Path(id): Path<Uuid>,
    Json(payload): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>, AppError> {
    let new_status = payload
        .get("status")
        .and_then(|s| s.as_str())
        .unwrap_or("Diproses Lapangan");

    let officer_name = payload
        .get("officer_name")
        .and_then(|s| s.as_str())
        .unwrap_or("Ahmad Hidayat (Regu Alfa 03)");

    sqlx::query(
        r#"
        UPDATE incidents
        SET status = $1, updated_at = NOW()
        WHERE id = $2
        "#,
    )
    .bind(new_status)
    .bind(id)
    .execute(&pool)
    .await?;

    // Record timeline
    let _ = sqlx::query(
        r#"
        INSERT INTO incident_timelines (id, incident_id, stage, title, description, actor_name, created_at)
        VALUES ($1, $2, $3, 'Pembaruan Status Penanganan', 'Status diubah oleh tim teknisi lapangan.', $4, NOW())
        "#,
    )
    .bind(Uuid::new_v4())
    .bind(id)
    .bind(new_status)
    .bind(officer_name)
    .execute(&pool)
    .await;

    Ok(Json(json!({
        "status": "success",
        "message": format!("Status tiket berhasil diubah menjadi '{}'", new_status)
    })))
}

pub async fn submit_verification(
    State(pool): State<DbPool>,
    Path(id): Path<Uuid>,
    Json(payload): Json<SubmitVerificationRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    if !payload.signed_declaration {
        return Err(AppError::BadRequest(
            "Pernyataan resmi penyelesaian pekerjaan wajib dicentang".to_string(),
        ));
    }

    if payload.after_photo_url.trim().is_empty() {
        return Err(AppError::BadRequest(
            "Foto bukti pengerjaan (Sesudah / After) wajib diunggah".to_string(),
        ));
    }

    // Insert verification sign-off record
    let verif_id = Uuid::new_v4();
    sqlx::query(
        r#"
        INSERT INTO incident_verifications (
            id, incident_id, crew_officer_name, before_photo_url, after_photo_url,
            materials_used, field_notes, signed_declaration, verified_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        "#,
    )
    .bind(verif_id)
    .bind(id)
    .bind(&payload.crew_officer_name)
    .bind(&payload.before_photo_url)
    .bind(&payload.after_photo_url)
    .bind(&payload.materials_used)
    .bind(&payload.field_notes)
    .bind(payload.signed_declaration)
    .execute(&pool)
    .await?;

    // Update incident to Verifikasi Selesai
    sqlx::query(
        r#"
        UPDATE incidents
        SET status = 'Verifikasi Selesai',
            materials_notes = $1,
            completed_at = NOW(),
            updated_at = NOW()
        WHERE id = $2
        "#,
    )
    .bind(format!("Material: {}\nCatatan: {}", payload.materials_used, payload.field_notes))
    .bind(id)
    .execute(&pool)
    .await?;

    // Add final stage to timeline
    let _ = sqlx::query(
        r#"
        INSERT INTO incident_timelines (id, incident_id, stage, title, description, actor_name, created_at)
        VALUES ($1, $2, 'Verifikasi Selesai', 'Pekerjaan Selesai & Berita Acara Disahkan', 'Verifikasi bukti Before/After telah diserahkan oleh petugas lapangan dan disahkan.', $3, NOW())
        "#,
    )
    .bind(Uuid::new_v4())
    .bind(id)
    .bind(&payload.crew_officer_name)
    .execute(&pool)
    .await;

    Ok(Json(json!({
        "status": "success",
        "message": "Verifikasi pengerjaan lapangan berhasil disahkan dan diselesaikan!",
        "verification_id": verif_id
    })))
}

pub async fn get_crew_status(
    State(pool): State<DbPool>,
) -> Result<Json<serde_json::Value>, AppError> {
    let crew = sqlx::query_as::<_, FieldCrew>(
        r#"
        SELECT id, user_id, team_name, agency, status, latitude, longitude, active_tasks, updated_at
        FROM field_crews
        ORDER BY updated_at DESC
        LIMIT 1
        "#,
    )
    .fetch_optional(&pool)
    .await?;

    Ok(Json(json!({
        "status": "success",
        "crew": crew
    })))
}

pub async fn update_crew_status(
    State(pool): State<DbPool>,
    Json(payload): Json<UpdateCrewStatusRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query(
        r#"
        UPDATE field_crews
        SET status = $1, updated_at = NOW()
        WHERE team_name = 'Regu Alfa 03'
        "#,
    )
    .bind(&payload.status)
    .execute(&pool)
    .await?;

    Ok(Json(json!({
        "status": "success",
        "message": format!("Status regu lapangan diperbarui: {}", payload.status)
    })))
}

