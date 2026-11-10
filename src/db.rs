use sqlx::postgres::PgPoolOptions;
use sqlx::{Pool, Postgres};
use std::time::Duration;
use tracing::info;

pub type DbPool = Pool<Postgres>;

pub async fn init_db(database_url: &str) -> Result<DbPool, sqlx::Error> {
    info!("Initializing PostgreSQL connection pool for Vercel...");

    // 1. Buat pool secara lazy (tidak langsung melakukan network handshake blocking saat startup)
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .min_connections(0)
        .acquire_timeout(Duration::from_secs(15))
        .idle_timeout(Duration::from_secs(10))
        .connect_lazy(database_url)?;

    info!("PostgreSQL connection pool initialized lazily.");

    // 2. Jalankan migrasi di background task tanpa memblokir startup Vercel
    let pool_clone = pool.clone();
    tokio::spawn(async move {
        let init_script = include_str!("../migrations/001_init_postgis.sql");
        if let Err(e) = sqlx::raw_sql(init_script).execute(&pool_clone).await {
            tracing::warn!("Migration note: {}", e);
        } else {
            info!("Applied migration 001_init_postgis.sql successfully.");
        }

        let seed_script = include_str!("../migrations/002_seed_data.sql");
        let _ = sqlx::raw_sql(seed_script).execute(&pool_clone).await;
    });

    Ok(pool)
}