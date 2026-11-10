use axum::{
    extract::{Multipart, Path, Query, State},
    http::StatusCode,
    Json,
};
use chrono::Utc;
use serde_json::json;
use std::path::Path as FsPath;
use uuid::Uuid;

use crate::{
    db::DbPool,
    error::AppError,
    models::incident::{
        CreateIncidentRequest, Incident, IncidentFilterQuery, IncidentTimeline,
        IncidentVerification, SubmitFeedbackRequest,
    },
};

pub async fn create_incident(
    State(pool): State<DbPool>,
    Json(payload): Json<CreateIncidentRequest>,
) -> Result<(StatusCode, Json<serde_json::Value>), AppError> {
    if payload.title.trim().is_empty() || payload.description.trim().is_empty() {
        return Err(AppError::BadRequest("Judul dan deskripsi keluhan wajib diisi".to_string()));
    }

    let count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM incidents")
        .fetch_one(&pool)
        .await
        .unwrap_or((100,));
    let ticket_number = format!("LAP-2026-{:04}", 884 + count.0);

    let new_id = Uuid::new_v4();
    let is_anonymous = payload.is_anonymous.unwrap_or(false);
    let reporter_name = if is_anonymous {
        "Warga Peduli (Anonim)".to_string()
    } else {
        payload.reporter_name.unwrap_or_else(|| "Budi Santoso".to_string())
    };

    let kecamatan = payload.kecamatan.unwrap_or_else(|| "Kedaton".to_string());
    let severity = payload.severity.unwrap_or_else(|| "Sedang".to_string());
    let photo_urls_json = serde_json::to_value(payload.photo_urls.unwrap_or_default())
        .unwrap_or_else(|_| json!([]));
    let notify_wa = payload.notify_whatsapp.unwrap_or(true);
    let notify_sms = payload.notify_sms.unwrap_or(false);

    // Insert incident with PostGIS point geometry
    let incident = sqlx::query_as::<_, Incident>(
        r#"
        INSERT INTO incidents (
            id, ticket_number, reporter_name, reporter_phone, is_anonymous,
            category, title, description, landmark, kecamatan,
            latitude, longitude, geom, photo_urls, severity, status,
            notify_whatsapp, notify_sms, created_at, updated_at
        ) VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9, $10,
            $11, $12, ST_SetSRID(ST_MakePoint($12, $11), 4326), $13, $14, 'Diajukan',
            $15, $16, NOW(), NOW()
        )
        RETURNING
            id, ticket_number, user_id, reporter_name, reporter_phone, is_anonymous,
            category, title, description, landmark, kecamatan,
            latitude, longitude, photo_urls, severity, status,
            assigned_crew_id, assigned_team_name, materials_notes,
            notify_whatsapp, notify_sms, rating, feedback_text,
            created_at, updated_at, completed_at
        "#,
    )
    .bind(new_id)
    .bind(&ticket_number)
    .bind(&reporter_name)
    .bind(&payload.reporter_phone)
    .bind(is_anonymous)
    .bind(&payload.category)
    .bind(&payload.title)
    .bind(&payload.description)
    .bind(&payload.landmark)
    .bind(&kecamatan)
    .bind(payload.latitude)
    .bind(payload.longitude)
    .bind(photo_urls_json)
    .bind(&severity)
    .bind(notify_wa)
    .bind(notify_sms)
    .fetch_one(&pool)
    .await?;

    // Create initial timeline event
    let _ = sqlx::query(
        r#"
        INSERT INTO incident_timelines (id, incident_id, stage, title, description, actor_name, created_at)
        VALUES ($1, $2, 'Diajukan', 'Laporan Berhasil Diterima', 'Laporan telah masuk ke sistem dan masuk antrean verifikasi dinas.', 'Sistem Otomatis', NOW())
        "#,
    )
    .bind(Uuid::new_v4())
    .bind(incident.id)
    .execute(&pool)
    .await;

    Ok((
        StatusCode::CREATED,
        Json(json!({
            "status": "success",
            "message": "Laporan resmi berhasil dikirimkan",
            "data": incident
        })),
    ))
}

pub async fn list_incidents(
    State(pool): State<DbPool>,
    Query(filter): Query<IncidentFilterQuery>,
) -> Result<Json<serde_json::Value>, AppError> {
    let limit = filter.limit.unwrap_or(50);
    let offset = filter.offset.unwrap_or(0);

    let incidents = sqlx::query_as::<_, Incident>(
        r#"
        SELECT
            id, ticket_number, user_id, reporter_name, reporter_phone, is_anonymous,
            category, title, description, landmark, kecamatan,
            latitude, longitude, photo_urls, severity, status,
            assigned_crew_id, assigned_team_name, materials_notes,
            notify_whatsapp, notify_sms, rating, feedback_text,
            created_at, updated_at, completed_at
        FROM incidents
        WHERE ($1::varchar IS NULL OR category = $1)
          AND ($2::varchar IS NULL OR status = $2)
          AND ($3::varchar IS NULL OR severity = $3)
          AND ($4::varchar IS NULL OR kecamatan = $4)
          AND (
            $5::varchar IS NULL 
            OR title ILIKE CONCAT('%', $5, '%')
            OR ticket_number ILIKE CONCAT('%', $5, '%')
            OR landmark ILIKE CONCAT('%', $5, '%')
          )
        ORDER BY created_at DESC
        LIMIT $6 OFFSET $7
        "#,
    )
    .bind(filter.category.as_deref())
    .bind(filter.status.as_deref())
    .bind(filter.severity.as_deref())
    .bind(filter.kecamatan.as_deref())
    .bind(filter.search.as_deref())
    .bind(limit)
    .bind(offset)
    .fetch_all(&pool)
    .await?;

    Ok(Json(json!({
        "status": "success",
        "count": incidents.len(),
        "data": incidents
    })))
}

#[derive(serde::Deserialize)]
pub struct NearbyQuery {
    pub lat: f64,
    pub lng: f64,
    pub radius_km: Option<f64>,
}

pub async fn search_incidents_nearby(
    State(pool): State<DbPool>,
    Query(query): Query<NearbyQuery>,
) -> Result<Json<serde_json::Value>, AppError> {
    let radius_meters = query.radius_km.unwrap_or(3.0) * 1000.0;

    let incidents = sqlx::query_as::<_, Incident>(
        r#"
        SELECT
            id, ticket_number, user_id, reporter_name, reporter_phone, is_anonymous,
            category, title, description, landmark, kecamatan,
            latitude, longitude, photo_urls, severity, status,
            assigned_crew_id, assigned_team_name, materials_notes,
            notify_whatsapp, notify_sms, rating, feedback_text,
            created_at, updated_at, completed_at
        FROM incidents
        WHERE ST_DWithin(
            geom::geography,
            ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
            $3
        )
        ORDER BY ST_Distance(
            geom::geography,
            ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
        ) ASC
        LIMIT 25
        "#,
    )
    .bind(query.lng)
    .bind(query.lat)
    .bind(radius_meters)
    .fetch_all(&pool)
    .await?;

    Ok(Json(json!({
        "status": "success",
        "radius_km": query.radius_km.unwrap_or(3.0),
        "count": incidents.len(),
        "data": incidents
    })))
}

pub async fn get_incident(
    State(pool): State<DbPool>,
    Path(id_or_ticket): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    let parsed_uuid = Uuid::parse_str(&id_or_ticket).ok();

    let incident = sqlx::query_as::<_, Incident>(
        r#"
        SELECT
            id, ticket_number, user_id, reporter_name, reporter_phone, is_anonymous,
            category, title, description, landmark, kecamatan,
            latitude, longitude, photo_urls, severity, status,
            assigned_crew_id, assigned_team_name, materials_notes,
            notify_whatsapp, notify_sms, rating, feedback_text,
            created_at, updated_at, completed_at
        FROM incidents
        WHERE id = $1 OR ticket_number = $2
        "#,
    )
    .bind(parsed_uuid)
    .bind(&id_or_ticket)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::NotFound("Laporan tidak ditemukan".to_string()))?;

    let timelines = sqlx::query_as::<_, IncidentTimeline>(
        r#"
        SELECT id, incident_id, stage, title, description, actor_name, created_at
        FROM incident_timelines
        WHERE incident_id = $1
        ORDER BY created_at ASC
        "#,
    )
    .bind(incident.id)
    .fetch_all(&pool)
    .await
    .unwrap_or_default();

    let verification = sqlx::query_as::<_, IncidentVerification>(
        r#"
        SELECT id, incident_id, crew_id, crew_officer_name, before_photo_url, after_photo_url, materials_used, field_notes, signed_declaration, verified_at
        FROM incident_verifications
        WHERE incident_id = $1
        LIMIT 1
        "#,
    )
    .bind(incident.id)
    .fetch_optional(&pool)
    .await
    .unwrap_or(None);

    Ok(Json(json!({
        "status": "success",
        "incident": incident,
        "timelines": timelines,
        "verification": verification
    })))
}

pub async fn submit_feedback(
    State(pool): State<DbPool>,
    Path(id): Path<Uuid>,
    Json(payload): Json<SubmitFeedbackRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    if payload.rating < 1 || payload.rating > 5 {
        return Err(AppError::BadRequest("Rating harus antara 1 dan 5 bintang".to_string()));
    }

    sqlx::query(
        r#"
        UPDATE incidents
        SET rating = $1, feedback_text = $2, updated_at = NOW()
        WHERE id = $3
        "#,
    )
    .bind(payload.rating)
    .bind(&payload.feedback_text)
    .bind(id)
    .execute(&pool)
    .await?;

    Ok(Json(json!({
        "status": "success",
        "message": "Terima kasih atas penilaian dan masukan Anda!"
    })))
}

pub async fn upload_photo(
    mut multipart: Multipart,
) -> Result<Json<serde_json::Value>, AppError> {
    let mut uploaded_urls = Vec::new();

    while let Some(field) = multipart.next_field().await.map_err(|e| {
        AppError::BadRequest(format!("Gagal membaca file unggahan: {}", e))
    })? {
        let name = field.name().unwrap_or("file").to_string();
        if name == "photos" || name == "file" {
            let file_name = field.file_name().unwrap_or("upload.jpg").to_string();
            let ext = FsPath::new(&file_name)
                .extension()
                .and_then(|s| s.to_str())
                .unwrap_or("jpg");

            let new_filename = format!("{}_{}.{}", Utc::now().timestamp_millis(), Uuid::new_v4(), ext);
            let target_path = format!("./static/uploads/{}", new_filename);

            let data = field.bytes().await.map_err(|e| {
                AppError::Internal(format!("Gagal membaca stream bytes: {}", e))
            })?;

            tokio::fs::write(&target_path, &data).await.map_err(|e| {
                AppError::Internal(format!("Gagal menyimpan file ke disk: {}", e))
            })?;

            uploaded_urls.push(format!("/static/uploads/{}", new_filename));
        }
    }

    if uploaded_urls.is_empty() {
        // Fallback placeholder photo if multipart is empty
        uploaded_urls.push("https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80".to_string());
    }

    Ok(Json(json!({
        "status": "success",
        "urls": uploaded_urls
    })))
}

