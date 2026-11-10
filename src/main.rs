use std::env;
use std::net::SocketAddr;
use std::path::Path;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod db;
mod error;
mod handlers;
mod models;
mod routes;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "smart_lapor_kota=debug,axum=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    tracing::info!("============================================================");
    tracing::info!("  Smart Public Facility & Incident Reporter - Smart City");
    tracing::info!("============================================================");

    let database_url = env::var("DATABASE_URL").unwrap_or_else(|_| {
        "postgres://postgres:postgrespassword@localhost:5432/smart_lapor_db".to_string()
    });

    let upload_dir = Path::new("./static/uploads");
    if !upload_dir.exists() {
        if let Err(e) = std::fs::create_dir_all(upload_dir) {
            tracing::warn!("Read-only filesystem detected, skipping upload dir creation: {}", e);
        }
    }

    // Inisialisasi pool database (menggunakan lazy connection)
    let pool = db::init_db(&database_url).await?;

    let app = routes::create_router(pool);

    let port: u16 = env::var("PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(3000);

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    tracing::info!("Server listening on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}