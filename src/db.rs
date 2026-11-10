use sqlx::postgres::PgPoolOptions;
use sqlx::{Pool, Postgres};
use std::time::Duration;
use tracing::info;

pub type DbPool = Pool<Postgres>;

pub async fn init_db(database_url: &str) -> Result<DbPool, sqlx::Error> {
    info!("Connecting to PostgreSQL database with PostGIS at {}...", database_url);

    // Konfigurasi ringan khusus Serverless (Vercel + Neon)
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .min_connections(0) // Biarkan 0 agar tidak hang saat instance baru menyala
        .acquire_timeout(Duration::from_secs(15)) // Naikkan timeout ke 15 detik untuk mengakomodasi cold-start Neon
        .idle_timeout(Duration::from_secs(10))
        .connect(database_url)
        .await?;

    info!("Successfully established PostgreSQL connection pool.");

    // Skrip migrasi & seed hanya dieksekusi jika tidak sedang di-block oleh timeout
    // Jalankan secara asynchronous tanpa memblokir startup serverless
    let pool_clone = pool.clone();
    tokio::spawn(async move {
        let init_script = include_str!("../migrations/001_init_postgis.sql");
        if let Err(e) = sqlx::raw_sql(init_script).execute(&pool_clone).await {
            tracing::warn!("Migration 001 execution note: {}", e);
        } else {
            info!("Applied migration 001_init_postgis.sql successfully.");
        }

        let seed_script = include_str!("../migrations/002_seed_data.sql");
        let _ = sqlx::raw_sql(seed_script).execute(&pool_clone).await;
        info!("Ensured seed data initialized.");
    });

    Ok(pool)
}