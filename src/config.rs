use std::env;

#[derive(Clone, Debug)]
pub struct Config {
    pub database_url: String,
    pub server_host: String,
    pub server_port: u16,
    pub jwt_secret: String,
    pub upload_dir: String,
}

impl Config {
    pub fn from_env() -> Self {
        dotenvy::dotenv().ok();

        let database_url = env::var("DATABASE_URL")
            .unwrap_or_else(|_| "postgres://postgres:postgrespassword@localhost:5432/smart_lapor_db".to_string());
        let server_host = env::var("SERVER_HOST").unwrap_or_else(|_| "0.0.0.0".to_string());
        let server_port = env::var("SERVER_PORT")
            .ok()
            .and_then(|p| p.parse().ok())
            .unwrap_or(8080);
        let jwt_secret = env::var("JWT_SECRET")
            .unwrap_or_else(|_| "smart_lapor_kota_jwt_secret_key_2026_teknokrat".to_string());
        let upload_dir = env::var("UPLOAD_DIR").unwrap_or_else(|_| "./static/uploads".to_string());

        Self {
            database_url,
            server_host,
            server_port,
            jwt_secret,
            upload_dir,
        }
    }
}

