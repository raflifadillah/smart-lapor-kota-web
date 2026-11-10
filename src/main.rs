use std::env;
use std::net::SocketAddr;
use std::path::Path;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod db;
mod handlers;
mod models;
mod routes;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 1. Inisialisasi Logger / Tracing
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

    // 2. Baca DATABASE_URL dari Environment Variable Vercel (Neon PostgreSQL)
    let database_url = env::var("DATABASE_URL").unwrap_or_else(|_| {
        "postgres://postgres:postgrespassword@localhost:5432/smart_lapor_db".to_string()
    });

    tracing::info!("Connecting to PostgreSQL database...");

    // 3. Penanganan Upload Dir (Aman untuk Read-Only Filesystem Vercel)
    let upload_dir = Path::new("./static/uploads");
    if !upload_dir.exists() {
        if let Err(e) = std::fs::create_dir_all(upload_dir) {
            tracing::warn!("Read-only filesystem detected, skipping upload dir creation: {}", e);
        }
    }

    // 4. Inisialisasi SQLx Connection Pool dengan Timeout Aman
    let pool = sqlx::postgres::PgPoolOptions::new()
        .max_connections(5)
        .acquire_timeout(std::time::Duration::from_secs(15))
        .connect(&database_url)
        .await?;

    tracing::info!("Database connection established successfully.");

    // 5. Panggil create_router(pool) dari routes.rs
    let app = routes::create_router(pool);

    // 6. Bind PORT Dinamis bawaan Vercel
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