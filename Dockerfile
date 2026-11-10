# =============================================================================
# Smart Lapor Kota — Multi-stage Production Dockerfile
# FIX #4: Memastikan compiler Rust (cargo) tersedia di stage build,
# sehingga deployment ke server yang hanya ada Docker (tanpa Rust lokal) tetap berhasil.
# =============================================================================

# -----------------------------------------------------------------------------
# STAGE 1: Rust Build — kompilasi binary release Axum Tokio
# -----------------------------------------------------------------------------
FROM rust:1.78-bookworm AS builder

WORKDIR /usr/src/app

# Cache dependensi Cargo terlebih dahulu (layer caching Docker)
COPY Cargo.toml Cargo.lock* ./
RUN mkdir -p src && echo "fn main() {println!(\"placeholder\");}" > src/main.rs
RUN cargo build --release --locked 2>/dev/null || true

# Salin seluruh source code dan rebuild hanya jika ada perubahan
COPY src ./src
COPY migrations ./migrations

# Paksa recompile dengan source asli
RUN touch src/main.rs && cargo build --release --locked

# Verifikasi binary terbentuk
RUN ls -la /usr/src/app/target/release/smart-lapor-kota

# -----------------------------------------------------------------------------
# STAGE 2: Runtime Image — image minimal tanpa compiler Rust
# -----------------------------------------------------------------------------
FROM debian:bookworm-slim

# Install dependensi runtime minimal
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    libssl3 \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# FIX #6: Salin static assets termasuk folder assets/ (logos) yang sudah benar
# berada di static/assets/ — pastikan path di HTML menggunakan /assets/...
COPY --from=builder /usr/src/app/target/release/smart-lapor-kota /app/smart-lapor-kota
COPY static /app/static
COPY migrations /app/migrations

# FIX #5: Direktori uploads wajib ada agar upload foto tidak error 500
RUN mkdir -p /app/static/uploads && chmod 755 /app/static/uploads

# Pastikan binary dapat dieksekusi
RUN chmod +x /app/smart-lapor-kota

# FIX #3: Semua nilai environment ini harus di-override oleh platform hosting
# melalui panel Environment Variables — JANGAN taruh nilai rahasia di sini
ENV SERVER_HOST=0.0.0.0
ENV SERVER_PORT=8080
ENV RUST_LOG=info
ENV APP_ENV=production
ENV UPLOAD_DIR=/app/static/uploads

EXPOSE 8080

# Health check agar orchestrator (Docker Swarm / K8s) bisa deteksi kesiapan
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8080/api/admin/kpi || exit 1

CMD ["/app/smart-lapor-kota"]
