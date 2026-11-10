use axum::{
    routing::{get, post, put},
    Router,
};
use tower_http::cors::{Any, CorsLayer};
use tower_http::services::{ServeDir, ServeFile};

use crate::{
    db::DbPool,
    handlers::{admin, auth, field_crew, incident},
};

pub fn create_router(pool: DbPool) -> Router {
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

let api_routes = Router::new()
    .route("/", get(|| async { "Smart Lapor Kota API is running!" }))
    // Auth Routes
    .route("/auth/register", post(auth::register))
    .route("/auth/login", post(auth::login))    // Auth Routes
    .route("/auth/register", post(auth::register))
        // Auth Routes
        .route("/auth/register", post(auth::register))
        .route("/auth/login", post(auth::login))
        .route("/auth/me", get(auth::get_current_user))
        // Citizen Incident Routes
        .route("/incidents", get(incident::list_incidents).post(incident::create_incident))
        .route("/incidents/nearby", get(incident::search_incidents_nearby))
        .route("/incidents/upload", post(incident::upload_photo))
        .route("/incidents/:id", get(incident::get_incident))
        .route("/incidents/:id/feedback", post(incident::submit_feedback))
        // Field Crew Routes
        .route("/crew/tasks", get(field_crew::list_crew_tasks))
        .route("/crew/tasks/:id/status", put(field_crew::update_task_status))
        .route("/crew/tasks/:id/verify", post(field_crew::submit_verification))
        .route("/crew/status", get(field_crew::get_crew_status).put(field_crew::update_crew_status))
        // Admin Routes
        .route("/admin/kpi", get(admin::get_admin_kpis))
        .route("/admin/gis/incidents", get(admin::get_gis_incidents))
        .route("/admin/gis/units", get(admin::get_gis_field_units))
        .route("/admin/incidents/:id/assign", post(admin::assign_incident))
        .route("/admin/incidents/:id/status", put(admin::update_incident_status))
        .route("/admin/broadcast", post(admin::send_broadcast))
        .with_state(pool);

    Router::new()
        .nest("/api", api_routes)
        // Serve static assets directly
        .nest_service("/static", ServeDir::new("static"))
        .nest_service("/assets", ServeDir::new("static/assets"))
        // Serve SPA index
        .fallback_service(ServeFile::new("static/index.html"))
        .layer(cors)
}

