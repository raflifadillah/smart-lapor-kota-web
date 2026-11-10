use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Incident {
    pub id: Uuid,
    pub ticket_number: String,
    pub user_id: Option<Uuid>,
    pub reporter_name: String,
    pub reporter_phone: Option<String>,
    pub is_anonymous: bool,
    pub category: String,
    pub title: String,
    pub description: String,
    pub landmark: String,
    pub kecamatan: String,
    pub latitude: f64,
    pub longitude: f64,
    pub photo_urls: serde_json::Value,
    pub severity: String,
    pub status: String,
    pub assigned_crew_id: Option<Uuid>,
    pub assigned_team_name: Option<String>,
    pub materials_notes: Option<String>,
    pub notify_whatsapp: bool,
    pub notify_sms: bool,
    pub rating: Option<i32>,
    pub feedback_text: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct CreateIncidentRequest {
    pub category: String,
    pub title: String,
    pub description: String,
    pub landmark: String,
    pub kecamatan: Option<String>,
    pub latitude: f64,
    pub longitude: f64,
    pub photo_urls: Option<Vec<String>>,
    pub is_anonymous: Option<bool>,
    pub reporter_name: Option<String>,
    pub reporter_phone: Option<String>,
    pub notify_whatsapp: Option<bool>,
    pub notify_sms: Option<bool>,
    pub severity: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateIncidentStatusRequest {
    pub status: String,
    pub notes: Option<String>,
    pub assigned_crew_id: Option<Uuid>,
    pub assigned_team_name: Option<String>,
}

#[derive(Debug, Deserialize, Default)]
pub struct IncidentFilterQuery {
    pub category: Option<String>,
    pub status: Option<String>,
    pub severity: Option<String>,
    pub kecamatan: Option<String>,
    pub search: Option<String>,
    pub radius_km: Option<f64>,
    pub center_lat: Option<f64>,
    pub center_lng: Option<f64>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct IncidentTimeline {
    pub id: Uuid,
    pub incident_id: Uuid,
    pub stage: String,
    pub title: String,
    pub description: Option<String>,
    pub actor_name: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct IncidentVerification {
    pub id: Uuid,
    pub incident_id: Uuid,
    pub crew_id: Option<Uuid>,
    pub crew_officer_name: String,
    pub before_photo_url: String,
    pub after_photo_url: String,
    pub materials_used: String,
    pub field_notes: String,
    pub signed_declaration: bool,
    pub verified_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct SubmitVerificationRequest {
    pub incident_id: Uuid,
    pub crew_officer_name: String,
    pub before_photo_url: String,
    pub after_photo_url: String,
    pub materials_used: String,
    pub field_notes: String,
    pub signed_declaration: bool,
}

#[derive(Debug, Deserialize)]
pub struct SubmitFeedbackRequest {
    pub rating: i32,
    pub feedback_text: Option<String>,
}

