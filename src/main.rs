mod config;
mod db;
mod error;
mod handlers;
mod models;
mod routes;

use config::Config;
use std::net::SocketAddr;
use tracing::{error, info};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize logging
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info,smart_lapor_kota=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    info!("============================================================");
    info!(" Smart Public Facility & Incident Reporter - Smart City");
    info!(" Built with Rust, Axum, Tokio, SQLx & PostgreSQL PostGIS");
    info!(" Copyright (C) 2026 Rafli Fadillah & Dr. Erliyan Redy Susanto, M.Kom");
    info!("============================================================");

    // Ambil DATABASE_URL dari Environment Variable Vercel / Config
    let database_url = std::env::var("DATABASE_URL").unwrap_or_else(|_| {
        let cfg = Config::from_env();
        cfg.database_url
    });

    // Tangani read-only filesystem Vercel secara aman agar tidak crash
    if let Err(e) = std::fs::create_dir_all("./static/uploads") {
        tracing::warn!("Could not create upload directory ./static/uploads: {}", e);
    }

    // Initialize Database Pool
    let pool = db::init_db(&database_url).await.map_err(|e| {
        error!("Failed to connect to PostgreSQL: {}", e);
        error!("Please make sure PostgreSQL is running with PostGIS enabled.");
        error!("You can run: docker-compose up -d to start the database container.");
        e
    })?;

    // Create Axum router
    let app = routes::create_router(pool);

    // Run application listener
    let port = std::env::var("PORT").unwrap_or_else(|_| "3000".to_string());
    let addr: SocketAddr = format!("0.0.0.0:{}", port).parse()?;
    info!("Server starting on {}", addr);

    let listener = tokio::net::TcpListener::bind(&addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}