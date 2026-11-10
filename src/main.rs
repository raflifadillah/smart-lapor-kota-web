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

    let config = Config::from_env();

    // Ensure uploads directory exists
    if let Err(e) = tokio::fs::create_dir_all(&config.upload_dir).await {
        error!("Could not create upload directory {}: {}", config.upload_dir, e);
    }

    // Connect to PostgreSQL with PostGIS
    let pool = match db::init_db(&config.database_url).await {
        Ok(p) => {
            info!("Database initialized and ready.");
            p
        }
        Err(e) => {
            error!("Failed to connect to PostgreSQL: {}", e);
            error!("Please make sure PostgreSQL is running with PostGIS enabled.");
            error!("You can run: docker-compose up -d to start the database container.");
            return Err(e.into());
        }
    };

    let app = routes::create_router(pool);

    let port = std::env::var("PORT").unwrap_or_else(|_| config.server_port.to_string());
    let addr: SocketAddr = format!("0.0.0.0:{}", port)
    .parse()
    .expect("Valid socket address");

    info!("Server listening on http://{}", addr);
    info!("Web Application available at: http://localhost:{}", config.server_port);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

