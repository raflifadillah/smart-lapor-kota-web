use sqlx::postgres::PgPoolOptions;
use sqlx::{Pool, Postgres};
use std::time::Duration;
use tracing::info;

pub type DbPool = Pool<Postgres>;

pub async fn init_db(database_url: &str) -> Result<DbPool, sqlx::Error> {
    info!("Connecting to PostgreSQL database with PostGIS at {}...", database_url);

    let pool = PgPoolOptions::new()
        .max_connections(20)
        .min_connections(2)
        .acquire_timeout(Duration::from_secs(5))
        .idle_timeout(Duration::from_secs(60))
        .connect(database_url)
        .await?;

    info!("Successfully established PostgreSQL connection pool.");

    // Run core schema initialization if tables do not exist
    let init_script = include_str!("../migrations/001_init_postgis.sql");
    sqlx::raw_sql(init_script).execute(&pool).await?;
    info!("Applied migration 001_init_postgis.sql successfully.");

    // Seed default data if needed
    let seed_script = include_str!("../migrations/002_seed_data.sql");
    let _ = sqlx::raw_sql(seed_script).execute(&pool).await;
    info!("Ensured seed data initialized.");

    Ok(pool)
}

