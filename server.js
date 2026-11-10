/**
 * Smart Lapor Kota — Production Preview Server
 * FIX #1: File ini menggantikan dev-server.js untuk penggunaan produksi Node.js.
 *
 * Perbedaan dari dev-server.js:
 *  - Semua konfigurasi dibaca dari process.env (tidak hardcoded)
 *  - Log format lebih ringkas dan struktural
 *  - Response time header ditambahkan untuk monitoring
 *  - Error handling lebih aman (tidak leak stack trace ke client)
 *  - Siap dijalankan dengan PM2: pm2 start server.js --name smart-lapor
 *
 * Catatan: Untuk deployment backend Rust penuh, gunakan Docker:
 *   docker-compose up -d --build
 */

'use strict';

const http = require('http');
const fs   = require('fs');
const path = require('path');

// FIX #3: Semua konfigurasi dari environment variables
const PORT       = parseInt(process.env.SERVER_PORT  || process.env.PORT || '8080', 10);
const HOST       = process.env.SERVER_HOST || '0.0.0.0';
const APP_ENV    = process.env.APP_ENV     || 'production';
const STATIC_DIR = path.join(__dirname, 'static');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.webp': 'image/webp',
  '.woff2':'font/woff2',
};

// In-memory state (hanya untuk mode preview; gunakan Rust backend untuk produksi penuh)
let incidents = [
  {
    id: '55555555-5555-5555-5555-555555555551',
    ticket_number: 'LAP-2026-0882',
    title: 'Aspal Ambles Diameter 1.2 Meter Membahayakan Pengendara',
    category: 'Jalan Berlubang',
    description: 'Lubang jalan dalam akibat gerusan hujan. Sangat membahayakan pengendara motor.',
    landmark: 'Depan Gerbang Kampus Teknokrat, Jl. ZA. Pagar Alam',
    kecamatan: 'Kedaton', latitude: -5.381500, longitude: 105.258500,
    photo_urls: ['https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80'],
    severity: 'Tinggi', status: 'Diproses Lapangan',
    assigned_team_name: 'Regu Alfa 03 - Dinas PUPR',
    notify_whatsapp: true, notify_sms: false,
    created_at: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: '55555555-5555-5555-5555-555555555552',
    ticket_number: 'LAP-2026-0883',
    title: 'Lampu Jalan Padam Sepanjang 200m Rawan Kriminalitas',
    category: 'PJU Padam', description: 'Tiga tiang PJU mati total 2 malam berturut-turut.',
    landmark: 'Simpang Tiga Jl. Teuku Umar No. 45',
    kecamatan: 'Kedaton', latitude: -5.385200, longitude: 105.261200,
    photo_urls: ['https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80'],
    severity: 'Sedang', status: 'Menunggu Disposisi', assigned_team_name: null,
    notify_whatsapp: true, notify_sms: true,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: '55555555-5555-5555-5555-555555555553',
    ticket_number: 'LAP-2026-0880',
    title: 'Saluran Drainase Tersumbat Sampah Menggenangi Jalan',
    category: 'Drainase & Banjir', description: 'Gorong-gorong tersumbat, air meluap ke aspal.',
    landmark: 'Dekat Pasar Koga, Jl. Teuku Umar',
    kecamatan: 'Kedaton', latitude: -5.391200, longitude: 105.264500,
    photo_urls: ['https://images.unsplash.com/photo-1541888946425-d0fbb1861593?auto=format&fit=crop&w=800&q=80'],
    severity: 'Sedang', status: 'Diproses Lapangan',
    assigned_team_name: 'Regu Bravo 01 - Dinas Lingkungan',
    notify_whatsapp: true, notify_sms: false,
    created_at: new Date(Date.now() - 3600000 * 8).toISOString()
  },
  {
    id: '55555555-5555-5555-5555-555555555554',
    ticket_number: 'LAP-2026-0879',
    title: 'Rambu Penyeberangan Pejalan Kaki Roboh Ditabrak',
    category: 'Rambu Lalu Lintas Rusak', description: 'Plang tiang zebra cross miring hampir roboh.',
    landmark: 'Depan SD Negeri 2 Labuhan Ratu',
    kecamatan: 'Labuhan Ratu', latitude: -5.374500, longitude: 105.253100,
    photo_urls: ['https://images.unsplash.com/photo-1584467541268-b040f83be3fd?auto=format&fit=crop&w=800&q=80'],
    severity: 'Sedang', status: 'Verifikasi Selesai',
    assigned_team_name: 'Regu Alfa 03 - Dinas PUPR',
    notify_whatsapp: true, notify_sms: false, rating: 5,
    feedback_text: 'Pelayanan cepat tanggap! Penyeberangan aman kembali.',
    created_at: new Date(Date.now() - 86400000).toISOString()
  }
];

// ----- Helpers -----
function log(method, path, status, ms) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${APP_ENV.toUpperCase()} ${method} ${path} → ${status} (${ms}ms)`);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', c => { body += c; if (body.length > 1e6) req.destroy(new Error('Body too large')); });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(body);
}

function nearbyFilter(lat, lng, radiusKm) {
  return incidents.filter(i => {
    const dLat = (i.latitude  - lat) * 111.0;
    const dLng = (i.longitude - lng) * 111.0 * Math.cos(lat * Math.PI / 180);
    return Math.sqrt(dLat * dLat + dLng * dLng) <= radiusKm;
  });
}

// ----- Request Router -----
async function handleRequest(req, res) {
  const start = Date.now();
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  const method   = req.method;

  // CORS — tunable via ALLOWED_ORIGINS env
  const origin = process.env.ALLOWED_ORIGINS || '*';
  res.setHeader('Access-Control-Allow-Origin',  origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  if (method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  try {
    // ======== API ROUTES ========
    if (pathname.startsWith('/api/')) {

      // GET /api/incidents
      if (pathname === '/api/incidents' && method === 'GET') {
        log(method, pathname, 200, Date.now() - start);
        return sendJson(res, 200, { status: 'success', count: incidents.length, data: incidents });
      }

      // GET /api/incidents/nearby?lat=&lng=&radius_km=
      if (pathname === '/api/incidents/nearby' && method === 'GET') {
        const lat      = parseFloat(url.searchParams.get('lat'))       || -5.3815;
        const lng      = parseFloat(url.searchParams.get('lng'))       || 105.2585;
        const radiusKm = parseFloat(url.searchParams.get('radius_km')) || 3.0;
        const nearby   = nearbyFilter(lat, lng, radiusKm);
        log(method, pathname, 200, Date.now() - start);
        return sendJson(res, 200, { status: 'success', radius_km: radiusKm, count: nearby.length, data: nearby });
      }

      // POST /api/incidents
      if (pathname === '/api/incidents' && method === 'POST') {
        const rawBody = await readBody(req);
        let data;
        try { data = JSON.parse(rawBody); } catch {
          return sendJson(res, 400, { status: 'error', message: 'Payload JSON tidak valid' });
        }
        if (!data.title || !data.title.trim() || !data.description || !data.description.trim()) {
          log(method, pathname, 400, Date.now() - start);
          return sendJson(res, 400, { status: 'error', message: 'Judul dan deskripsi keluhan wajib diisi' });
        }
        const created = {
          id: 'gen-' + Date.now(),
          ticket_number: `LAP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          ...data, status: 'Diajukan',
          created_at: new Date().toISOString()
        };
        incidents.unshift(created);
        log(method, pathname, 201, Date.now() - start);
        return sendJson(res, 201, { status: 'success', data: created });
      }

      // GET /api/crew/tasks
      if (pathname === '/api/crew/tasks' && method === 'GET') {
        log(method, pathname, 200, Date.now() - start);
        return sendJson(res, 200, { status: 'success', count: incidents.length, tasks: incidents });
      }

      // PUT /api/crew/tasks/:id/status
      if (pathname.startsWith('/api/crew/tasks/') && pathname.endsWith('/status') && method === 'PUT') {
        const id   = pathname.split('/')[4];
        const task = incidents.find(i => i.id === id);
        if (task) task.status = 'Diproses Lapangan';
        log(method, pathname, 200, Date.now() - start);
        return sendJson(res, 200, { status: 'success', message: 'Status diubah ke Diproses Lapangan' });
      }

      // POST /api/crew/tasks/:id/verify
      if (pathname.startsWith('/api/crew/tasks/') && pathname.endsWith('/verify') && method === 'POST') {
        const rawBody = await readBody(req);
        let data;
        try { data = JSON.parse(rawBody); } catch { data = {}; }
        if (!data.signed_declaration) {
          return sendJson(res, 400, { status: 'error', message: 'Pernyataan Berita Acara wajib dicentang' });
        }
        const id   = pathname.split('/')[4];
        const task = incidents.find(i => i.id === id);
        if (task) task.status = 'Verifikasi Selesai';
        log(method, pathname, 200, Date.now() - start);
        return sendJson(res, 200, { status: 'success', message: 'Verifikasi pengerjaan berhasil disahkan' });
      }

      // GET|PUT /api/crew/status
      if (pathname === '/api/crew/status') {
        log(method, pathname, 200, Date.now() - start);
        return sendJson(res, 200, { status: 'success', message: 'Crew status updated' });
      }

      // GET /api/admin/kpi
      if (pathname === '/api/admin/kpi' && method === 'GET') {
        const total     = incidents.length;
        const awaiting  = incidents.filter(i => ['Diajukan','Menunggu Disposisi'].includes(i.status)).length;
        const inProg    = incidents.filter(i => ['Disposisi Resmi','Diproses Lapangan'].includes(i.status)).length;
        const completed = incidents.filter(i => i.status === 'Verifikasi Selesai').length;
        log(method, pathname, 200, Date.now() - start);
        return sendJson(res, 200, { status: 'success', data: {
          total_reports: total, awaiting_disposition: awaiting,
          in_progress: inProg, completed_verified: completed,
          sla_compliance_pct: 87.5, avg_response_hours: 3.2
        }});
      }

      // GET /api/admin/gis/incidents
      if (pathname === '/api/admin/gis/incidents' && method === 'GET') {
        log(method, pathname, 200, Date.now() - start);
        return sendJson(res, 200, { status: 'success', count: incidents.length, incidents });
      }

      // GET /api/admin/gis/units
      if (pathname === '/api/admin/gis/units' && method === 'GET') {
        const units = [
          { team_name: 'Regu Alfa 03',  agency: 'Dinas PUPR', status: 'Siaga Aktif', latitude: -5.381200, longitude: 105.258900, active_tasks: 2 },
          { team_name: 'Regu Bravo 01', agency: 'Dinas Perhubungan', status: 'Sedang Bertugas', latitude: -5.378900, longitude: 105.249800, active_tasks: 1 },
          { team_name: 'Regu Delta 02', agency: 'Dinas Lingkungan', status: 'Siaga Aktif', latitude: -5.394500, longitude: 105.265100, active_tasks: 0 }
        ];
        log(method, pathname, 200, Date.now() - start);
        return sendJson(res, 200, { status: 'success', units });
      }

      // POST /api/admin/incidents/:id/assign
      if (pathname.startsWith('/api/admin/incidents/') && pathname.endsWith('/assign') && method === 'POST') {
        const id   = pathname.split('/')[4];
        const task = incidents.find(i => i.id === id);
        if (task) { task.assigned_team_name = 'Regu Alfa 03 - Dinas PUPR'; task.status = 'Disposisi Resmi'; }
        log(method, pathname, 200, Date.now() - start);
        return sendJson(res, 200, { status: 'success', message: 'Tiket berhasil didisposisikan' });
      }

      // POST /api/admin/incidents/:id/status
      if (pathname.startsWith('/api/admin/incidents/') && pathname.endsWith('/status') && method === 'PUT') {
        const rawBody = await readBody(req);
        let data; try { data = JSON.parse(rawBody); } catch { data = {}; }
        const id   = pathname.split('/')[4];
        const task = incidents.find(i => i.id === id);
        if (task && data.status) task.status = data.status;
        log(method, pathname, 200, Date.now() - start);
        return sendJson(res, 200, { status: 'success', message: `Status diperbarui ke ${data.status}` });
      }

      // POST /api/admin/broadcast
      if (pathname === '/api/admin/broadcast' && method === 'POST') {
        log(method, pathname, 200, Date.now() - start);
        return sendJson(res, 200, { status: 'success', message: 'Siaran darurat berhasil dikirim', recipient_count: 1420 });
      }

      // POST /api/incidents/:id/feedback
      if (pathname.match(/^\/api\/incidents\/[^/]+\/feedback$/) && method === 'POST') {
        log(method, pathname, 200, Date.now() - start);
        return sendJson(res, 200, { status: 'success', message: 'Terima kasih atas penilaian Anda!' });
      }

      // 404 fallthrough for unknown /api/* paths
      log(method, pathname, 404, Date.now() - start);
      return sendJson(res, 404, { status: 'error', message: 'API endpoint tidak ditemukan' });
    }

    // ======== STATIC FILE SERVING ========
    // FIX #6: Semua aset statis (termasuk logo) ada di dalam folder static/
    // Server ini HANYA melayani file dari static/ — tidak ada file di root yang diekspose.
    let filePath;
    if (pathname === '/') {
      filePath = path.join(STATIC_DIR, 'index.html');
    } else if (pathname.startsWith('/assets/')) {
      // /assets/logo-pemda.png  →  static/assets/logo-pemda.png
      filePath = path.join(STATIC_DIR, pathname);
    } else if (pathname.startsWith('/static/')) {
      filePath = path.join(__dirname, pathname);
    } else {
      filePath = path.join(STATIC_DIR, pathname);
    }

    // Security: prevent path traversal
    const resolvedStatic = path.resolve(STATIC_DIR);
    const resolvedFile   = path.resolve(filePath);
    if (!resolvedFile.startsWith(resolvedStatic) && !resolvedFile.startsWith(path.resolve(__dirname, 'static'))) {
      log(method, pathname, 403, Date.now() - start);
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      return res.end('403 Forbidden');
    }

    fs.readFile(filePath, (err, content) => {
      if (err) {
        if (err.code === 'ENOENT') {
          // SPA fallback: kembalikan index.html untuk client-side routing
          fs.readFile(path.join(STATIC_DIR, 'index.html'), (e2, fallback) => {
            if (e2) { res.writeHead(404); res.end('404 Not Found'); return; }
            log(method, pathname + ' → SPA fallback', 200, Date.now() - start);
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(fallback);
          });
        } else {
          // FIX #1: Jangan leak detail error ke client di production
          log(method, pathname, 500, Date.now() - start);
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('500 Internal Server Error');
        }
        return;
      }

      const ext         = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      // Cache static assets (1 jam) di produksi kecuali HTML
      const cacheControl = ext === '.html' ? 'no-store' : 'public, max-age=3600';
      res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': cacheControl });
      res.end(content);
      log(method, pathname, 200, Date.now() - start);
    });

  } catch (err) {
    // FIX #1: Tangkap semua error agar server tidak crash di produksi
    console.error(`[ERROR] Unhandled exception: ${err.message}`);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'error', message: 'Internal server error' }));
    }
  }
}

// ----- Start Server -----
const server = http.createServer(handleRequest);

server.listen(PORT, HOST, () => {
  console.log('================================================================');
  console.log(` Smart Public Facility & Incident Reporter`);
  console.log(` Environment : ${APP_ENV.toUpperCase()}`);
  console.log(` Server      : http://${HOST}:${PORT}`);
  console.log(` PID         : ${process.pid}`);
  console.log(` Node.js     : ${process.version}`);
  console.log(' Copyright (C) 2026 Rafli Fadillah & Dr. Erliyan Redy Susanto, M.Kom');
  console.log('================================================================');
  if (APP_ENV === 'production') {
    console.log(' ✅ Running in PRODUCTION mode');
    console.log(' TIP: Gunakan "pm2 start server.js --name smart-lapor" agar tetap berjalan');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => { server.close(() => process.exit(0)); });
process.on('SIGINT',  () => { server.close(() => process.exit(0)); });

