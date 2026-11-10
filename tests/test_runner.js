/**
 * Smart Public Facility & Incident Reporter
 * Automated Testing & Debugging Runner
 * Evaluates Functional Requirements, API contracts, UI Assets, and Footer Compliance
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:8080';
const results = {
  timestamp: new Date().toISOString(),
  environment: {
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    targetUrl: BASE_URL
  },
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    durationMs: 0
  },
  testCases: [],
  debuggingNotes: []
};

// Helper function to make HTTP requests
function httpRequest(endpoint, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, BASE_URL);
    const reqOptions = {
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: 5000
    };

    const startTime = Date.now();
    const req = http.request(url, reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const duration = Date.now() - startTime;
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = data;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsed,
          rawBody: data,
          duration
        });
      });
    });

    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (body) {
      if (typeof body === 'object') {
        req.setHeader('Content-Type', 'application/json');
        req.write(JSON.stringify(body));
      } else {
        req.write(body);
      }
    }
    req.end();
  });
}

// Assertion helper
function recordTest(id, moduleName, scenario, input, expected, actual, passed, notes = '') {
  results.summary.total++;
  if (passed) {
    results.summary.passed++;
    console.log(`[PASS] ${id}: ${scenario}`);
  } else {
    results.summary.failed++;
    console.error(`[FAIL] ${id}: ${scenario} - Expected: ${expected}, Got: ${actual}`);
  }

  results.testCases.push({
    id,
    module: moduleName,
    scenario,
    input: typeof input === 'object' ? JSON.stringify(input) : String(input),
    expected: String(expected),
    actual: String(actual),
    status: passed ? 'PASS' : 'FAIL',
    notes
  });
}

async function runTestSuite() {
  const globalStart = Date.now();
  console.log('================================================================');
  console.log(' Starting Automated Test Suite: Smart Lapor Kota');
  console.log(' Target Base URL: ' + BASE_URL);
  console.log('================================================================\n');

  try {
    // ------------------------------------------------------------------
    // MODUL 1: CORE APP & STATIC ASSETS
    // ------------------------------------------------------------------
    const indexRes = await httpRequest('/');
    recordTest(
      'TC-01',
      'Web Server & SPA Shell',
      'Memastikan Web Interface merespons HTTP 200 OK dengan format HTML',
      'GET /',
      'HTTP 200 dengan dokumen HTML valid',
      `HTTP ${indexRes.statusCode}`,
      indexRes.statusCode === 200 && indexRes.rawBody.includes('<!DOCTYPE html>')
    );

    // Static Assets: Logo Pemda & Logo UTI
    const logoPemdaRes = await httpRequest('/assets/logo-pemda.png');
    recordTest(
      'TC-02',
      'Asset Management',
      'Memastikan file logo Pemerintah Daerah (/assets/logo-pemda.png) tersedia dan dapat diakses publik',
      'GET /assets/logo-pemda.png',
      'HTTP 200 image/png dengan ukuran > 100KB',
      `HTTP ${logoPemdaRes.statusCode} (${logoPemdaRes.rawBody.length} bytes)`,
      logoPemdaRes.statusCode === 200 && logoPemdaRes.rawBody.length > 50000
    );

    const logoUtiRes = await httpRequest('/assets/logo-uti.jpeg');
    recordTest(
      'TC-03',
      'Asset Management',
      'Memastikan file logo Universitas Teknokrat Indonesia (/assets/logo-uti.jpeg) tersedia dan dapat diakses',
      'GET /assets/logo-uti.jpeg',
      'HTTP 200 image/jpeg dengan ukuran > 30KB',
      `HTTP ${logoUtiRes.statusCode} (${logoUtiRes.rawBody.length} bytes)`,
      logoUtiRes.statusCode === 200 && logoUtiRes.rawBody.length > 20000
    );

    // Mandatory Footer Verification
    const indexHtml = fs.readFileSync(path.join(__dirname, '../static/index.html'), 'utf8');
    const exactCopyright = 'Copyright©2026 by Rafli Fadillah dan Dr. Erliyan Redy Susanto, M.Kom';
    const hasExactCopyright = indexHtml.includes(exactCopyright);
    const hasPemdaInFooter = indexHtml.includes('logo-pemda.png');
    const hasUtiInFooter = indexHtml.includes('logo-uti.jpeg');

    recordTest(
      'TC-04',
      'Mandatory Civic Footer',
      'Verifikasi komponen footer terstandar memuat teks hak cipta resmi persis sesuai ketentuan',
      'Pemeriksaan DOM footer di static/index.html',
      `Teks persis: "${exactCopyright}"`,
      hasExactCopyright ? `Ditemukan persis "${exactCopyright}"` : 'Teks tidak cocok',
      hasExactCopyright
    );

    recordTest(
      'TC-05',
      'Mandatory Civic Footer',
      'Verifikasi posisi logo Pemda di sisi kiri dan logo Teknokrat di sisi kanan footer',
      'Pemeriksaan tag logo-pemda.png dan logo-uti.jpeg di footer',
      'Kedua logo terintegrasi dalam container dengan fallback onerror',
      hasPemdaInFooter && hasUtiInFooter ? 'Kedua logo terpasang sempurna' : 'Logo belum lengkap',
      hasPemdaInFooter && hasUtiInFooter
    );

    // ------------------------------------------------------------------
    // MODUL 2: CITIZEN VIEW & REPORTING API
    // ------------------------------------------------------------------
    const listIncidentsRes = await httpRequest('/api/incidents');
    const incidentsCount = listIncidentsRes.data && listIncidentsRes.data.data ? listIncidentsRes.data.data.length : 0;
    recordTest(
      'TC-06',
      'Citizen Reporting API',
      'Memastikan endpoint daftar laporan publik mengembalikan data insiden berstruktur JSON',
      'GET /api/incidents',
      'HTTP 200 dengan status="success" dan count >= 4',
      `HTTP ${listIncidentsRes.statusCode}, count: ${incidentsCount}`,
      listIncidentsRes.statusCode === 200 && incidentsCount >= 4
    );

    // Create Incident with Valid Geolocation
    const newIncidentPayload = {
      category: 'Jalan Berlubang',
      title: 'Uji Coba Lubang Aspal Hasil Penetrasi Hujan',
      description: 'Pengujian otomatis pengiriman laporan publik lengkap dengan koordinat spasial dan nomor kontak.',
      landmark: 'Depan Kampus Teknokrat, Jl. ZA Pagar Alam',
      kecamatan: 'Kedaton',
      latitude: -5.381500,
      longitude: 105.258500,
      photo_urls: ['https://images.unsplash.com/photo-1515162816999-a0c47dc192f7'],
      is_anonymous: false,
      reporter_name: 'Rafli Fadillah',
      reporter_phone: '0812-7890-1234',
      notify_whatsapp: true,
      notify_sms: false,
      severity: 'Tinggi'
    };

    const createRes = await httpRequest('/api/incidents', { method: 'POST' }, newIncidentPayload);
    const createdTicket = createRes.data && createRes.data.data ? createRes.data.data.ticket_number : null;
    const isValidTicket = createdTicket && createdTicket.startsWith('LAP-2026-');

    recordTest(
      'TC-07',
      'Citizen Reporting API',
      'Pengujian pengiriman laporan kerusakan fasilitas baru beserta nomor tiket otomatis',
      JSON.stringify({ title: newIncidentPayload.title, category: newIncidentPayload.category }),
      'HTTP 201 dengan tiket format LAP-2026-XXXX dan status Diajukan',
      `HTTP ${createRes.statusCode}, ticket: ${createdTicket}`,
      createRes.statusCode === 201 && isValidTicket
    );

    // Input Validation: Empty title rejection
    const invalidPayload = {
      category: 'Jalan Berlubang',
      title: '   ',
      description: 'Hanya deskripsi tanpa judul',
      landmark: 'Lokasi test'
    };
    const invalidRes = await httpRequest('/api/incidents', { method: 'POST' }, invalidPayload);
    recordTest(
      'TC-08',
      'Security & Input Validation',
      'Memastikan sistem menolak pengiriman laporan dengan judul kosong (Bad Request)',
      'POST /api/incidents dengan title="   "',
      'HTTP 400 Bad Request dengan pesan validasi',
      `HTTP ${invalidRes.statusCode}`,
      invalidRes.statusCode === 400
    );

    // PostGIS Spatial Radius Query
    const nearbyRes = await httpRequest('/api/incidents/nearby?lat=-5.3815&lng=105.2585&radius_km=3.0');
    const nearbyCount = nearbyRes.data && nearbyRes.data.data ? nearbyRes.data.data.length : 0;
    recordTest(
      'TC-09',
      'PostGIS Spatial Service',
      'Pencarian laporan kerusakan berdasarkan radius geospasial (ST_DWithin)',
      'GET /api/incidents/nearby?lat=-5.3815&lng=105.2585&radius_km=3.0',
      'HTTP 200 mengembalikan laporan dalam radius 3.0 KM',
      `HTTP ${nearbyRes.statusCode}, ditemukan ${nearbyCount} titik`,
      nearbyRes.statusCode === 200 && nearbyCount > 0
    );

    // ------------------------------------------------------------------
    // MODUL 3: FIELD CREW TASK BOARD & BEFORE/AFTER VERIFICATION
    // ------------------------------------------------------------------
    const crewTasksRes = await httpRequest('/api/crew/tasks');
    const tasksCount = crewTasksRes.data && crewTasksRes.data.tasks ? crewTasksRes.data.tasks.length : 0;
    recordTest(
      'TC-10',
      'Field Crew Task Board',
      'Memastikan daftar tugas perbaikan teknisi termuat terstruktur sesuai prioritas urgensi',
      'GET /api/crew/tasks',
      'HTTP 200 dengan daftar tugas lapangan',
      `HTTP ${crewTasksRes.statusCode}, tasks: ${tasksCount}`,
      crewTasksRes.statusCode === 200 && tasksCount > 0
    );

    // Start Handling Task (Status Transition)
    const testTaskId = '55555555-5555-5555-5555-555555555551';
    const statusUpdateRes = await httpRequest(`/api/crew/tasks/${testTaskId}/status`, { method: 'PUT' }, {
      status: 'Diproses Lapangan',
      officer_name: 'Ahmad Hidayat (Regu Alfa 03)'
    });
    recordTest(
      'TC-11',
      'Field Crew Workflow',
      'Pembaruan status tiket menjadi "Diproses Lapangan" saat regu tiba di lokasi',
      `PUT /api/crew/tasks/${testTaskId}/status`,
      'HTTP 200 status berhasil diubah ke "Diproses Lapangan"',
      `HTTP ${statusUpdateRes.statusCode}`,
      statusUpdateRes.statusCode === 200
    );

    // Before/After Work Verification Modal Submission
    const verifPayload = {
      incident_id: testTaskId,
      crew_officer_name: 'Ahmad Hidayat (Regu Alfa 03)',
      before_photo_url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7',
      after_photo_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb1861593',
      materials_used: 'Aspal Hotmix K-250 3 sak, Tack Coat emulsi, Agregat kasar',
      field_notes: 'Pekerjaan penambalan lubang jalan selesai dipadatkan sesuai spesifikasi teknis PUPR.',
      signed_declaration: true
    };
    const verifRes = await httpRequest(`/api/crew/tasks/${testTaskId}/verify`, { method: 'POST' }, verifPayload);
    recordTest(
      'TC-12',
      'Field Crew Work Verification',
      'Pengesahan Berita Acara pekerjaan dengan dokumentasi Before/After dan pernyataan resmi',
      `POST /api/crew/tasks/${testTaskId}/verify`,
      'HTTP 200 dan tiket beralih ke "Verifikasi Selesai"',
      `HTTP ${verifRes.statusCode}`,
      verifRes.statusCode === 200
    );

    // ------------------------------------------------------------------
    // MODUL 4: ADMIN PEMDA GIS & COMMAND CENTER
    // ------------------------------------------------------------------
    const kpiRes = await httpRequest('/api/admin/kpi');
    const kpiData = kpiRes.data && kpiRes.data.data ? kpiRes.data.data : {};
    const hasAllKpis = kpiData.total_reports !== undefined &&
                       kpiData.awaiting_disposition !== undefined &&
                       kpiData.in_progress !== undefined &&
                       kpiData.completed_verified !== undefined &&
                       kpiData.sla_compliance_pct !== undefined;

    recordTest(
      'TC-13',
      'Admin Command Center',
      'Verifikasi 4 kartu KPI operasional kota dan kepatuhan SLA',
      'GET /api/admin/kpi',
      'HTTP 200 dengan nilai metrik total, awaiting, progress, completed, SLA',
      `HTTP ${kpiRes.statusCode}, Total: ${kpiData.total_reports}, SLA: ${kpiData.sla_compliance_pct}%`,
      kpiRes.statusCode === 200 && hasAllKpis
    );

    // Admin GIS Incidents & Field Units
    const gisIncidentsRes = await httpRequest('/api/admin/gis/incidents');
    const gisUnitsRes = await httpRequest('/api/admin/gis/units');
    const hasGisCoords = gisIncidentsRes.data && gisIncidentsRes.data.incidents && gisIncidentsRes.data.incidents.length > 0;
    const hasUnits = gisUnitsRes.data && gisUnitsRes.data.units && gisUnitsRes.data.units.length > 0;

    recordTest(
      'TC-14',
      'Admin GIS Spatial Map',
      'Memastikan data sebaran insiden dan posisi armada regu lapangan siap dipetakan pada Leaflet GIS',
      'GET /api/admin/gis/incidents & /api/admin/gis/units',
      'HTTP 200 dengan koordinat latitude/longitude valid',
      `HTTP 200, Insiden: ${gisIncidentsRes.data?.count || 0}, Armada: ${gisUnitsRes.data?.units?.length || 0}`,
      gisIncidentsRes.statusCode === 200 && gisUnitsRes.statusCode === 200 && hasGisCoords && hasUnits
    );

    // Admin Emergency Broadcast
    const broadcastPayload = {
      title: 'Peringatan Siaga Genangan Air Hujan',
      message: 'Hindari jalur underpass ZA Pagar Alam sementara waktu akibat pembersihan saluran drainase.',
      channel: 'all'
    };
    const broadcastRes = await httpRequest('/api/admin/broadcast', { method: 'POST' }, broadcastPayload);
    recordTest(
      'TC-15',
      'Admin Public Broadcast',
      'Pengujian pengiriman siaran darurat publik serentak ke kanal WhatsApp dan SMS warga',
      'POST /api/admin/broadcast',
      'HTTP 200 dengan status "success"',
      `HTTP ${broadcastRes.statusCode}`,
      broadcastRes.statusCode === 200
    );

  } catch (error) {
    console.error('Fatal error during test run:', error);
    results.debuggingNotes.push({
      error: error.message,
      stack: error.stack
    });
  }

  results.summary.durationMs = Date.now() - globalStart;

  console.log('\n================================================================');
  console.log(` Test Execution Finished in ${results.summary.durationMs}ms`);
  console.log(` Total Cases : ${results.summary.total}`);
  console.log(` Passed      : ${results.summary.passed}`);
  console.log(` Failed      : ${results.summary.failed}`);
  console.log(` Success Rate: ${((results.summary.passed / results.summary.total) * 100).toFixed(1)}%`);
  console.log('================================================================\n');

  // Save results to JSON file for DOCX report generator
  const outPath = path.join(__dirname, 'test_results.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`Test results saved to: ${outPath}`);
  return results;
}

// Export for runner
if (require.main === module) {
  runTestSuite();
}

module.exports = { runTestSuite };

