use std::env;
use std::path::Path;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 1. Inisialisasi logging/tracing (tetapkan seperti kode lama kamu)
    tracing_subscriber::fmt::init();

    // 2. GANTI BAGIAN DATABASE_URL DENGAN KODE INI:
    let database_url = env::var("DATABASE_URL").unwrap_or_else(|_| {
        "postgres://postgres:postgrespassword@localhost:5432/smart_lapor_db".to_string()
    });

    tracing::info!("Connecting to database at: {}", database_url);

    // 3. GANTI BAGIAN UPLOAD DIR DENGAN KODE INI (Aman dari os error 30 Read-only system):
    let upload_dir = Path::new("./static/uploads");
    if !upload_dir.exists() {
        if let Err(e) = std::fs::create_dir_all(upload_dir) {
            tracing::warn!("Read-only filesystem detected, skipping dir creation: {}", e);
        }
    }

    // 4. KONEKSI POOL DATABASE (Gunakan variabel database_url di atas)
    let pool = sqlx::postgres::PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await?;

    // --- BIARKAN KODE ROUTER AXUM & BIND ADDRESS SEPERTI SEMULA ---
    // (Jangan hapus router Axum, state pool, dan axum::serve kamu di bawahnya)

    Ok(())
}