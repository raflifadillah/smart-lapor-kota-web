# Product Requirement Document (PRD)
## Smart Public Facility & Incident Reporter
**Sistem Pelaporan dan Penanganan Kerusakan Fasilitas Publik Smart City**

---

### Meta Information
- **Mata Kuliah**: Proyek Pengembangan Sistem Informasi
- **Tahun**: 2026
- **Pengembang**: [Nama Mahasiswa]
- **NPM**: [NPM Anda]
- **Dosen Pengampu**: Dr. Erliyan Redy Susanto, M.Kom
- **Institusi**: Universitas Teknokrat Indonesia

---

## 1. Pendahuluan & Ringkasan Proyek

### 1.1 Latar Belakang
Perkembangan tata kelola perkotaan modern berbasis *Smart City* menuntut adanya interaksi yang cepat, transparan, dan terukur antara masyarakat dengan Pemerintah Daerah (Pemda). Masalah infrastruktur publik seperti jalan berlubang, lampu penerangan jalan umum (PJU) padam, saluran air tersumbat, dan kerusakan fasilitas umum lainnya sering kali terlambat ditangani karena keterbatasan saluran pelaporan yang terstruktur.

### 1.2 Visi & Solusi
Aplikasi *Smart Public Facility & Incident Reporter* dirancang untuk memangkas birokrasi pelaporan. Warga dapat mengunggah laporan kerusakan secara *real-time* yang secara otomatis terikat dengan koordinat GPS (*geo-tagging*), lalu sistem secara otomatis melakukan *routing* laporan ke dinas/petugas teknis terdekat. Penanganan disajikan transparan dari status 'Diajukan' hingga 'Selesai'.

### 1.3 Tujuan Utama Proyek
Menyediakan platform pelaporan publik yang responsif, berkinerja tinggi, aman, dan terintegrasi dengan *backend* Rust dan database PostgreSQL/PostGIS untuk mendukung tata kelola kota yang berbasis data.

---

## 2. Analisis Pengguna & User Roles

Sistem ini memiliki 3 aktor utama:

1. **Masyarakat (Warga)**:
   - Membuat laporan kerusakan dengan foto, deskripsi, dan titik lokasi GPS otomatis.
   - Melacak status penanganan laporan secara *real-time*.
   - Memberikan umpan balik atau *rating* setelah perbaikan selesai.

2. **Petugas Lapangan (Field Crew)**:
   - Menerima disposisi tiket tugas perbaikan berdasarkan lokasi terdekat.
   - Mengunggah foto verifikasi pengerjaan (*Before & After*).
   - Memperbarui status penanganan menjadi 'Diproses' atau 'Selesai'.

3. **Admin Dinas / Pemda (Operator & Eksekutif)**:
   - Memverifikasi laporan masuk dan menyaring laporan valid/spam.
   - Mendisposisikan tiket perbaikan ke unit atau petugas lapangan terkait.
   - Memantau sebaran insiden kota melalui peta GIS interaktif dan dashboard analitik SLA.

---

## 3. Spesifikasi Kebutuhan Fungsional (Functional Requirements)

| ID Req | Modul | Deskripsi Kebutuhan Fungsional | Prioritas |
| :--- | :--- | :--- | :--- |
| **FR-01** | Autentikasi | Pendaftaran & Login akun warga dan petugas berbasis JWT & Role-Based Access Control (RBAC). | Tinggi |
| **FR-02** | Form Pelaporan | Formulir pengiriman laporan publik dengan auto-geolocator GPS, unggah foto bukti, dan kategori kerusakan. | Tinggi |
| **FR-03** | Tracker Status | Fitur pelacakan status laporan *real-time* (`Diajukan` -> `Disposisi` -> `Diproses` -> `Selesai`). | Tinggi |
| **FR-04** | Disposisi Admin | Dashboard admin untuk verifikasi laporan, penolakan spam, dan penerbitan tiket ke petugas. | Tinggi |
| **FR-05** | Modul Petugas | Antarmuka khusus petugas lapangan untuk upload bukti perbaikan (*Before & After*) dan konfirmasi lokasi. | Sedang |
| **FR-06** | Dashboard GIS | Peta geospasial interaktif publik dan admin untuk sebaran insiden kota. | Sedang |
| **FR-07** | Notifikasi | Sistem notifikasi aktivitas perbaikan status laporan. | Rendah |

---

## 4. Validasi Arsitektur Teknologi

### 4.1 Backend (Rust)
- **Framework**: Axum / Actix-Web dengan runtime asynchronous `tokio`.
- **Database Driver**: `sqlx` dengan *compile-time SQL checking*.
- **Alasan**: *Memory safety* tanpa *Garbage Collector*, mencegah *buffer overflow*, dan mampu menangani *high concurrency* (100k+ RPS) dengan konsumsi memori minim.

### 4.2 Database (PostgreSQL + PostGIS)
- **Database**: PostgreSQL 16.
- **Ekstensi Spasial**: PostGIS (tipe data `GEOMETRY(Point, 4326)` dan indeks spatial `GiST`).
- **Alasan**: Efisiensi pencarian radius geospasial (misal: mencari laporan kerusakan dalam radius 2 km) dan kepatuhan terhadap ACID untuk integritas data penugasan.

---

## 5. Ketentuan Khusus Interface & Footer Wajib

Setiap antarmuka aplikasi Wajib menyertakan komponen **Footer** terstandar dengan susunan sebagai berikut:

1. **Sisi Kiri**: Container/Placeholder Logo Pemda (Pemerintah Daerah).
2. **Sisi Tengah**: Teks Hak Cipta resmi Wajib dengan format persis:  
   `Copyright©2026 by [Nama Mahasiswa] dan Dr. Erliyan Redy Susanto, M.Kom`
3. **Sisi Kanan**: Container/Placeholder Logo Universitas Teknokrat Indonesia.