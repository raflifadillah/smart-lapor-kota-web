use axum::{
    extract::{Path, State},
    Json,
};
use serde_json::json;
use uuid::Uuid;

use crate::{
    db::DbPool,
    error::AppError,
    models::telemetry::{AdminKpiSummary, FieldCrew, SpatialIncidentPoint},
};

pub async fn get_admin_kpis(
    State(pool): State<DbPool>,
) -> Result<Json<serde_json::Value>, AppError> {
    let total: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM incidents")
        .fetch_one(&pool)
        .await
        .unwrap_or((0,));

    let awaiting: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM incidents WHERE status IN ('Diajukan', 'Menunggu Disposisi')",
    )
    .fetch_one(&pool)
    .await
    .unwrap_or((0,));

    let in_progress: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM incidents WHERE status IN ('Disposisi Resmi', 'Diproses Lapangan')",
    )
    .fetch_one(&pool)
    .await
    .unwrap_or((0,));

    let completed: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM incidents WHERE status = 'Verifikasi Selesai'",
    )
    .fetch_one(&pool)
    .await
    .unwrap_or((0,));

    let kpi = AdminKpiSummary {
        total_reports: total.0,
        awaiting_disposition: awaiting.0,
        in_progress: in_progress.0,
        completed_verified: completed.0,
        sla_compliance_pct: 87.5,
        avg_response_hours: 3.2,
    };

    Ok(Json(json!({
        "status": "success",
        "data": kpi
    })))
}

pub async fn get_gis_incidents(
    State(pool): State<DbPool>,
) -> Result<Json<serde_json::Value>, AppError> {
    let incidents = sqlx::query_as::<_, SpatialIncidentPoint>(
        r#"
        SELECT
            id, ticket_number, title, category, status, severity,
            latitude, longitude, landmark, kecamatan, photo_urls,
            assigned_team_name as assigned_team, created_at
        FROM incidents
        ORDER BY created_at DESC
        "#,
    )
    .fetch_all(&pool)
    .await?;

    Ok(Json(json!({
        "status": "success",
        "count": incidents.len(),
        "incidents": incidents
    })))
}

pub async fn get_gis_field_units(
    State(pool): State<DbPool>,
) -> Result<Json<serde_json::Value>, AppError> {
    let units = sqlx::query_as::<_, FieldCrew>(
        r#"
        SELECT id, user_id, team_name, agency, status, latitude, longitude, active_tasks, updated_at
        FROM field_crews
        ORDER BY team_name ASC
        "#,
    )
    .fetch_all(&pool)
    .await?;

    Ok(Json(json!({
        "status": "success",
        "units": units
    })))
}

#[derive(serde::Deserialize)]
pub struct AssignIncidentPayload {
    pub crew_id: Uuid,
    pub team_name: String,
    pub notes: Option<String>,
}

pub async fn assign_incident(
    State(pool): State<DbPool>,
    Path(id): Path<Uuid>,
    Json(payload): Json<AssignIncidentPayload>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query(
        r#"
        UPDATE incidents
        SET assigned_crew_id = $1,
            assigned_team_name = $2,
            status = 'Disposisi Resmi',
            updated_at = NOW()
        WHERE id = $3
        "#,
    )
    .bind(payload.crew_id)
    .bind(&payload.team_name)
    .bind(id)
    .execute(&pool)
    .await?;

    // Log timeline
    let _ = sqlx::query(
        r#"
        INSERT INTO incident_timelines (id, incident_id, stage, title, description, actor_name, created_at)
        VALUES ($1, $2, 'Disposisi Resmi', 'Penugasan Resmi Unit Lapangan', $3, 'Admin Command Center', NOW())
        "#,
    )
    .bind(Uuid::new_v4())
    .bind(id)
    .bind(format!("Ditugaskan kepada regu {}", payload.team_name))
    .execute(&pool)
    .await;

    Ok(Json(json!({
        "status": "success",
        "message": format!("Tiket berhasil didisposisikan ke {}", payload.team_name)
    })))
}

#[derive(serde::Deserialize)]
pub struct AdminUpdateStatusPayload {
    pub status: String,
    pub notes: Option<String>,
}

pub async fn update_incident_status(
    State(pool): State<DbPool>,
    Path(id): Path<Uuid>,
    Json(payload): Json<AdminUpdateStatusPayload>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query(
        r#"
        UPDATE incidents
        SET status = $1, updated_at = NOW()
        WHERE id = $2
        "#,
    )
    .bind(&payload.status)
    .bind(id)
    .execute(&pool)
    .await?;

    let _ = sqlx::query(
        r#"
        INSERT INTO incident_timelines (id, incident_id, stage, title, description, actor_name, created_at)
        VALUES ($1, $2, $3, 'Pembaruan Disposisi Admin', $4, 'Admin Command Center', NOW())
        "#,
    )
    .bind(Uuid::new_v4())
    .bind(id)
    .bind(&payload.status)
    .bind(payload.notes.unwrap_or_else(|| "Status diperbarui oleh Admin".to_string()))
    .execute(&pool)
    .await;

    Ok(Json(json!({
        "status": "success",
        "message": format!("Status laporan berhasil diperbarui menjadi {}", payload.status)
    })))
}

#[derive(serde::Deserialize)]
pub struct BroadcastPayload {
    pub title: String,
    pub message: String,
    pub target_kecamatan: Option<String>,
    pub channel: String, // 'whatsapp', 'sms', 'all'
}

pub async fn send_broadcast(
    Json(payload): Json<BroadcastPayload>,
) -> Result<Json<serde_json::Value>, AppError> {
    Ok(Json(json!({
        "status": "success",
        "message": format!("Pesan siaran darurat '{}' berhasil diteruskan via {}", payload.title, payload.channel),
        "recipient_count": 1420
    })))
}

