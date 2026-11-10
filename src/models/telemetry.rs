use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct FieldCrew {
    pub id: Uuid,
    pub user_id: Option<Uuid>,
    pub team_name: String,
    pub agency: String,
    pub status: String,
    pub latitude: f64,
    pub longitude: f64,
    pub active_tasks: i32,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateCrewStatusRequest {
    pub status: String,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
}

#[derive(Debug, Serialize)]
pub struct AdminKpiSummary {
    pub total_reports: i64,
    pub awaiting_disposition: i64,
    pub in_progress: i64,
    pub completed_verified: i64,
    pub sla_compliance_pct: f64,
    pub avg_response_hours: f64,
}

#[derive(Debug, Serialize)]
pub struct SpatialIncidentPoint {
    pub id: Uuid,
    pub ticket_number: String,
    pub title: String,
    pub category: String,
    pub status: String,
    pub severity: String,
    pub latitude: f64,
    pub longitude: f64,
    pub landmark: String,
    pub kecamatan: String,
    pub photo_urls: serde_json::Value,
    pub assigned_team: Option<String>,
    pub created_at: DateTime<Utc>,
}

