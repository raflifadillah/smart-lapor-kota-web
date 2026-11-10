# Smart Public Facility & Incident Reporter
**Sistem Pelaporan dan Penanganan Kerusakan Fasilitas Publik Smart City Berbasis Rust Axum & PostgreSQL PostGIS**

> **Mata Kuliah**: Proyek Pengembangan Sistem Informasi (PPSI)  
> **Tahun**: 2026  
> **Pengembang**: Rafli Fadillah  
> **Dosen Pengampu**: Dr. Erliyan Redy Susanto, M.Kom  
> **Institusi**: Universitas Teknokrat Indonesia  

---

## 1. Ringkasan Proyek

Aplikasi **Smart Public Facility & Incident Reporter** (Smart Lapor Kota) adalah sistem informasi perkotaan modern yang menghubungkan warga masyarakat secara *real-time* dengan Dinas Pemerintah Daerah (Pemda) dan Petugas Lapangan. Sistem ini memangkas birokrasi penanganan infrastruktur publik (seperti jalan berlubang, lampu PJU padam, drainase banjir, dan fasilitas umum rusak) menggunakan pencatatan titik koordinat GPS (*geo-tagging*), validasi spasial GIS, serta pelacakan pengerjaan lapangan yang transparan dari pelaporan hingga verifikasi Berita Acara (*Before/After*).

---

## 2. Arsitektur Teknologi

```
+---------------------------------------------------------------------------------+
|                                 FRONTEND CLIENT                                 |
|         Single Responsive Web Application (Tailwind CSS, Leaflet GIS, JS)       |
|  +--------------------+  +-------------------------+  +----------------------+  |
|  |    Citizen View    |  |     Field Crew View     |  |   Admin Pemda View   |  |
|  | - GPS & Map Picker |  | - Task Board Disposisi  |  | - KPI Metrics SLA    |  |
|  | - Photo Dropzone   |  | - Before/After Verif    |  | - Spatial GIS Map    |  |
|  | - 4-Stage Stepper  |  | - Status Tim Lapangan   |  | - Disposisi Tiket    |  |
|  +--------------------+  +-------------------------+  +----------------------+  |
+----------------------------------------+----------------------------------------+
                                         | RESTful JSON API / Static Asset Serving
                                         v
+---------------------------------------------------------------------------------+
|                              BACKEND SERVICE (RUST)                             |
|          Axum Framework 0.7 + Tokio Async Runtime + Tower HTTP + CORS           |
|                                                                                 |
|  [routes.rs] Router -> [handlers/] auth | incident | field_crew | admin         |
|  [models/] User, Incident, Timeline, Verification, Telemetry & Spatial Point    |
+----------------------------------------+----------------------------------------+
                                         | SQLx (Compile-time Checked Queries)
                                         v
+---------------------------------------------------------------------------------+
|                       DATABASE (POSTGRESQL 16 + POSTGIS 3.4)                    |
|                                                                                 |
|  - Ekstensi Spasial: postgis, uuid-ossp                                         |
|  - Tipe Data: GEOMETRY(Point, 4326) dengan GiST Spatial Indexing                |
|  - Fungsi Geospasial: ST_SetSRID, ST_MakePoint, ST_DWithin, ST_Distance        |
+---------------------------------------------------------------------------------+
```

---

## 3. Fitur Utama Berdasarkan 3 User Roles

### A. Warga (Citizen View)
- **Emergency Hotline 112**: Integrasi tombol panggilan darurat `Siaga 112` untuk keadaan darurat bencana/kecelakaan.
- **Formulir Pelaporan Terpadu**:
  - Pilihan kategori fasilitas (*Jalan Berlubang*, *PJU Padam*, *Drainase & Banjir*, *Taman & Fasilitas Anak*, *Rambu Lalu Lintas Rusak*).
  - *Auto-Geolocation Marker*: Deteksi otomatis koordinat GPS perangkat presisi tinggi serta peta interaktif dengan pin yang dapat digeser (*draggable marker*).
  - *Photo Evidence Dropzone*: Fitur seret & letak (*drag-and-drop*) foto kerusakan bukti fisik hingga 3 berkas dengan pratinjau thumbnail.
  - Deskripsi keluhan dengan penghitung karakter *real-time* (0/500).
  - Pengaturan privasi: Opsi pelaporan anonim (*Anonymous Report*) dan notifikasi otomatis WhatsApp/SMS.
- **Pelacak Status Real-time (4-Stage Stepper)**:
  - `Diajukan` ➔ `Disposisi Resmi` ➔ `Diproses Lapangan` ➔ `Verifikasi Selesai`.
- **Umpan Balik & Rating**: Penilaian kepuasan 1–5 bintang beserta ulasan warga setelah perbaikan selesai.

### B. Petugas Lapangan (Field Crew View)
- **Status Armada**: Indikator status kesiapan regu (*Siaga Aktif*, *Sedang Bertugas*, *Istirahat*).
- **Task Board / Papan Penugasan**: Daftar tugas perbaikan sesuai prioritas tingkat urgensi (Tinggi / Sedang / Normal) dan lokasi terdekat.
- **Mulai Tangani**: Memperbarui status pengerjaan ke `Diproses Lapangan`.
- **Modal Verifikasi Pekerjaan (Before/After)**:
  - Perbandingan berdampingan foto kondisi sebelum (*Before*) dan sesudah (*After*).
  - Formulir pencatatan material/suku cadang yang digunakan.
  - Catatan teknis pengerjaan lapangan.
  - Pernyataan resmi Berita Acara yang wajib dicentang untuk mengesahkan status `Verifikasi Selesai`.

### C. Admin Pemda (Command Center & GIS Dashboard)
- **4 Kartu Metrik KPI Operasional**: Total Laporan Masuk, Menunggu Disposisi, Sedang Diproses Lapangan, Selesai Diperbaiki.
- **Peta Geospasial Interaktif GIS (PostGIS)**:
  - Titik kerusakan berbasis koordinat spasial dengan warna sesuai tingkat urgensi (Merah: Bahaya/Tinggi, Oranye: Sedang, Biru: Diproses, Hijau: Selesai).
  - Posisi armada kendaraan teknis di peta.
  - Filter interaktif berdasarkan Kecamatan (Kedaton, Labuhan Ratu, Sukarame, Tanjung Karang, Way Halim) dan tingkat urgensi.
- **Tabel Disposisi Tiket**: Manajemen pencarian data, penolakan spam, dan penerbitan surat tugas ke regu teknis.
- **Panel Telemetri Operasional**: Cincin kemajuan pencapaian SLA (Target 87.5% selesai dalam 24 jam) dan form Siaran Peringatan Darurat Publik (*Public Emergency Broadcast*).

---

## 4. Komponen Footer Wajib (Mandatory Civic Footer)

Semua tata letak antarmuka memuat komponen footer universal:
- **Sisi Kiri**: Container/Placeholder Logo Pemda (`/assets/logo-pemda.png`).
- **Sisi Tengah**: Teks Hak Cipta Wajib:  
  `Copyright©2026 by Rafli Fadillah dan Dr. Erliyan Redy Susanto, M.Kom`
- **Sisi Kanan**: Container/Placeholder Logo Universitas Teknokrat Indonesia (`/assets/logo-uti.jpeg`).

---

## 5. Struktur Berkas Proyek

```
RAFLI FADILLAH/
├── Cargo.toml                       # Konfigurasi dependensi Rust (Axum, SQLx, Tokio, etc)
├── Dockerfile                       # Multi-stage Docker build untuk aplikasi Rust Axum
├── docker-compose.yml               # Orkestrasi Docker untuk PostgreSQL PostGIS + App
├── .env.example                     # Contoh variabel lingkungan
├── .env                             # Konfigurasi runtime aktif
├── dev-server.js                    # Server preview lokal mandiri
├── package.json                     # Helper skrip eksekusi
├── README.md                        # Dokumentasi teknis & panduan instalasi
├── migrations/
│   ├── 001_init_postgis.sql         # Skema tabel, tipe GEOMETRY(Point, 4326), & index GiST
│   └── 002_seed_data.sql            # Data contoh insiden, user, armada, & verifikasi
├── src/
│   ├── main.rs                      # Entrypoint utama async tokio & Axum listener
│   ├── config.rs                    # Manajemen konfigurasi environment
│   ├── error.rs                     # Standarisasi error handling Axum JSON response
│   ├── db.rs                        # Setup PostgreSQL connection pool & migrasi
│   ├── routes.rs                    # Registrasi route API & static asset middleware
│   ├── models/
│   │   ├── mod.rs                   # Modul model
│   │   ├── user.rs                  # Model akun, RBAC, dan JWT claims
│   │   ├── incident.rs              # Model insiden, timeline, dan verifikasi
│   │   └── telemetry.rs             # Model KPI, unit armada, dan titik spasial GIS
│   └── handlers/
│       ├── mod.rs                   # Modul handler
│       ├── auth.rs                  # Handler registrasi, login, & auth session
│       ├── incident.rs              # Handler CRUD laporan, upload foto, & rating
│       ├── field_crew.rs            # Handler tugas teknisi, status, & modal before/after
│       └── admin.rs                 # Handler KPI, query GIS PostGIS, & disposisi tiket
└── static/
    ├── index.html                   # Single Web Interface untuk 3 user roles
    ├── css/
    │   └── styles.css               # Desain token warna & style kustom
    ├── js/
    │   └── app.js                   # Logika frontend, Leaflet GIS, & integrasi API
    ├── uploads/                     # Direktori penyimpanan unggahan foto bukti
    └── assets/
        ├── logo-pemda.png           # Aset logo Pemerintah Daerah
        └── logo-uti.jpeg            # Aset logo Universitas Teknokrat Indonesia
```

---

## 6. Petunjuk Instalasi & Menjalankan Aplikasi

Anda dapat menjalankan sistem menggunakan salah satu dari metode berikut:

### Opsi 1: Menjalankan dengan Docker Compose (Sangat Direkomendasikan)
Metode ini otomatis menyiapkan container database PostgreSQL 16 lengkap dengan PostGIS 3.4 dan meng-compile aplikasi Rust.

1. Pastikan Docker Desktop telah berjalan di komputer Anda.
2. Buka terminal di folder proyek ini:
   ```bash
   docker-compose up -d --build
   ```
3. Akses aplikasi melalui browser pada alamat:
   ```
   http://localhost:8080
   ```

---

### Opsi 2: Menjalankan Backend Rust Secara Native

#### Prasyarat:
- Rust toolchain (v1.75+): `cargo` dan `rustc`
- Database PostgreSQL 16 dengan ekstensi PostGIS aktif

#### Langkah-langkah:
1. Pastikan PostgreSQL berjalan dan buat database:
   ```sql
   CREATE DATABASE smart_lapor_db;
   \c smart_lapor_db;
   CREATE EXTENSION postgis;
   CREATE EXTENSION "uuid-ossp";
   ```
2. Jalankan migrasi:
   ```bash
   psql -U postgres -d smart_lapor_db -f migrations/001_init_postgis.sql
   psql -U postgres -d smart_lapor_db -f migrations/002_seed_data.sql
   ```
3. Sesuaikan konfigurasi di file `.env`:
   ```ini
   DATABASE_URL=postgres://postgres:password_anda@localhost:5432/smart_lapor_db
   SERVER_HOST=0.0.0.0
   SERVER_PORT=8080
   ```
4. Jalankan aplikasi Rust:
   ```bash
   cargo run --release
   ```
5. Buka `http://localhost:8080` di browser Anda.

---

### Opsi 3: Preview Cepat Frontend (Instant Preview Server)
Jika ingin langsung menguji antarmuka dan seluruh fitur interaktif di browser secara instan tanpa database lokal:

```bash
node dev-server.js
# atau
npm start
```
Buka browser Anda di `http://localhost:8080`.

---

## 7. Dokumentasi Endpoint REST API

| Method | Endpoint | Peran / Deskripsi |
|---|---|---|
| `POST` | `/api/auth/register` | Pendaftaran akun baru warga / petugas |
| `POST` | `/api/auth/login` | Login akun & penerbitan token JWT |
| `GET` | `/api/incidents` | Daftar insiden dengan filter kategori & spasial |
| `POST` | `/api/incidents` | Pengiriman laporan baru (auto titik PostGIS) |
| `POST` | `/api/incidents/upload` | Unggah file foto bukti kerusakan |
| `GET` | `/api/incidents/:id` | Detail laporan, riwayat timeline, & verifikasi |
| `POST` | `/api/incidents/:id/feedback` | Pengiriman rating & ulasan kepuasan warga |
| `GET` | `/api/crew/tasks` | Daftar tugas pengerjaan regu lapangan |
| `PUT` | `/api/crew/tasks/:id/status` | Ubah status tugas ke `Diproses Lapangan` |
| `POST` | `/api/crew/tasks/:id/verify` | Pengesahan Berita Acara verifikasi *Before/After* |
| `GET/PUT` | `/api/crew/status` | Ambil / perbarui ketersediaan regu siaga |
| `GET` | `/api/admin/kpi` | Rekapitulasi metrik KPI & SLA insiden kota |
| `GET` | `/api/admin/gis/incidents` | Titik spasial insiden koordinat PostGIS |
| `GET` | `/api/admin/gis/units` | Posisi koordinat armada lapangan aktif |
| `POST` | `/api/admin/incidents/:id/assign` | Disposisi tiket ke regu dinas terkait |
| `POST` | `/api/admin/broadcast` | Siaran peringatan darurat serentak ke warga |

---

## 8. Hak Cipta & Lisensi

Sistem ini dikembangkan untuk keperluan akademik Proyek Pengembangan Sistem Informasi (PPSI).  
**Copyright©2026 by Rafli Fadillah dan Dr. Erliyan Redy Susanto, M.Kom.**  
Universitas Teknokrat Indonesia — Seluruh Hak Cipta Dilindungi Undang-Undang.

