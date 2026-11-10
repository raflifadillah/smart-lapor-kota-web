# Multi-stage Docker build for Rust Axum Backend
# 1. Build stage
FROM rust:1.78-bookworm AS builder

WORKDIR /usr/src/app

# Pre-fetch dependencies
COPY Cargo.toml ./
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo fetch

# Copy source code and migrations
COPY src ./src
COPY migrations ./migrations

# Build release binary
RUN touch src/main.rs && cargo build --release

# 2. Runtime stage
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy binary from builder
COPY --from=builder /usr/src/app/target/release/smart-lapor-kota /app/smart-lapor-kota

# Copy static frontend assets & migrations
COPY static /app/static
COPY migrations /app/migrations

ENV SERVER_HOST=0.0.0.0
ENV SERVER_PORT=8080
ENV RUST_LOG=info

EXPOSE 8080

CMD ["/app/smart-lapor-kota"]

