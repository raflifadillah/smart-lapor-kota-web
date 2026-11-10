-- Seed Users (Passwords are hashed for demonstration: 'password123')
INSERT INTO users (id, email, password_hash, full_name, role, phone, agency_unit)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'warga@smartlapor.id', '$2b$12$eXAmPLeHaShEDpAsswOrd1234567890abcdefghijklmnopqrstuv', 'Budi Santoso', 'warga', '0812-7890-1234', NULL),
    ('22222222-2222-2222-2222-222222222222', 'petugas@smartlapor.id', '$2b$12$eXAmPLeHaShEDpAsswOrd1234567890abcdefghijklmnopqrstuv', 'Ahmad Hidayat (Regu Alfa 03)', 'petugas', '0813-8899-7711', 'Regu Alfa 03 - Dinas Bina Marga & PUPR'),
    ('33333333-3333-3333-3333-333333333333', 'admin@smartlapor.id', '$2b$12$eXAmPLeHaShEDpAsswOrd1234567890abcdefghijklmnopqrstuv', 'Operator Command Center Pemda', 'admin', '0811-2233-4455', 'Command Center Smart City Pemda')
ON CONFLICT (email) DO NOTHING;

-- Seed Field Crews
INSERT INTO field_crews (id, user_id, team_name, agency, status, latitude, longitude, geom, active_tasks)
VALUES
    ('44444444-4444-4444-4444-444444444441', '22222222-2222-2222-2222-222222222222', 'Regu Alfa 03', 'Dinas PUPR & Bina Marga', 'Siaga Aktif', -5.381200, 105.258900, ST_SetSRID(ST_MakePoint(105.258900, -5.381200), 4326), 2),
    ('44444444-4444-4444-4444-444444444442', NULL, 'Regu Bravo 01', 'Dinas Perhubungan & Penerangan', 'Sedang Bertugas', -5.378900, 105.249800, ST_SetSRID(ST_MakePoint(105.249800, -5.378900), 4326), 1),
    ('44444444-4444-4444-4444-444444444443', NULL, 'Regu Delta 02', 'Dinas Lingkungan Hidup & Kebersihan', 'Siaga Aktif', -5.394500, 105.265100, ST_SetSRID(ST_MakePoint(105.265100, -5.394500), 4326), 0)
ON CONFLICT (id) DO NOTHING;

-- Seed Incidents
-- 1. High urgency road damage (Assigned to Alfa 03)
INSERT INTO incidents (
    id, ticket_number, user_id, reporter_name, reporter_phone, is_anonymous,
    category, title, description, landmark, kecamatan,
    latitude, longitude, geom, photo_urls, severity, status,
    assigned_crew_id, assigned_team_name, notify_whatsapp, notify_sms, created_at, updated_at
) VALUES (
    '55555555-5555-5555-5555-555555555551', 'LAP-2026-0882', '11111111-1111-1111-1111-111111111111',
    'Budi Santoso', '0812-7890-1234', false,
    'Jalan Berlubang', 'Aspal Ambles Diameter 1.2 Meter Membahayakan Pengendara',
    'Terdapat lubang jalan cukup dalam akibat gerusan hujan deras kemarin sore. Sangat membahayakan pengendara motor terutama di malam hari karena minim penerangan.',
    'Depan Gerbang Kampus Teknokrat, Jl. ZA. Pagar Alam', 'Kedaton',
    -5.381500, 105.258500, ST_SetSRID(ST_MakePoint(105.258500, -5.381500), 4326),
    '["https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80"]'::jsonb,
    'Tinggi', 'Diproses Lapangan',
    '44444444-4444-4444-4444-444444444441', 'Regu Alfa 03 - Dinas PUPR',
    true, false,
    NOW() - INTERVAL '3 hours', NOW() - INTERVAL '30 minutes'
) ON CONFLICT (id) DO NOTHING;

-- Timeline for LAP-2026-0882
INSERT INTO incident_timelines (incident_id, stage, title, description, actor_name, created_at)
VALUES
    ('55555555-5555-5555-5555-555555555551', 'Diajukan', 'Laporan Diterima Sistem', 'Laporan kerusakan jalan berlubang berhasil dicatat di sistem Smart Lapor.', 'Sistem Otomatis', NOW() - INTERVAL '3 hours'),
    ('55555555-5555-5555-5555-555555555551', 'Disposisi Resmi', 'Disposisi ke Dinas PUPR', 'Dinas verifikasi tingkat urgensi dan menerbitkan surat tugas penanganan cepat.', 'Operator Command Center', NOW() - INTERVAL '2 hours'),
    ('55555555-5555-5555-5555-555555555551', 'Diproses Lapangan', 'Petugas Menuju Lokasi Kejadian', 'Tim Regu Alfa 03 membawa material aspal cold-mix dan alat pemadat ke lokasi.', 'Ahmad Hidayat (Regu Alfa 03)', NOW() - INTERVAL '40 minutes')
ON CONFLICT (id) DO NOTHING;

-- 2. Streetlight failure (Pending Disposition)
INSERT INTO incidents (
    id, ticket_number, user_id, reporter_name, reporter_phone, is_anonymous,
    category, title, description, landmark, kecamatan,
    latitude, longitude, geom, photo_urls, severity, status,
    assigned_crew_id, assigned_team_name, notify_whatsapp, notify_sms, created_at, updated_at
) VALUES (
    '55555555-5555-5555-5555-555555555552', 'LAP-2026-0883', NULL,
    'Warga Peduli (Anonim)', '0857-1122-3344', true,
    'PJU Padam', 'Lampu Jalan Padam Sepanjang 200m Rawan Kriminalitas',
    'Tiga tiang lampu PJU mati total sejak 2 malam berturut-turut, area menjadi sangat gelap dan rawan pembegalan kendaraan bermotor.',
    'Simpang Tiga Jl. Teuku Umar No. 45', 'Kedaton',
    -5.385200, 105.261200, ST_SetSRID(ST_MakePoint(105.261200, -5.385200), 4326),
    '["https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80"]'::jsonb,
    'Sedang', 'Menunggu Disposisi',
    NULL, NULL,
    true, true,
    NOW() - INTERVAL '5 hours', NOW() - INTERVAL '5 hours'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO incident_timelines (incident_id, stage, title, description, actor_name, created_at)
VALUES
    ('55555555-5555-5555-5555-555555555552', 'Diajukan', 'Laporan Anonim Terdaftar', 'Menunggu validasi operator command center.', 'Sistem Otomatis', NOW() - INTERVAL '5 hours')
ON CONFLICT (id) DO NOTHING;

-- 3. Drainage blockage (Assigned to Bravo 01)
INSERT INTO incidents (
    id, ticket_number, user_id, reporter_name, reporter_phone, is_anonymous,
    category, title, description, landmark, kecamatan,
    latitude, longitude, geom, photo_urls, severity, status,
    assigned_crew_id, assigned_team_name, notify_whatsapp, notify_sms, created_at, updated_at
) VALUES (
    '55555555-5555-5555-5555-555555555553', 'LAP-2026-0880', '11111111-1111-1111-1111-111111111111',
    'Siti Rahmawati', '0821-5566-7788', false,
    'Drainase & Banjir', 'Saluran Drainase Tersumbat Sampah Menggenangi Jalan',
    'Gorong-gorong tersumbat sedimentasi pasir dan tumpukan sampah plastik, air meluap ke badan jalan saat hujan 15 menit.',
    'Dekat Pasar Koga, Jl. Teuku Umar', 'Kedaton',
    -5.391200, 105.264500, ST_SetSRID(ST_MakePoint(105.264500, -5.391200), 4326),
    '["https://images.unsplash.com/photo-1541888946425-d0fbb1861593?auto=format&fit=crop&w=800&q=80"]'::jsonb,
    'Sedang', 'Diproses Lapangan',
    '44444444-4444-4444-4444-444444444442', 'Regu Bravo 01 - Dinas Lingkungan',
    true, false,
    NOW() - INTERVAL '8 hours', NOW() - INTERVAL '1 hour'
) ON CONFLICT (id) DO NOTHING;

-- 4. Completed Repair (Verified with Before/After)
INSERT INTO incidents (
    id, ticket_number, user_id, reporter_name, reporter_phone, is_anonymous,
    category, title, description, landmark, kecamatan,
    latitude, longitude, geom, photo_urls, severity, status,
    assigned_crew_id, assigned_team_name, notify_whatsapp, notify_sms,
    rating, feedback_text, created_at, updated_at, completed_at
) VALUES (
    '55555555-5555-5555-5555-555555555554', 'LAP-2026-0879', '11111111-1111-1111-1111-111111111111',
    'Rian Pratama', '0819-3344-5566', false,
    'Rambu Lalu Lintas Rusak', 'Rambu Penyeberangan Pejalan Kaki Roboh Ditabrak',
    'Plang tiang penyeberangan zebra cross miring dan hampir roboh ke arah jalan.',
    'Depan SD Negeri 2 Labuhan Ratu', 'Labuhan Ratu',
    -5.374500, 105.253100, ST_SetSRID(ST_MakePoint(105.253100, -5.374500), 4326),
    '["https://images.unsplash.com/photo-1584467541268-b040f83be3fd?auto=format&fit=crop&w=800&q=80"]'::jsonb,
    'Sedang', 'Verifikasi Selesai',
    '44444444-4444-4444-4444-444444444441', 'Regu Alfa 03 - Dinas PUPR',
    true, false,
    5, 'Pelayanan sangat cepat tanggap! Tiang baru kokoh dan penyeberangan kembali aman untuk anak sekolah.',
    NOW() - INTERVAL '1 day', NOW() - INTERVAL '4 hours', NOW() - INTERVAL '4 hours'
) ON CONFLICT (id) DO NOTHING;

-- Verification record for LAP-2026-0879
INSERT INTO incident_verifications (
    id, incident_id, crew_id, crew_officer_name,
    before_photo_url, after_photo_url,
    materials_used, field_notes, signed_declaration, verified_at
) VALUES (
    '66666666-6666-6666-6666-666666666661', '55555555-5555-5555-5555-555555555554',
    '44444444-4444-4444-4444-444444444441', 'Ahmad Hidayat (Regu Alfa 03)',
    'https://images.unsplash.com/photo-1584467541268-b040f83be3fd?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1541888946425-d0fbb1861593?auto=format&fit=crop&w=800&q=80',
    'Pondasi cor semen K-250, Tiang baja galvanis 2 inch, Baut angkur M12',
    'Pondasi tiang lama dibongkar dan diganti dengan cor beton cepat kering. Plang rambu dibersihkan dan dipasang kembali tegak lurus sempurna.',
    true, NOW() - INTERVAL '4 hours'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO incident_timelines (incident_id, stage, title, description, actor_name, created_at)
VALUES
    ('55555555-5555-5555-5555-555555555554', 'Diajukan', 'Laporan Diterima', 'Laporan kerusakan rambu penyeberangan diterima.', 'Sistem Otomatis', NOW() - INTERVAL '1 day'),
    ('55555555-5555-5555-5555-555555555554', 'Disposisi Resmi', 'Surat Tugas Dishub & PUPR', 'Diteruskan ke Regu Alfa 03 untuk perbaikan mendesak.', 'Operator Command Center', NOW() - INTERVAL '20 hours'),
    ('55555555-5555-5555-5555-555555555554', 'Diproses Lapangan', 'Pemasangan Tiang Baru', 'Pengecoran pondasi dan pemasangan angkur penahan.', 'Ahmad Hidayat', NOW() - INTERVAL '6 hours'),
    ('55555555-5555-5555-5555-555555555554', 'Verifikasi Selesai', 'Pekerjaan Selesai & Terverifikasi', 'Dokumentasi before/after telah disahkan pengawas lapangan.', 'Inspektur Lapangan Pemda', NOW() - INTERVAL '4 hours')
ON CONFLICT (id) DO NOTHING;

