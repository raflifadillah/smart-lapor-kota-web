-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('warga', 'petugas', 'admin')),
    phone VARCHAR(50),
    agency_unit VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Field Crews Status & Fleet
CREATE TABLE IF NOT EXISTS field_crews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    team_name VARCHAR(150) NOT NULL,
    agency VARCHAR(150) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Siaga Aktif' CHECK (status IN ('Siaga Aktif', 'Sedang Bertugas', 'Istirahat', 'Offline')),
    latitude DOUBLE PRECISION NOT NULL DEFAULT -5.397140,
    longitude DOUBLE PRECISION NOT NULL DEFAULT 105.266789,
    geom GEOMETRY(Point, 4326),
    active_tasks INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- GiST spatial index for field crews
CREATE INDEX IF NOT EXISTS idx_field_crews_geom ON field_crews USING GIST(geom);

-- 3. Incidents / Reports Table
CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reporter_name VARCHAR(150) NOT NULL,
    reporter_phone VARCHAR(50),
    is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
    category VARCHAR(100) NOT NULL CHECK (category IN (
        'Jalan Berlubang',
        'PJU Padam',
        'Drainase & Banjir',
        'Taman & Fasilitas Anak',
        'Rambu Lalu Lintas Rusak'
    )),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    landmark VARCHAR(255) NOT NULL,
    kecamatan VARCHAR(100) NOT NULL DEFAULT 'Kedaton',
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    geom GEOMETRY(Point, 4326),
    photo_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
    severity VARCHAR(50) NOT NULL DEFAULT 'Sedang' CHECK (severity IN ('Tinggi', 'Sedang', 'Rendah')),
    status VARCHAR(50) NOT NULL DEFAULT 'Diajukan' CHECK (status IN (
        'Diajukan',
        'Disposisi Resmi',
        'Diproses Lapangan',
        'Verifikasi Selesai',
        'Ditolak'
    )),
    assigned_crew_id UUID REFERENCES field_crews(id) ON DELETE SET NULL,
    assigned_team_name VARCHAR(150),
    materials_notes TEXT,
    notify_whatsapp BOOLEAN NOT NULL DEFAULT TRUE,
    notify_sms BOOLEAN NOT NULL DEFAULT FALSE,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    feedback_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Spatial and performance indexes
CREATE INDEX IF NOT EXISTS idx_incidents_geom ON incidents USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_category ON incidents(category);
CREATE INDEX IF NOT EXISTS idx_incidents_ticket ON incidents(ticket_number);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON incidents(created_at DESC);

-- 4. Incident Work Verification (Field Crew Sign-Off)
CREATE TABLE IF NOT EXISTS incident_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    crew_id UUID REFERENCES field_crews(id) ON DELETE SET NULL,
    crew_officer_name VARCHAR(150) NOT NULL,
    before_photo_url TEXT NOT NULL,
    after_photo_url TEXT NOT NULL,
    materials_used TEXT NOT NULL,
    field_notes TEXT NOT NULL,
    signed_declaration BOOLEAN NOT NULL DEFAULT TRUE,
    verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verifications_incident ON incident_verifications(incident_id);

-- 5. Incident Timeline / History
CREATE TABLE IF NOT EXISTS incident_timelines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    stage VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    actor_name VARCHAR(150),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_timelines_incident ON incident_timelines(incident_id, created_at ASC);

