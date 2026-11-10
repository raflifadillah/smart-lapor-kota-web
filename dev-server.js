const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const STATIC_DIR = path.join(__dirname, 'static');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// In-memory mock database state for instant local preview
let incidents = [
  {
    id: "55555555-5555-5555-5555-555555555551",
    ticket_number: "LAP-2026-0882",
    title: "Aspal Ambles Diameter 1.2 Meter Membahayakan Pengendara",
    category: "Jalan Berlubang",
    description: "Terdapat lubang jalan cukup dalam akibat gerusan hujan deras kemarin sore. Sangat membahayakan pengendara motor terutama di malam hari.",
    landmark: "Depan Gerbang Kampus Teknokrat, Jl. ZA. Pagar Alam",
    kecamatan: "Kedaton",
    latitude: -5.381500,
    longitude: 105.258500,
    photo_urls: ["https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80"],
    severity: "Tinggi",
    status: "Diproses Lapangan",
    assigned_team_name: "Regu Alfa 03 - Dinas PUPR",
    notify_whatsapp: true,
    notify_sms: false,
    created_at: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: "55555555-5555-5555-5555-555555555552",
    ticket_number: "LAP-2026-0883",
    title: "Lampu Jalan Padam Sepanjang 200m Rawan Kriminalitas",
    category: "PJU Padam",
    description: "Tiga tiang lampu penerangan jalan umum mati total sejak 2 malam berturut-turut, area menjadi sangat gelap.",
    landmark: "Simpang Tiga Jl. Teuku Umar No. 45",
    kecamatan: "Kedaton",
    latitude: -5.385200,
    longitude: 105.261200,
    photo_urls: ["https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80"],
    severity: "Sedang",
    status: "Menunggu Disposisi",
    assigned_team_name: null,
    notify_whatsapp: true,
    notify_sms: true,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: "55555555-5555-5555-5555-555555555553",
    ticket_number: "LAP-2026-0880",
    title: "Saluran Drainase Tersumbat Sampah Menggenangi Jalan",
    category: "Drainase & Banjir",
    description: "Gorong-gorong tersumbat sedimentasi pasir dan tumpukan sampah plastik, air meluap ke badan jalan.",
    landmark: "Dekat Pasar Koga, Jl. Teuku Umar",
    kecamatan: "Kedaton",
    latitude: -5.391200,
    longitude: 105.264500,
    photo_urls: ["https://images.unsplash.com/photo-1541888946425-d0fbb1861593?auto=format&fit=crop&w=800&q=80"],
    severity: "Sedang",
    status: "Diproses Lapangan",
    assigned_team_name: "Regu Bravo 01 - Dinas Lingkungan",
    notify_whatsapp: true,
    notify_sms: false,
    created_at: new Date(Date.now() - 3600000 * 8).toISOString()
  },
  {
    id: "55555555-5555-5555-5555-555555555554",
    ticket_number: "LAP-2026-0879",
    title: "Rambu Penyeberangan Pejalan Kaki Roboh Ditabrak",
    category: "Rambu Lalu Lintas Rusak",
    description: "Plang tiang penyeberangan zebra cross miring dan hampir roboh ke arah jalan raya.",
    landmark: "Depan SD Negeri 2 Labuhan Ratu",
    kecamatan: "Labuhan Ratu",
    latitude: -5.374500,
    longitude: 105.253100,
    photo_urls: ["https://images.unsplash.com/photo-1584467541268-b040f83be3fd?auto=format&fit=crop&w=800&q=80"],
    severity: "Sedang",
    status: "Verifikasi Selesai",
    assigned_team_name: "Regu Alfa 03 - Dinas PUPR",
    notify_whatsapp: true,
    notify_sms: false,
    rating: 5,
    feedback_text: "Pelayanan sangat cepat tanggap! Tiang baru kokoh dan penyeberangan kembali aman.",
    created_at: new Date(Date.now() - 86400000).toISOString()
  }
];

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // API Endpoints
  if (pathname.startsWith('/api/')) {
    if (pathname === '/api/incidents' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'success', count: incidents.length, data: incidents }));
      return;
    }

    if (pathname === '/api/incidents/nearby' && req.method === 'GET') {
      const lat = parseFloat(url.searchParams.get('lat')) || -5.3815;
      const lng = parseFloat(url.searchParams.get('lng')) || 105.2585;
      const radiusKm = parseFloat(url.searchParams.get('radius_km')) || 3.0;
      
      // Calculate simple Euclidean approx for nearby filter
      const nearby = incidents.filter(i => {
        const dLat = (i.latitude - lat) * 111.0;
        const dLng = (i.longitude - lng) * 111.0 * Math.cos(lat * Math.PI / 180);
        const dist = Math.sqrt(dLat * dLat + dLng * dLng);
        return dist <= radiusKm;
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'success', radius_km: radiusKm, count: nearby.length, data: nearby }));
      return;
    }

    if (pathname === '/api/incidents' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (!data.title || !data.title.trim() || !data.description || !data.description.trim()) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'error', message: 'Judul dan deskripsi keluhan wajib diisi' }));
            return;
          }

          const newIncident = {
            id: 'gen-' + Date.now(),
            ticket_number: `LAP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
            ...data,
            status: 'Diajukan',
            created_at: new Date().toISOString()
          };
          incidents.unshift(newIncident);
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'success', data: newIncident }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'error', message: 'Invalid JSON payload' }));
        }
      });
      return;
    }

    if (pathname === '/api/crew/tasks' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'success', count: incidents.length, tasks: incidents }));
      return;
    }

    if (pathname === '/api/admin/kpi' && req.method === 'GET') {
      const total = incidents.length;
      const awaiting = incidents.filter(i => i.status === 'Diajukan' || i.status === 'Menunggu Disposisi').length;
      const inProgress = incidents.filter(i => i.status === 'Disposisi Resmi' || i.status === 'Diproses Lapangan').length;
      const completed = incidents.filter(i => i.status === 'Verifikasi Selesai').length;

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'success',
        data: {
          total_reports: total,
          awaiting_disposition: awaiting,
          in_progress: inProgress,
          completed_verified: completed,
          sla_compliance_pct: 87.5,
          avg_response_hours: 3.2
        }
      }));
      return;
    }

    if (pathname === '/api/admin/gis/incidents' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'success', count: incidents.length, incidents: incidents }));
      return;
    }

    if (pathname === '/api/admin/gis/units' && req.method === 'GET') {
      const units = [
        { team_name: 'Regu Alfa 03', agency: 'Dinas PUPR', status: 'Siaga Aktif', latitude: -5.381200, longitude: 105.258900, active_tasks: 2 },
        { team_name: 'Regu Bravo 01', agency: 'Dinas Perhubungan', status: 'Sedang Bertugas', latitude: -5.378900, longitude: 105.249800, active_tasks: 1 },
        { team_name: 'Regu Delta 02', agency: 'Dinas Lingkungan Hidup', status: 'Siaga Aktif', latitude: -5.394500, longitude: 105.265100, active_tasks: 0 }
      ];
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'success', units }));
      return;
    }

    if (pathname.startsWith('/api/crew/tasks/') && pathname.endsWith('/status') && req.method === 'PUT') {
      const parts = pathname.split('/');
      const id = parts[4];
      const task = incidents.find(i => i.id === id);
      if (task) {
        task.status = 'Diproses Lapangan';
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'success', message: 'Status updated to Diproses Lapangan' }));
      return;
    }

    if (pathname.startsWith('/api/crew/tasks/') && pathname.endsWith('/verify') && req.method === 'POST') {
      const parts = pathname.split('/');
      const id = parts[4];
      const task = incidents.find(i => i.id === id);
      if (task) {
        task.status = 'Verifikasi Selesai';
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'success', message: 'Verification recorded successfully' }));
      return;
    }

    if (pathname.startsWith('/api/admin/incidents/') && pathname.endsWith('/assign') && req.method === 'POST') {
      const parts = pathname.split('/');
      const id = parts[4];
      const task = incidents.find(i => i.id === id);
      if (task) {
        task.assigned_team_name = 'Regu Alfa 03 - Dinas PUPR';
        task.status = 'Disposisi Resmi';
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'success', message: 'Assigned successfully' }));
      return;
    }

    if (pathname === '/api/crew/status') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'success', message: 'Crew status ok' }));
      return;
    }

    if (pathname === '/api/admin/broadcast' && req.method === 'POST') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'success', message: 'Broadcast delivered' }));
      return;
    }
  }

  // Static File Serving
  let filePath = pathname === '/' ? path.join(STATIC_DIR, 'index.html') : path.join(__dirname, pathname);

  if (pathname.startsWith('/static/')) {
    filePath = path.join(__dirname, pathname);
  } else if (pathname.startsWith('/assets/')) {
    filePath = path.join(STATIC_DIR, pathname);
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Fallback to index.html for SPA routes
        fs.readFile(path.join(STATIC_DIR, 'index.html'), (err2, fallback) => {
          if (err2) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(fallback);
          }
        });
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`================================================================`);
  console.log(` Smart Public Facility & Incident Reporter - Preview Server`);
  console.log(` Running at http://localhost:${PORT}`);
  console.log(` Copyright (C) 2026 Rafli Fadillah & Dr. Erliyan Redy Susanto, M.Kom`);
  console.log(`================================================================`);
});

