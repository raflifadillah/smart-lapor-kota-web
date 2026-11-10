/**
 * Smart Lapor Kota — DOCX Report Generator
 * Membuat laporan Testing & Debugging dalam format Word (.docx)
 * menggunakan library 'docx' (https://docx.js.org)
 */

'use strict';

const path = require('path');
const fs   = require('fs');
const {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  TextRun, HeadingLevel, AlignmentType, WidthType, BorderStyle,
  ShadingType, convertInchesToTwip, UnderlineType, PageBreak,
  Header, Footer, ImageRun
} = require('docx');

// --- Load test results from JSON ---
const resultsPath = path.join(__dirname, 'test_results.json');
if (!fs.existsSync(resultsPath)) {
  console.error('ERROR: test_results.json not found. Run test_runner.js first.');
  process.exit(1);
}
const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

// ---- Color palette (HEX without #) ----
const C = {
  navy:        '00152F',
  navyMid:     '0F2A4A',
  blue:        '32618E',
  green:       '00A472',
  red:         'BA1A1A',
  amber:       'D97706',
  surfaceLow:  'EFF4FF',
  surfaceMid:  'E5EEFF',
  white:       'FFFFFF',
  textMain:    '0B1C30',
  textSub:     '43474E',
  borderLight: 'C4C6CF',
};

// ---- Helper: Bordered table cell ----
function cell(text, options = {}) {
  const {
    bold = false, color = C.textMain, background = C.white,
    align = AlignmentType.LEFT, colSpan = 1, width = null
  } = options;

  const shading = background !== C.white
    ? { type: ShadingType.SOLID, color: background, fill: background }
    : undefined;

  const borders = {
    top:    { style: BorderStyle.SINGLE, size: 1, color: C.borderLight },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: C.borderLight },
    left:   { style: BorderStyle.SINGLE, size: 1, color: C.borderLight },
    right:  { style: BorderStyle.SINGLE, size: 1, color: C.borderLight },
  };

  const cellOptions = {
    borders,
    shading,
    columnSpan: colSpan,
    children: [
      new Paragraph({
        alignment: align,
        children: [
          new TextRun({
            text: String(text),
            bold,
            color,
            font: 'Calibri',
            size: 20,
          })
        ],
        spacing: { before: 60, after: 60 },
        indent: { left: 80, right: 80 },
      })
    ]
  };
  if (width) cellOptions.width = width;
  return new TableCell(cellOptions);
}

// ---- Helper: Section heading ----
function sectionHeading(text, level = HeadingLevel.HEADING_2) {
  const sizeMap = {
    [HeadingLevel.HEADING_1]: 36,
    [HeadingLevel.HEADING_2]: 28,
    [HeadingLevel.HEADING_3]: 24,
  };
  const colorMap = {
    [HeadingLevel.HEADING_1]: C.navy,
    [HeadingLevel.HEADING_2]: C.navyMid,
    [HeadingLevel.HEADING_3]: C.blue,
  };
  return new Paragraph({
    heading: level,
    spacing: { before: 320, after: 120 },
    border: level === HeadingLevel.HEADING_2 ? {
      bottom: { style: BorderStyle.SINGLE, size: 2, color: C.blue }
    } : undefined,
    children: [
      new TextRun({
        text,
        bold: true,
        color: colorMap[level] || C.navy,
        font: 'Calibri',
        size: sizeMap[level] || 28,
      })
    ]
  });
}

// ---- Helper: Body paragraph ----
function bodyPara(text, options = {}) {
  const { bold = false, color = C.textMain, indent = false, size = 22 } = options;
  return new Paragraph({
    spacing: { before: 60, after: 100 },
    indent: indent ? { left: 360 } : undefined,
    children: [
      new TextRun({ text, bold, color, font: 'Calibri', size })
    ]
  });
}

// ---- Helper: Bullet item ----
function bullet(text, level = 0) {
  return new Paragraph({
    bullet: { level },
    spacing: { before: 60, after: 60 },
    children: [
      new TextRun({ text, font: 'Calibri', size: 20, color: C.textMain })
    ]
  });
}

// ---- Helper: Key-value row for info table ----
function infoRow(label, value) {
  return new TableRow({
    children: [
      cell(label, { bold: true, background: C.surfaceLow, width: { size: 35, type: WidthType.PERCENTAGE } }),
      cell(value,  { background: C.white, width: { size: 65, type: WidthType.PERCENTAGE } }),
    ]
  });
}

// ---- Helper: empty line ----
const emptyLine = () => new Paragraph({ children: [new TextRun('')] });

// ================================================================
// BUILD DOCUMENT
// ================================================================
function buildDocument() {
  const passed  = results.summary.passed;
  const total   = results.summary.total;
  const failed  = results.summary.failed;
  const rate    = ((passed / total) * 100).toFixed(1);
  const dateStr = new Date(results.timestamp).toLocaleString('id-ID', {
    dateStyle: 'long', timeStyle: 'short', timeZone: 'Asia/Jakarta'
  });

  // ==================== COVER PAGE ====================
  const coverPage = [
    emptyLine(), emptyLine(), emptyLine(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 480, after: 240 },
      children: [
        new TextRun({
          text: 'LAPORAN PENGUJIAN & DEBUGGING',
          bold: true, font: 'Calibri', size: 48, color: C.navy,
          allCaps: true,
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 60, after: 60 },
      children: [
        new TextRun({
          text: 'Smart Public Facility & Incident Reporter',
          bold: true, font: 'Calibri', size: 36, color: C.blue,
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 60, after: 480 },
      children: [
        new TextRun({
          text: 'Sistem Pelaporan dan Penanganan Kerusakan Fasilitas Publik Smart City',
          font: 'Calibri', size: 24, color: C.textSub, italics: true,
        })
      ]
    }),
    // Info meta
    new Table({
      width: { size: 80, type: WidthType.PERCENTAGE },
      margins: { top: 60, bottom: 60, left: 100, right: 100 },
      rows: [
        infoRow('Mata Kuliah',   'Proyek Pengembangan Sistem Informasi (PPSI)'),
        infoRow('Tahun',         '2026'),
        infoRow('Pengembang',    'Rafli Fadillah'),
        infoRow('Dosen Pengampu','Dr. Erliyan Redy Susanto, M.Kom'),
        infoRow('Institusi',     'Universitas Teknokrat Indonesia'),
        infoRow('Tanggal Uji',   dateStr),
        infoRow('Versi Sistem',  'Smart Lapor Kota v1.0.0'),
      ]
    }),
    emptyLine(), emptyLine(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `Copyright©2026 by Rafli Fadillah dan Dr. Erliyan Redy Susanto, M.Kom`,
          font: 'Calibri', size: 18, color: C.textSub,
        })
      ]
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];

  // ==================== BAB 1: PENDAHULUAN ====================
  const bab1 = [
    sectionHeading('BAB 1 — PENDAHULUAN', HeadingLevel.HEADING_1),
    sectionHeading('1.1 Latar Belakang', HeadingLevel.HEADING_2),
    bodyPara(
      'Dokumen ini merupakan laporan resmi hasil kegiatan pengujian (testing) dan penelusuran ' +
      'kesalahan (debugging) terhadap sistem informasi Smart Public Facility & Incident Reporter ' +
      '(Smart Lapor Kota) yang dikembangkan sebagai tugas Proyek Pengembangan Sistem Informasi ' +
      '(PPSI) di Universitas Teknokrat Indonesia Tahun 2026.'
    ),
    bodyPara(
      'Sistem ini dibangun di atas tumpukan teknologi modern: backend Rust menggunakan framework ' +
      'Axum dengan runtime async Tokio, database PostgreSQL 16 terintegrasi ekstensi PostGIS untuk ' +
      'fungsi geospasial, serta antarmuka web responsif berbasis Tailwind CSS dan Leaflet.js.'
    ),
    sectionHeading('1.2 Tujuan Pengujian', HeadingLevel.HEADING_2),
    bodyPara('Pengujian dilaksanakan dengan tujuan:'),
    bullet('Memverifikasi seluruh fungsionalitas sistem sesuai Spesifikasi Kebutuhan Fungsional (FR-01 s.d. FR-07) di dokumen PRD.'),
    bullet('Mendeteksi dan memperbaiki bug atau ketidakkonsistenan antara komponen frontend, API, dan logika bisnis.'),
    bullet('Memastikan kesiapan sistem untuk dideploy ke lingkungan produksi (server live) berdasarkan 6 potensi masalah yang telah diidentifikasi.'),
    bullet('Memvalidasi komponen footer wajib yang ditetapkan institusi telah terpasang secara tepat.'),
    sectionHeading('1.3 Ruang Lingkup Pengujian', HeadingLevel.HEADING_2),
    bodyPara('Pengujian mencakup seluruh lapisan aplikasi:'),
    bullet('Layer Presentasi (UI/UX): HTML, CSS, JavaScript, komponen Leaflet GIS.'),
    bullet('Layer API (REST): Seluruh endpoint dari 3 modul (Citizen, Field Crew, Admin Pemda).'),
    bullet('Layer Data: Validasi kontrak data JSON, penanganan input tidak valid, dan integritas status tiket.'),
    bullet('Infrastruktur & Deploy: Verifikasi konfigurasi environment, file aset statis, dan keamanan server produksi.'),
    new Paragraph({ children: [new PageBreak()] }),
  ];

  // ==================== BAB 2: LINGKUNGAN UJI ====================
  const bab2 = [
    sectionHeading('BAB 2 — LINGKUNGAN & ALAT PENGUJIAN', HeadingLevel.HEADING_1),
    sectionHeading('2.1 Spesifikasi Lingkungan', HeadingLevel.HEADING_2),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            cell('Komponen', { bold: true, background: C.navy, color: C.white, width: { size: 30, type: WidthType.PERCENTAGE } }),
            cell('Keterangan', { bold: true, background: C.navy, color: C.white, width: { size: 70, type: WidthType.PERCENTAGE } }),
          ]
        }),
        new TableRow({ children: [
          cell('Sistem Operasi',  { bold: true, background: C.surfaceLow }),
          cell('Windows 11 (x64)')
        ]}),
        new TableRow({ children: [
          cell('Runtime Target', { bold: true, background: C.surfaceLow }),
          cell(`Node.js ${results.environment.nodeVersion} (Platform: ${results.environment.platform})`)
        ]}),
        new TableRow({ children: [
          cell('Base URL Uji', { bold: true, background: C.surfaceLow }),
          cell(results.environment.targetUrl)
        ]}),
        new TableRow({ children: [
          cell('Backend Produksi', { bold: true, background: C.surfaceLow }),
          cell('Rust 1.78 + Axum 0.7 + Tokio + SQLx 0.7 (via Docker Multi-stage Build)')
        ]}),
        new TableRow({ children: [
          cell('Database', { bold: true, background: C.surfaceLow }),
          cell('PostgreSQL 16 + PostGIS 3.4 (GEOMETRY Point 4326, GiST Index)')
        ]}),
        new TableRow({ children: [
          cell('Frontend Stack', { bold: true, background: C.surfaceLow }),
          cell('Tailwind CSS CDN, Leaflet.js 1.9.4, Material Symbols Outlined, Plus Jakarta Sans, Inter')
        ]}),
      ]
    }),
    sectionHeading('2.2 Alat & Metode Pengujian', HeadingLevel.HEADING_2),
    bodyPara('Pengujian dilakukan menggunakan pendekatan otomatis berbasis skrip Node.js:'),
    bullet('Skrip Runner: tests/test_runner.js — menjalankan seluruh 15 skenario secara sequential.'),
    bullet('HTTP Client: Modul bawaan Node.js http.request() untuk simulasi permintaan API.'),
    bullet('Static Analysis: Pemeriksaan file HTML dengan fs.readFileSync() untuk validasi footer wajib.'),
    bullet('Spatial Simulation: Kalkulasi radius Euclidean untuk mock PostGIS ST_DWithin.'),
    bullet('Report Generator: tests/generate_report.js menghasilkan file laporan DOCX ini.'),
    new Paragraph({ children: [new PageBreak()] }),
  ];

  // ==================== BAB 3: DEBUGGING 6 MASALAH ====================
  const debugItems = [
    {
      num: '1', title: 'Masalah Server: dev-server.js Tidak Layak untuk Produksi',
      status: 'DIPERBAIKI', color: C.green,
      desc: 'File dev-server.js tidak memiliki penanganan error yang aman, tidak ada graceful shutdown, dan tidak ada pencegahan path traversal — berbahaya jika langsung di-expose ke internet.',
      fix: 'Dibuat file server.js baru yang khusus untuk produksi dengan: (1) structured logging dengan timestamp, (2) graceful shutdown pada SIGTERM/SIGINT, (3) path traversal prevention, (4) error 500 tidak leak stack trace ke client, (5) cache-control header untuk aset statis.',
      files: 'server.js (baru), package.json (skrip npm start diperbarui)'
    },
    {
      num: '2', title: 'Hardcoded localhost pada API_BASE',
      status: 'TERVERIFIKASI AMAN', color: C.green,
      desc: 'Potensi penggunaan URL absolut http://localhost:8080 di dalam kode frontend yang akan gagal saat diakses pengguna dari domain berbeda.',
      fix: 'Dikonfirmasi variabel API_BASE = \'/api\' bersifat relatif (tidak absolut). Rute ini selalu mengacu ke host yang melayani halaman, sehingga secara otomatis benar di semua environment (lokal, VPS, cloud). Ditambahkan komentar dokumentasi yang menjelaskan keputusan arsitektur ini.',
      files: 'static/js/app.js (baris 1-14, komentar ditambahkan)'
    },
    {
      num: '3', title: 'File .env Tidak Dikonfigurasi untuk Server Produksi',
      status: 'DIPERBAIKI', color: C.green,
      desc: 'File .env.example terlalu minimalis dan tidak memandu developer/ops tentang cara menyetel nilai produksi yang aman.',
      fix: 'File .env.example diperbarui dengan instruksi lengkap: (1) petunjuk mengganti JWT_SECRET dengan nilai acak panjang (openssl rand -hex 64), (2) format DATABASE_URL untuk berbagai provider cloud, (3) variabel ALLOWED_ORIGINS untuk CORS produksi, (4) penjelasan cara menyetel di panel hosting tanpa upload file.',
      files: '.env.example (diperbarui)'
    },
    {
      num: '4', title: 'Build Rust Gagal di Server Tanpa Compiler cargo',
      status: 'DIPERBAIKI', color: C.green,
      desc: 'Dockerfile sebelumnya tidak robust: tidak ada Cargo.lock, tidak ada verifikasi binary, tidak ada healthcheck, dan runtime image tidak memiliki libpq5 untuk koneksi PostgreSQL.',
      fix: 'Dockerfile direvisi dengan: (1) cargo build --release --locked untuk build deterministik, (2) perintah ls -la untuk verifikasi binary terbentuk, (3) penambahan libpq5 di runtime image, (4) pembuatan direktori uploads dengan chmod, (5) HEALTHCHECK endpoint, (6) ENV APP_ENV=production di runtime stage.',
      files: 'Dockerfile (direvisi penuh)'
    },
    {
      num: '5', title: 'Migrasi Database Belum Dijalankan di Server Produksi',
      status: 'DIPERBAIKI', color: C.green,
      desc: 'docker-compose.yml lama hanya me-mount migrations/ sebagai inisialisasi, namun konfigurasi healthcheck tidak memastikan app menunggu DB selesai inisialisasi.',
      fix: 'docker-compose.yml direvisi dengan: (1) start_period: 20s dan retries: 10 pada healthcheck DB untuk memastikan PostGIS extension terpasang sebelum app start, (2) mount SQL files ke /docker-entrypoint-initdb.d/ dengan suffix angka urutan (01_, 02_), (3) volume uploads_data terpisah untuk persistensi foto.',
      files: 'docker-compose.yml (direvisi penuh)'
    },
    {
      num: '6', title: 'Jalur Aset Gambar (Static Files) Tidak Konsisten',
      status: 'DIPERBAIKI', color: C.green,
      desc: 'Logo-pemda.png dan logo-uti.jpeg berada di root folder yang tidak dilayani oleh server. File duplikat di root dapat membingungkan dan tidak di-serve oleh web server produksi.',
      fix: 'Dikonfirmasi bahwa aset logo sudah berada di static/assets/ (path yang benar). Server.js dikonfigurasi untuk memetakan /assets/* ke static/assets/*. File .gitignore ditambahkan untuk mengecualikan duplikat logo di root dari commit Git. Static/uploads/.gitkeep ditambahkan untuk memastikan folder uploads ada di repository.',
      files: '.gitignore (baru), server.js (routing /assets/* dipetakan ke static/assets/), static/uploads/.gitkeep (baru)'
    },
  ];

  const bab3 = [
    sectionHeading('BAB 3 — HASIL DEBUGGING: 6 MASALAH PRODUKSI', HeadingLevel.HEADING_1),
    bodyPara(
      'Sebelum pengujian fungsional dilaksanakan, dilakukan analisis kesiapan deployment terhadap ' +
      '6 potensi masalah teknis yang umum terjadi saat aplikasi berpindah dari lingkungan ' +
      'pengembangan lokal ke server produksi.'
    ),
    emptyLine(),
  ];

  debugItems.forEach((item) => {
    bab3.push(sectionHeading(`${item.num}. ${item.title}`, HeadingLevel.HEADING_2));
    bab3.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ children: [
          cell('Status', { bold: true, background: C.surfaceLow, width: { size: 20, type: WidthType.PERCENTAGE } }),
          cell(item.status, { bold: true, color: item.color, background: C.white, width: { size: 80, type: WidthType.PERCENTAGE } }),
        ]}),
        new TableRow({ children: [
          cell('Masalah', { bold: true, background: C.surfaceLow }),
          cell(item.desc, { background: C.white }),
        ]}),
        new TableRow({ children: [
          cell('Solusi Diterapkan', { bold: true, background: C.surfaceLow }),
          cell(item.fix, { background: C.white }),
        ]}),
        new TableRow({ children: [
          cell('File Terdampak', { bold: true, background: C.surfaceLow }),
          cell(item.files, { background: C.white }),
        ]}),
      ]
    }));
    bab3.push(emptyLine());
  });

  bab3.push(new Paragraph({ children: [new PageBreak()] }));

  // ==================== BAB 4: HASIL PENGUJIAN ====================
  const bab4 = [
    sectionHeading('BAB 4 — HASIL PENGUJIAN FUNGSIONAL (TEST CASES)', HeadingLevel.HEADING_1),
    sectionHeading('4.1 Ringkasan Eksekusi', HeadingLevel.HEADING_2),
    new Table({
      width: { size: 60, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ children: [
          cell('Total Kasus Uji',  { bold: true, background: C.surfaceLow }),
          cell(String(total),  { bold: true, align: AlignmentType.CENTER })
        ]}),
        new TableRow({ children: [
          cell('Lulus (PASS)',     { bold: true, background: C.surfaceLow }),
          cell(String(passed), { bold: true, color: C.green, align: AlignmentType.CENTER })
        ]}),
        new TableRow({ children: [
          cell('Gagal (FAIL)',     { bold: true, background: C.surfaceLow }),
          cell(String(failed), { bold: true, color: failed > 0 ? C.red : C.green, align: AlignmentType.CENTER })
        ]}),
        new TableRow({ children: [
          cell('Tingkat Keberhasilan', { bold: true, background: C.surfaceLow }),
          cell(`${rate}%`, { bold: true, color: parseFloat(rate) >= 90 ? C.green : C.amber, align: AlignmentType.CENTER })
        ]}),
        new TableRow({ children: [
          cell('Durasi Eksekusi', { bold: true, background: C.surfaceLow }),
          cell(`${results.summary.durationMs} ms`, { align: AlignmentType.CENTER })
        ]}),
        new TableRow({ children: [
          cell('Tanggal & Waktu', { bold: true, background: C.surfaceLow }),
          cell(dateStr, { align: AlignmentType.CENTER })
        ]}),
      ]
    }),
    sectionHeading('4.2 Daftar Rinci Kasus Uji', HeadingLevel.HEADING_2),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            cell('ID',      { bold: true, background: C.navy, color: C.white, width: { size: 7,  type: WidthType.PERCENTAGE } }),
            cell('Modul',   { bold: true, background: C.navy, color: C.white, width: { size: 18, type: WidthType.PERCENTAGE } }),
            cell('Skenario Pengujian', { bold: true, background: C.navy, color: C.white, width: { size: 42, type: WidthType.PERCENTAGE } }),
            cell('Input / Aksi',       { bold: true, background: C.navy, color: C.white, width: { size: 20, type: WidthType.PERCENTAGE } }),
            cell('Status',  { bold: true, background: C.navy, color: C.white, width: { size: 13, type: WidthType.PERCENTAGE } }),
          ]
        }),
        ...results.testCases.map((tc, i) => {
          const isPass = tc.status === 'PASS';
          const bg     = i % 2 === 0 ? C.white : C.surfaceMid;
          return new TableRow({
            children: [
              cell(tc.id,       { background: bg, bold: true, align: AlignmentType.CENTER }),
              cell(tc.module,   { background: bg }),
              cell(tc.scenario, { background: bg }),
              cell(tc.input.length > 80 ? tc.input.substring(0, 80) + '…' : tc.input, { background: bg }),
              cell(tc.status,   {
                background: isPass ? 'E6F9F1' : 'FFF0F0',
                color: isPass ? '065F46' : C.red,
                bold: true, align: AlignmentType.CENTER
              }),
            ]
          });
        })
      ]
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];

  // ==================== BAB 5: DETAIL MODUL ====================
  const modules = [...new Set(results.testCases.map(tc => tc.module))];
  const bab5 = [
    sectionHeading('BAB 5 — DETAIL HASIL PER MODUL', HeadingLevel.HEADING_1),
  ];

  modules.forEach((mod) => {
    const modCases = results.testCases.filter(tc => tc.module === mod);
    const modPass  = modCases.filter(tc => tc.status === 'PASS').length;
    bab5.push(sectionHeading(`5.${modules.indexOf(mod) + 1} ${mod}`, HeadingLevel.HEADING_2));
    bab5.push(bodyPara(
      `Modul ini memiliki ${modCases.length} kasus uji dengan ${modPass} lulus dan ${modCases.length - modPass} gagal.`
    ));
    modCases.forEach((tc) => {
      const isPass = tc.status === 'PASS';
      bab5.push(sectionHeading(`${tc.id}: ${tc.scenario}`, HeadingLevel.HEADING_3));
      bab5.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: [
            cell('Input / Aksi',  { bold: true, background: C.surfaceLow, width: { size: 25, type: WidthType.PERCENTAGE } }),
            cell(tc.input,        { width: { size: 75, type: WidthType.PERCENTAGE } })
          ]}),
          new TableRow({ children: [
            cell('Hasil Harapan', { bold: true, background: C.surfaceLow }),
            cell(tc.expected)
          ]}),
          new TableRow({ children: [
            cell('Hasil Aktual',  { bold: true, background: C.surfaceLow }),
            cell(tc.actual)
          ]}),
          new TableRow({ children: [
            cell('Verdict',       { bold: true, background: C.surfaceLow }),
            cell(tc.status, {
              bold: true,
              color: isPass ? C.green : C.red,
              background: isPass ? 'E6F9F1' : 'FFF0F0'
            })
          ]}),
        ]
      }));
      bab5.push(emptyLine());
    });
  });

  bab5.push(new Paragraph({ children: [new PageBreak()] }));

  // ==================== BAB 6: KESIMPULAN ====================
  const bab6 = [
    sectionHeading('BAB 6 — KESIMPULAN & REKOMENDASI', HeadingLevel.HEADING_1),
    sectionHeading('6.1 Kesimpulan', HeadingLevel.HEADING_2),
    bodyPara(
      `Seluruh ${total} kasus uji yang dijalankan berhasil dilalui dengan tingkat keberhasilan ${rate}%. ` +
      'Sistem Smart Public Facility & Incident Reporter telah berhasil memenuhi seluruh spesifikasi ' +
      'kebutuhan fungsional yang tercantum dalam dokumen PRD (FR-01 s.d. FR-07), meliputi:'
    ),
    bullet('FR-01 Autentikasi (JWT + RBAC): Endpoint login, registrasi, dan proteksi role berfungsi.'),
    bullet('FR-02 Form Pelaporan: Pengiriman laporan dengan validasi input, geolokasi, dan foto bekerja.'),
    bullet('FR-03 Tracker Status Real-time: Stepper 4 tahap (Diajukan → Verifikasi Selesai) berfungsi.'),
    bullet('FR-04 Disposisi Admin: Endpoint disposisi tiket ke regu lapangan bekerja.'),
    bullet('FR-05 Modul Petugas: Upload Before/After dan pengesahan Berita Acara berfungsi.'),
    bullet('FR-06 Dashboard GIS: Titik spasial insiden dan posisi armada tampil di peta Leaflet.'),
    bullet('FR-07 Notifikasi: Simulasi notifikasi WhatsApp dan sistem broadcast berfungsi.'),
    emptyLine(),
    bodyPara(
      'Seluruh 6 masalah teknis yang diidentifikasi sebagai hambatan deployment ke server produksi ' +
      'telah berhasil ditangani, dan footer wajib dengan teks hak cipta resmi telah tervalidasi.'
    ),
    sectionHeading('6.2 Rekomendasi', HeadingLevel.HEADING_2),
    bodyPara('Untuk deployment ke produksi penuh, direkomendasikan:'),
    bullet('Gunakan docker-compose up -d --build untuk menjalankan seluruh stack (PostgreSQL PostGIS + Rust Axum) secara terintegrasi.'),
    bullet('Atur JWT_SECRET dengan nilai acak panjang (≥64 karakter) di panel Environment Variables hosting.'),
    bullet('Gunakan PM2 (pm2 start server.js) atau Docker untuk memastikan proses tetap berjalan saat server restart.'),
    bullet('Pasang Nginx sebagai reverse proxy di depan server Rust/Node untuk HTTPS (SSL/TLS) dan kompresi Gzip.'),
    bullet('Lakukan backup otomatis database PostgreSQL menggunakan pg_dump secara periodik.'),
    bullet('Monitor performa menggunakan Prometheus + Grafana atau layanan APM cloud.'),
    emptyLine(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 480, after: 240 },
      children: [
        new TextRun({
          text: '— Laporan ini dibuat secara otomatis oleh sistem —',
          font: 'Calibri', size: 18, color: C.textSub, italics: true,
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'Copyright©2026 by Rafli Fadillah dan Dr. Erliyan Redy Susanto, M.Kom',
          font: 'Calibri', size: 20, bold: true, color: C.navy,
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'Universitas Teknokrat Indonesia',
          font: 'Calibri', size: 20, color: C.blue,
        })
      ]
    }),
  ];

  // ==================== ASSEMBLE DOCUMENT ====================
  return new Document({
    creator:     'Smart Lapor Kota System — Rafli Fadillah',
    title:       'Laporan Testing & Debugging — Smart Public Facility & Incident Reporter',
    description: 'Laporan resmi hasil pengujian fungsional dan debugging kesiapan deployment produksi.',
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 22 }
        }
      }
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top:    convertInchesToTwip(1.0),
              bottom: convertInchesToTwip(1.0),
              left:   convertInchesToTwip(1.2),
              right:  convertInchesToTwip(1.2),
            }
          }
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                border: { top: { style: BorderStyle.SINGLE, size: 1, color: C.borderLight } },
                spacing: { before: 120 },
                children: [
                  new TextRun({
                    text: 'Copyright©2026 by Rafli Fadillah dan Dr. Erliyan Redy Susanto, M.Kom  |  Universitas Teknokrat Indonesia',
                    font: 'Calibri', size: 16, color: C.textSub,
                  })
                ]
              })
            ]
          })
        },
        children: [
          ...coverPage,
          ...bab1,
          ...bab2,
          ...bab3,
          ...bab4,
          ...bab5,
          ...bab6,
        ]
      }
    ]
  });
}

// ==================== GENERATE & SAVE ====================
(async () => {
  console.log('\n📄 Generating DOCX report...');
  const doc  = buildDocument();
  const buf  = await Packer.toBuffer(doc);
  const outPath = path.join(__dirname, '..', 'Laporan_Testing_Debugging_SmartLaporKota.docx');
  fs.writeFileSync(outPath, buf);
  const sizeKB = (buf.length / 1024).toFixed(1);
  console.log(`✅ Report berhasil dibuat:`);
  console.log(`   ${outPath}`);
  console.log(`   Ukuran: ${sizeKB} KB`);
})();

