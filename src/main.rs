use std::env;
use std::net::SocketAddr;
use std::path::Path;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();

    // 1. Ambil DATABASE_URL dari Environment Variable Vercel
    let database_url = env::var("DATABASE_URL").unwrap_or_else(|_| {
        "postgres://postgres:postgrespassword@localhost:5432/smart_lapor_db".to_string()
    });

    tracing::info!("Connecting to database at: {}", database_url);

    // 2. Aman untuk Read-Only File System Vercel
    let upload_dir = Path::new("./static/uploads");
    if !upload_dir.exists() {
        if let Err(e) = std::fs::create_dir_all(upload_dir) {
            tracing::warn!("Read-only filesystem, skipping dir creation: {}", e);
        }
    }

    // 3. Inisialisasi Database Pool dengan Timeout yang Aman
    let pool = sqlx::postgres::PgPoolOptions::new()
        .max_connections(5)
        .acquire_timeout(std::time::Duration::from_secs(15))
        .connect(&database_url)
        .await?;

    // --- SETUP ROUTER AXUM KAMU DI SINI ---
    // let app = create_router(pool); 

    // 4. BIND PORT SECARA DINAMIS (Wajib untuk Vercel Serverless/Container)
    let port: u16 = env::var("PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(3000);

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    tracing::info!("Server listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}