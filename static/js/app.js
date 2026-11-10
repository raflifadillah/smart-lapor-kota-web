/**
 * Smart Public Facility & Incident Reporter
 * Frontend Application Core
 * Copyright (C) 2026 Rafli Fadillah & Dr. Erliyan Redy Susanto, M.Kom
 *
 * FIX #2 (Production-Safe): API_BASE bersifat relatif ('/api') sehingga selalu
 * mengacu ke domain/host yang sedang melayani halaman ini — tidak pernah hardcoded
 * ke 'http://localhost:8080'. Ini memastikan aplikasi bekerja di lokal, staging,
 * maupun produksi tanpa perubahan kode.
 */

// Relatif path — aman untuk semua environment (localhost, VPS, container, cloud)
const API_BASE = '/api';

// Initial state and sample seed fallback for instant preview
let currentRole = 'citizen'; // 'citizen', 'crew', 'admin'
let citizenReports = [];
let crewTasks = [];
let kpiData = {
  total_reports: 24,
  awaiting_disposition: 5,
  in_progress: 11,
  completed_verified: 8,
  sla_compliance_pct: 87.5,
  avg_response_hours: 3.2
};
let selectedCategory = 'Jalan Berlubang';
let uploadedPhotos = [];
let activeIncidentForTracking = null;
let activeTaskForVerification = null;
let currentRating = 5;

// Leaflet Maps
let citizenPickerMap = null;
let citizenPickerMarker = null;
let adminGisMap = null;
let adminGisLayerGroup = null;

// DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

async function initApp() {
  setupNavigation();
  setupCitizenForm();
  setupFieldCrewEvents();
  setupAdminEvents();
  await loadInitialData();
  switchRole('citizen');
}

// ----------------------------------------------------
// Navigation & Role Switching
// ----------------------------------------------------
function setupNavigation() {
  const roleSelect = document.getElementById('roleSelector');
  if (roleSelect) {
    roleSelect.addEventListener('change', (e) => {
      switchRole(e.target.value);
    });
  }

  // Quick Switcher Buttons
  document.querySelectorAll('[data-switch-role]').forEach(btn => {
    btn.addEventListener('click', () => {
      const role = btn.getAttribute('data-switch-role');
      if (roleSelect) roleSelect.value = role;
      switchRole(role);
    });
  });

  // Mobile Bottom Nav items
  document.querySelectorAll('.bottom-nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const targetRole = item.getAttribute('data-nav-role');
      if (targetRole) {
        if (roleSelect) roleSelect.value = targetRole;
        switchRole(targetRole);
      }
    });
  });
}

function switchRole(role) {
  currentRole = role;
  
  // Toggle Views
  document.getElementById('citizenView').classList.toggle('hidden', role !== 'citizen');
  document.getElementById('crewView').classList.toggle('hidden', role !== 'crew');
  document.getElementById('adminView').classList.toggle('hidden', role !== 'admin');

  // Update active states on bottom nav
  document.querySelectorAll('.bottom-nav-item').forEach(btn => {
    const btnRole = btn.getAttribute('data-nav-role');
    const isActive = (btnRole === role);
    btn.classList.toggle('text-[#00152F]', isActive);
    btn.classList.toggle('font-bold', isActive);
    btn.classList.toggle('text-slate-500', !isActive);
  });

  // Role-specific initializations
  if (role === 'citizen') {
    setTimeout(initCitizenMap, 200);
    renderCitizenTracker();
  } else if (role === 'crew') {
    renderCrewTasks();
  } else if (role === 'admin') {
    setTimeout(initAdminGisMap, 200);
    renderAdminTable();
    updateAdminKpis();
  }
}

// ----------------------------------------------------
// Data Fetching & Sync
// ----------------------------------------------------
async function loadInitialData() {
  try {
    const res = await fetch(`${API_BASE}/incidents`);
    if (res.ok) {
      const data = await res.json();
      if (data.data && data.data.length > 0) {
        citizenReports = data.data;
      }
    }
  } catch (err) {
    console.warn('API backend offline, loading rich local seed state', err);
  }

  // Fallback seed data if offline or empty
  if (citizenReports.length === 0) {
    citizenReports = [
      {
        id: '55555555-5555-5555-5555-555555555551',
        ticket_number: 'LAP-2026-0882',
        title: 'Aspal Ambles Diameter 1.2 Meter Membahayakan Pengendara',
        category: 'Jalan Berlubang',
        description: 'Terdapat lubang jalan cukup dalam akibat gerusan hujan deras kemarin sore. Sangat membahayakan motor terutama malam hari.',
        landmark: 'Depan Gerbang Kampus Teknokrat, Jl. ZA. Pagar Alam',
        kecamatan: 'Kedaton',
        latitude: -5.381500,
        longitude: 105.258500,
        photo_urls: ['https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80'],
        severity: 'Tinggi',
        status: 'Diproses Lapangan',
        assigned_team_name: 'Regu Alfa 03 - Dinas PUPR',
        notify_whatsapp: true,
        notify_sms: false,
        created_at: new Date(Date.now() - 3600000 * 3).toISOString()
      },
      {
        id: '55555555-5555-5555-5555-555555555552',
        ticket_number: 'LAP-2026-0883',
        title: 'Lampu Jalan Padam Sepanjang 200m Rawan Kriminalitas',
        category: 'PJU Padam',
        description: 'Tiga tiang lampu penerangan jalan umum mati total, lokasi sangat gelap.',
        landmark: 'Simpang Tiga Jl. Teuku Umar No. 45',
        kecamatan: 'Kedaton',
        latitude: -5.385200,
        longitude: 105.261200,
        photo_urls: ['https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80'],
        severity: 'Sedang',
        status: 'Menunggu Disposisi',
        assigned_team_name: null,
        notify_whatsapp: true,
        notify_sms: true,
        created_at: new Date(Date.now() - 3600000 * 5).toISOString()
      },
      {
        id: '55555555-5555-5555-5555-555555555553',
        ticket_number: 'LAP-2026-0880',
        title: 'Saluran Drainase Tersumbat Sampah Menggenangi Jalan',
        category: 'Drainase & Banjir',
        description: 'Gorong-gorong tersumbat sedimentasi lumpur dan sampah plastik sehingga air meluap ke aspal.',
        landmark: 'Dekat Pasar Koga, Jl. Teuku Umar',
        kecamatan: 'Kedaton',
        latitude: -5.391200,
        longitude: 105.264500,
        photo_urls: ['https://images.unsplash.com/photo-1541888946425-d0fbb1861593?auto=format&fit=crop&w=800&q=80'],
        severity: 'Sedang',
        status: 'Diproses Lapangan',
        assigned_team_name: 'Regu Bravo 01 - Dinas Lingkungan',
        notify_whatsapp: true,
        notify_sms: false,
        created_at: new Date(Date.now() - 3600000 * 8).toISOString()
      },
      {
        id: '55555555-5555-5555-5555-555555555554',
        ticket_number: 'LAP-2026-0879',
        title: 'Rambu Penyeberangan Pejalan Kaki Roboh Ditabrak',
        category: 'Rambu Lalu Lintas Rusak',
        description: 'Plang tiang penyeberangan zebra cross miring dan hampir roboh ke arah jalan raya.',
        landmark: 'Depan SD Negeri 2 Labuhan Ratu',
        kecamatan: 'Labuhan Ratu',
        latitude: -5.374500,
        longitude: 105.253100,
        photo_urls: ['https://images.unsplash.com/photo-1584467541268-b040f83be3fd?auto=format&fit=crop&w=800&q=80'],
        severity: 'Sedang',
        status: 'Verifikasi Selesai',
        assigned_team_name: 'Regu Alfa 03 - Dinas PUPR',
        notify_whatsapp: true,
        notify_sms: false,
        rating: 5,
        feedback_text: 'Pelayanan cepat tanggap! Tiang baru kokoh dan penyeberangan aman kembali.',
        created_at: new Date(Date.now() - 86400000).toISOString()
      }
    ];
  }

  // Set default active report for tracker
  activeIncidentForTracking = citizenReports[0];
}

// ----------------------------------------------------
// Citizen View: Map, Form, Category & Photos
// ----------------------------------------------------
function initCitizenMap() {
  if (citizenPickerMap) {
    citizenPickerMap.invalidateSize();
    return;
  }

  const defaultLat = -5.381500;
  const defaultLng = 105.258500;

  citizenPickerMap = L.map('citizenMapContainer', {
    center: [defaultLat, defaultLng],
    zoom: 15,
    zoomControl: true
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>, OpenStreetMap',
    maxZoom: 19
  }).addTo(citizenPickerMap);

  const customIcon = L.divIcon({
    className: 'custom-pin',
    html: `<div class="bg-[#00152F] text-white p-2 rounded-full shadow-lg border-2 border-white flex items-center justify-center">
             <span class="material-symbols-outlined text-sm">location_pin</span>
           </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32]
  });

  citizenPickerMarker = L.marker([defaultLat, defaultLng], {
    draggable: true,
    icon: customIcon
  }).addTo(citizenPickerMap);

  citizenPickerMarker.on('dragend', function (e) {
    const position = citizenPickerMarker.getLatLng();
    updateCitizenCoordinates(position.lat, position.lng);
  });

  citizenPickerMap.on('click', function (e) {
    citizenPickerMarker.setLatLng(e.latlng);
    updateCitizenCoordinates(e.latlng.lat, e.latlng.lng);
  });

  updateCitizenCoordinates(defaultLat, defaultLng);
}

function updateCitizenCoordinates(lat, lng) {
  const coordDisplay = document.getElementById('citizenCoordDisplay');
  const inputLat = document.getElementById('inputLatitude');
  const inputLng = document.getElementById('inputLongitude');

  if (coordDisplay) {
    coordDisplay.textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
  if (inputLat) inputLat.value = lat.toFixed(6);
  if (inputLng) inputLng.value = lng.toFixed(6);
}

function setupCitizenForm() {
  // Category Chips
  document.querySelectorAll('.category-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.category-chip').forEach(c => {
        c.classList.remove('bg-[#00152F]', 'text-white');
        c.classList.add('bg-[#EFF4FF]', 'text-[#0B1C30]');
      });
      chip.classList.remove('bg-[#EFF4FF]', 'text-[#0B1C30]');
      chip.classList.add('bg-[#00152F]', 'text-white');
      selectedCategory = chip.getAttribute('data-category');
    });
  });

  // GPS Auto-detect Button
  const btnGetGps = document.getElementById('btnGetGps');
  if (btnGetGps) {
    btnGetGps.addEventListener('click', () => {
      if (!navigator.geolocation) {
        showToast('Geolokasi tidak didukung oleh browser Anda.', 'error');
        return;
      }
      btnGetGps.innerHTML = `<span class="material-symbols-outlined animate-spin text-sm">sync</span> Mendeteksi GPS...`;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          if (citizenPickerMarker && citizenPickerMap) {
            citizenPickerMarker.setLatLng([lat, lng]);
            citizenPickerMap.setView([lat, lng], 16);
            updateCitizenCoordinates(lat, lng);
          }
          btnGetGps.innerHTML = `<span class="material-symbols-outlined text-sm text-[#00A472]">check_circle</span> GPS Akurat Aktif`;
          showToast('Koordinat presisi berhasil dideteksi!', 'success');
        },
        (err) => {
          console.warn('Geolocation error:', err);
          btnGetGps.innerHTML = `<span class="material-symbols-outlined text-sm">my_location</span> Gunakan Lokasi Presisi Saat Ini`;
          showToast('Izin lokasi ditolak atau sinyal GPS tidak tersedia.', 'error');
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });
  }

  // Character counter for description
  const descTextarea = document.getElementById('inputDescription');
  const charCounter = document.getElementById('descCharCount');
  if (descTextarea && charCounter) {
    descTextarea.addEventListener('input', () => {
      const len = descTextarea.value.length;
      charCounter.textContent = `${len}/500`;
    });
  }

  // Photo Upload Dropzone
  const dropzone = document.getElementById('photoDropzone');
  const fileInput = document.getElementById('photoFileInput');
  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handlePhotoSelection);

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('border-blue-500', 'bg-blue-50');
    });
    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('border-blue-500', 'bg-blue-50');
    });
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('border-blue-500', 'bg-blue-50');
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        fileInput.files = e.dataTransfer.files;
        handlePhotoSelection();
      }
    });
  }

  // Submit Form
  const reportForm = document.getElementById('citizenReportForm');
  if (reportForm) {
    reportForm.addEventListener('submit', handleReportSubmission);
  }

  // Rating Stars
  document.querySelectorAll('.rating-star').forEach(star => {
    star.addEventListener('click', () => {
      const val = parseInt(star.getAttribute('data-value'));
      currentRating = val;
      updateRatingStars(val);
    });
  });

  const btnSubmitFeedback = document.getElementById('btnSubmitFeedback');
  if (btnSubmitFeedback) {
    btnSubmitFeedback.addEventListener('click', handleFeedbackSubmission);
  }
}

function handlePhotoSelection() {
  const fileInput = document.getElementById('photoFileInput');
  const previewContainer = document.getElementById('photoPreviews');
  if (!fileInput || !fileInput.files) return;

  const files = Array.from(fileInput.files).slice(0, 3);
  uploadedPhotos = [];
  previewContainer.innerHTML = '';

  files.forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      uploadedPhotos.push(dataUrl);

      const thumb = document.createElement('div');
      thumb.className = 'relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200 shadow-sm group';
      thumb.innerHTML = `
        <img src="${dataUrl}" class="w-full h-full object-cover">
        <button type="button" class="absolute top-1 right-1 bg-black/60 hover:bg-red-600 text-white rounded-full p-1 opacity-90 transition-all text-xs" onclick="removePhoto(${index})">
          <span class="material-symbols-outlined text-xs">close</span>
        </button>
        <span class="absolute bottom-1 left-1 bg-black/50 text-white text-[9px] px-1 rounded font-tabular">
          ${(file.size / 1024).toFixed(0)} KB
        </span>
      `;
      previewContainer.appendChild(thumb);
    };
    reader.readAsDataURL(file);
  });
}

window.removePhoto = function (index) {
  uploadedPhotos.splice(index, 1);
  const previewContainer = document.getElementById('photoPreviews');
  if (previewContainer && previewContainer.children[index]) {
    previewContainer.children[index].remove();
  }
};

async function handleReportSubmission(e) {
  e.preventDefault();
  const submitBtn = document.getElementById('btnSubmitReport');
  const title = document.getElementById('inputTitle').value.trim();
  const description = document.getElementById('inputDescription').value.trim();
  const landmark = document.getElementById('inputLandmark').value.trim();
  const kecamatan = document.getElementById('inputKecamatan').value;
  const lat = parseFloat(document.getElementById('inputLatitude').value) || -5.381500;
  const lng = parseFloat(document.getElementById('inputLongitude').value) || 105.258500;
  const isAnonymous = document.getElementById('checkAnonymous').checked;
  const reporterPhone = document.getElementById('inputPhone').value.trim();
  const notifyWa = document.getElementById('checkWhatsapp').checked;
  const notifySms = document.getElementById('checkSms').checked;

  if (!title || !description || !landmark) {
    showToast('Mohon lengkapi judul, deskripsi keluhan, dan patokan lokasi.', 'error');
    return;
  }

  // Show loading
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<span class="material-symbols-outlined animate-spin text-sm">sync</span> Memproses Laporan Resmi...`;

  const ticketNumber = `LAP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const defaultPhotos = uploadedPhotos.length > 0 
    ? uploadedPhotos 
    : ['https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80'];

  const payload = {
    category: selectedCategory,
    title,
    description,
    landmark,
    kecamatan,
    latitude: lat,
    longitude: lng,
    photo_urls: defaultPhotos,
    is_anonymous: isAnonymous,
    reporter_name: isAnonymous ? 'Warga Peduli (Anonim)' : 'Budi Santoso',
    reporter_phone: reporterPhone,
    notify_whatsapp: notifyWa,
    notify_sms: notifySms,
    severity: 'Tinggi'
  };

  try {
    const res = await fetch(`${API_BASE}/incidents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const data = await res.json();
      activeIncidentForTracking = data.data || payload;
    } else {
      activeIncidentForTracking = {
        id: 'new-' + Date.now(),
        ticket_number: ticketNumber,
        ...payload,
        status: 'Diajukan',
        created_at: new Date().toISOString()
      };
    }
  } catch (err) {
    activeIncidentForTracking = {
      id: 'new-' + Date.now(),
      ticket_number: ticketNumber,
      ...payload,
      status: 'Diajukan',
      created_at: new Date().toISOString()
    };
  }

  // Prepend to list
  citizenReports.unshift(activeIncidentForTracking);

  submitBtn.disabled = false;
  submitBtn.innerHTML = `<span class="material-symbols-outlined text-sm">send</span> Kirim Laporan Resmi Sekarang`;

  // Reset form
  document.getElementById('citizenReportForm').reset();
  uploadedPhotos = [];
  document.getElementById('photoPreviews').innerHTML = '';
  document.getElementById('descCharCount').textContent = '0/500';

  // Show Success Modal
  showSuccessModal(activeIncidentForTracking.ticket_number);
  triggerSimulatedWhatsApp(
    activeIncidentForTracking.ticket_number,
    `Halo, laporan Anda dengan tiket <strong>${activeIncidentForTracking.ticket_number}</strong> telah berhasil dicatat oleh sistem Smart Lapor Kota dan segera diverifikasi dinas terkait.`
  );
  renderCitizenTracker();
}

function showSuccessModal(ticket) {
  const modal = document.getElementById('reportSuccessModal');
  const ticketSpan = document.getElementById('modalTicketNumber');
  if (modal && ticketSpan) {
    ticketSpan.textContent = ticket;
    modal.classList.remove('hidden');
  }
}

window.closeSuccessModal = function () {
  const modal = document.getElementById('reportSuccessModal');
  if (modal) modal.classList.add('hidden');
  // Scroll to tracker
  const trackerEl = document.getElementById('incidentTrackerCard');
  if (trackerEl) trackerEl.scrollIntoView({ behavior: 'smooth' });
};

// ----------------------------------------------------
// Step-by-Step Progress Tracker (Citizen)
// ----------------------------------------------------
function renderCitizenTracker() {
  if (!activeIncidentForTracking) return;
  const inc = activeIncidentForTracking;

  document.getElementById('trackerTicketId').textContent = inc.ticket_number;
  document.getElementById('trackerCategory').textContent = inc.category;
  document.getElementById('trackerTitle').textContent = inc.title;
  document.getElementById('trackerStatusBadge').textContent = inc.status;
  document.getElementById('trackerDate').textContent = new Date(inc.created_at).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  // Stages definition
  const stages = ['Diajukan', 'Disposisi Resmi', 'Diproses Lapangan', 'Verifikasi Selesai'];
  const currentIndex = stages.indexOf(inc.status);

  for (let i = 0; i < 4; i++) {
    const stepCircle = document.getElementById(`stepCircle${i}`);
    const stepLine = document.getElementById(`stepLine${i}`);
    const stepLabel = document.getElementById(`stepLabel${i}`);

    if (stepCircle) {
      if (i < currentIndex || inc.status === 'Verifikasi Selesai') {
        // Completed stage
        stepCircle.className = 'w-7 h-7 rounded-full bg-[#00A472] text-white flex items-center justify-center font-bold text-xs shadow';
        stepCircle.innerHTML = '<span class="material-symbols-outlined text-sm">check</span>';
      } else if (i === currentIndex) {
        // Active stage
        stepCircle.className = 'w-7 h-7 rounded-full bg-[#32618E] text-white flex items-center justify-center font-bold text-xs ring-4 ring-blue-100 shadow';
        stepCircle.innerHTML = '<span class="material-symbols-outlined text-sm">autorenew</span>';
      } else {
        // Pending stage
        stepCircle.className = 'w-7 h-7 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xs';
        stepCircle.innerHTML = `${i + 1}`;
      }
    }

    if (stepLine && i < 3) {
      stepLine.classList.toggle('completed', i < currentIndex);
    }
  }

  // Officer Assignment note
  const officerNote = document.getElementById('trackerOfficerNote');
  if (officerNote) {
    if (inc.assigned_team_name) {
      officerNote.innerHTML = `<strong>Petugas Lapangan:</strong> ${inc.assigned_team_name} siap merespons laporan Anda.`;
    } else {
      officerNote.innerHTML = `Laporan sedang dalam antrean verifikasi operator dinas teknis.`;
    }
  }
}

function updateRatingStars(val) {
  document.querySelectorAll('.rating-star').forEach(s => {
    const starVal = parseInt(s.getAttribute('data-value'));
    const isFilled = starVal <= val;
    s.classList.toggle('text-amber-400', isFilled);
    s.classList.toggle('text-slate-300', !isFilled);
  });
}

async function handleFeedbackSubmission() {
  const feedbackInput = document.getElementById('inputFeedbackText');
  const text = feedbackInput ? feedbackInput.value.trim() : '';

  if (activeIncidentForTracking && activeIncidentForTracking.id) {
    try {
      await fetch(`${API_BASE}/incidents/${activeIncidentForTracking.id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: currentRating, feedback_text: text })
      });
    } catch (e) {
      // Offline fallback
    }
  }
  showToast('Terima kasih atas ulasan dan rating kepuasan Anda!', 'success');
  if (feedbackInput) feedbackInput.value = '';
}

// ----------------------------------------------------
// Field Crew View: Task Board & Verification
// ----------------------------------------------------
function setupFieldCrewEvents() {
  // Crew status dropdown
  const statusSelect = document.getElementById('crewStatusSelect');
  if (statusSelect) {
    statusSelect.addEventListener('change', async (e) => {
      const newStatus = e.target.value;
      try {
        await fetch(`${API_BASE}/crew/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        });
      } catch (err) {}
      showToast(`Status regu diubah menjadi: ${newStatus}`, 'success');
    });
  }

  // Crew filter pills
  document.querySelectorAll('.crew-filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.crew-filter-pill').forEach(p => {
        p.classList.remove('bg-[#00152F]', 'text-white');
        p.classList.add('bg-white', 'text-slate-700', 'border');
      });
      pill.classList.remove('bg-white', 'text-slate-700', 'border');
      pill.classList.add('bg-[#00152F]', 'text-white');
      renderCrewTasks(pill.getAttribute('data-filter'));
    });
  });

  // Verification After photo upload
  const afterPhotoInput = document.getElementById('verifAfterFileInput');
  const afterDropzone = document.getElementById('verifAfterDropzone');
  if (afterDropzone && afterPhotoInput) {
    afterDropzone.addEventListener('click', () => afterPhotoInput.click());
    afterPhotoInput.addEventListener('change', () => {
      if (afterPhotoInput.files && afterPhotoInput.files[0]) {
        const file = afterPhotoInput.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
          document.getElementById('verifAfterPreview').src = e.target.result;
          document.getElementById('verifAfterPlaceholder').classList.add('hidden');
          document.getElementById('verifAfterPreview').classList.remove('hidden');
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Verification Form Submit
  const verifForm = document.getElementById('verificationForm');
  if (verifForm) {
    verifForm.addEventListener('submit', handleVerificationSubmit);
  }
}

function renderCrewTasks(filter = 'all') {
  const container = document.getElementById('crewTaskContainer');
  if (!container) return;

  let filtered = citizenReports;
  if (filter === 'urgent') {
    filtered = citizenReports.filter(t => t.severity === 'Tinggi');
  } else if (filter === 'process') {
    filtered = citizenReports.filter(t => t.status === 'Diproses Lapangan');
  } else if (filter === 'completed') {
    filtered = citizenReports.filter(t => t.status === 'Verifikasi Selesai');
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <span class="material-symbols-outlined text-4xl text-slate-400">task_alt</span>
        <p class="text-sm font-semibold text-slate-600 mt-2">Tidak ada tugas pada filter ini</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(task => {
    const isCompleted = task.status === 'Verifikasi Selesai';
    const isProcessing = task.status === 'Diproses Lapangan';
    const severityBadge = task.severity === 'Tinggi' 
      ? '<span class="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-red-600"></span> Urgensi Tinggi</span>'
      : '<span class="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-bold">Urgensi Sedang</span>';

    const photo = (task.photo_urls && task.photo_urls.length > 0) 
      ? task.photo_urls[0] 
      : 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=400&q=80';

    return `
      <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow transition-shadow">
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-2">
            ${severityBadge}
            <span class="text-xs font-tabular text-slate-500 font-semibold">${task.ticket_number}</span>
          </div>
          <span class="text-xs px-2.5 py-1 rounded-full font-semibold ${
            isCompleted ? 'bg-emerald-100 text-emerald-800' : isProcessing ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
          }">
            ${task.status}
          </span>
        </div>

        <div class="mt-3 flex gap-4">
          <img src="${photo}" onclick="openLightboxModal('${photo}', '${task.title.replace(/'/g, "\\'")}', '${task.ticket_number}')" class="w-24 h-24 rounded-xl object-cover border border-slate-100 shrink-0 cursor-pointer hover:opacity-90 transition shadow-sm" title="Klik untuk perbesar bukti foto">
          <div class="flex-1">
            <h4 class="font-bold text-[#00152F] text-base leading-snug">${task.title}</h4>
            <p class="text-xs text-slate-600 mt-1 line-clamp-2">${task.description}</p>
            <div class="flex items-center gap-1 text-xs text-slate-500 mt-2 font-tabular">
              <span class="material-symbols-outlined text-xs text-blue-600">location_on</span>
              <span>${task.landmark} (${task.kecamatan})</span>
            </div>
          </div>
        </div>

        <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span class="text-xs text-slate-400 font-tabular">
            ${new Date(task.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
          </span>
          <div class="flex items-center gap-2">
            ${!isCompleted && !isProcessing ? `
              <button onclick="startHandlingTask('${task.id}')" class="px-3 py-1.5 bg-[#32618E] hover:bg-[#254b6e] text-white text-xs font-bold rounded-xl flex items-center gap-1 transition">
                <span class="material-symbols-outlined text-xs">play_arrow</span> Mulai Tangani
              </button>
            ` : ''}
            ${!isCompleted ? `
              <button onclick="openVerificationModal('${task.id}')" class="px-3 py-1.5 bg-[#00A472] hover:bg-[#008f63] text-white text-xs font-bold rounded-xl flex items-center gap-1 transition">
                <span class="material-symbols-outlined text-xs">verified</span> Verifikasi Pengerjaan
              </button>
            ` : `
              <span class="text-xs text-emerald-600 font-bold flex items-center gap-1">
                <span class="material-symbols-outlined text-xs">check_circle</span> Terverifikasi & Selesai
              </span>
            `}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

window.startHandlingTask = async function(id) {
  const task = citizenReports.find(t => t.id === id);
  if (!task) return;

  task.status = 'Diproses Lapangan';
  try {
    await fetch(`${API_BASE}/crew/tasks/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Diproses Lapangan', officer_name: 'Ahmad Hidayat (Regu Alfa 03)' })
    });
  } catch (e) {}

  showToast(`Tiket ${task.ticket_number} kini dalam status: Diproses Lapangan!`, 'success');
  renderCrewTasks();
  if (activeIncidentForTracking && activeIncidentForTracking.id === id) {
    activeIncidentForTracking.status = 'Diproses Lapangan';
    renderCitizenTracker();
  }
};

window.openVerificationModal = function(id) {
  const task = citizenReports.find(t => t.id === id);
  if (!task) return;
  activeTaskForVerification = task;

  const modal = document.getElementById('verificationModal');
  document.getElementById('verifModalTicket').textContent = task.ticket_number;
  document.getElementById('verifModalTitle').textContent = task.title;

  const beforePhoto = (task.photo_urls && task.photo_urls.length > 0)
    ? task.photo_urls[0]
    : 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80';

  document.getElementById('verifBeforePhoto').src = beforePhoto;
  document.getElementById('verifAfterPreview').src = '';
  document.getElementById('verifAfterPreview').classList.add('hidden');
  document.getElementById('verifAfterPlaceholder').classList.remove('hidden');

  document.getElementById('verifMaterialsInput').value = '';
  document.getElementById('verifNotesInput').value = '';
  document.getElementById('verifDeclarationCheck').checked = false;

  modal.classList.remove('hidden');
};

window.closeVerificationModal = function() {
  const modal = document.getElementById('verificationModal');
  if (modal) modal.classList.add('hidden');
};

async function handleVerificationSubmit(e) {
  e.preventDefault();
  if (!activeTaskForVerification) return;

  const declaration = document.getElementById('verifDeclarationCheck').checked;
  const materials = document.getElementById('verifMaterialsInput').value.trim();
  const notes = document.getElementById('verifNotesInput').value.trim();
  const afterPreview = document.getElementById('verifAfterPreview').src;

  if (!declaration) {
    showToast('Pernyataan resmi penyelesaian wajib dicentang.', 'error');
    return;
  }

  const afterPhoto = afterPreview || 'https://images.unsplash.com/photo-1541888946425-d0fbb1861593?auto=format&fit=crop&w=600&q=80';

  const payload = {
    incident_id: activeTaskForVerification.id,
    crew_officer_name: 'Ahmad Hidayat (Regu Alfa 03)',
    before_photo_url: activeTaskForVerification.photo_urls[0] || '',
    after_photo_url: afterPhoto,
    materials_used: materials || 'Aspal Hotmix K-250 & Emulsi Perekat',
    field_notes: notes || 'Pekerjaan perbaikan selesai dan telah diratakan sesuai standar PUPR.',
    signed_declaration: true
  };

  try {
    await fetch(`${API_BASE}/crew/tasks/${activeTaskForVerification.id}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (err) {}

  activeTaskForVerification.status = 'Verifikasi Selesai';
  if (activeIncidentForTracking && activeIncidentForTracking.id === activeTaskForVerification.id) {
    activeIncidentForTracking.status = 'Verifikasi Selesai';
    renderCitizenTracker();
  }

  showToast('Berita Acara Pekerjaan Lapangan berhasil disahkan!', 'success');
  closeVerificationModal();
  renderCrewTasks();
}

// ----------------------------------------------------
// Admin Dashboard View: GIS Map, KPI & Assignment
// ----------------------------------------------------
function setupAdminEvents() {
  const filterKecamatan = document.getElementById('adminFilterKecamatan');
  const filterSeverity = document.getElementById('adminFilterSeverity');
  const searchInput = document.getElementById('adminSearchInput');

  if (filterKecamatan) {
    filterKecamatan.addEventListener('change', () => {
      renderAdminGisMarkers();
      renderAdminTable();
    });
  }
  if (filterSeverity) {
    filterSeverity.addEventListener('change', () => {
      renderAdminGisMarkers();
      renderAdminTable();
    });
  }
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderAdminTable();
    });
  }

  // Emergency Broadcast Form
  const broadcastBtn = document.getElementById('btnSendBroadcast');
  if (broadcastBtn) {
    broadcastBtn.addEventListener('click', handleEmergencyBroadcast);
  }
}

function initAdminGisMap() {
  if (adminGisMap) {
    adminGisMap.invalidateSize();
    return;
  }

  adminGisMap = L.map('adminGisMapContainer', {
    center: [-5.385000, 105.260000],
    zoom: 14
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; CARTO, OpenStreetMap',
    maxZoom: 19
  }).addTo(adminGisMap);

  adminGisLayerGroup = L.layerGroup().addTo(adminGisMap);
  renderAdminGisMarkers();
}

function renderAdminGisMarkers() {
  if (!adminGisMap || !adminGisLayerGroup) return;
  adminGisLayerGroup.clearLayers();

  const selectedKec = document.getElementById('adminFilterKecamatan')?.value || 'all';
  const selectedSev = document.getElementById('adminFilterSeverity')?.value || 'all';

  citizenReports.forEach(inc => {
    if (selectedKec !== 'all' && inc.kecamatan !== selectedKec) return;
    if (selectedSev !== 'all' && inc.severity !== selectedSev) return;

    let markerClass = 'pulse-marker';
    if (inc.status === 'Verifikasi Selesai') {
      markerClass = 'pulse-marker-green';
    } else if (inc.severity === 'Sedang') {
      markerClass = 'pulse-marker-amber';
    } else if (inc.status === 'Diproses Lapangan') {
      markerClass = 'pulse-marker-blue';
    }

    const icon = L.divIcon({
      className: 'custom-gis-pin',
      html: `<div class="${markerClass}"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });

    const marker = L.marker([inc.latitude, inc.longitude], { icon });
    marker.bindPopup(`
      <div class="p-2 min-w-[200px] font-sans">
        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800">${inc.ticket_number}</span>
        <h4 class="font-bold text-sm text-[#00152F] mt-1">${inc.title}</h4>
        <p class="text-xs text-slate-600 mt-1">${inc.landmark} (${inc.kecamatan})</p>
        <div class="mt-2 pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
          <span class="font-bold text-blue-800">${inc.status}</span>
          <button onclick="switchRole('crew')" class="text-xs bg-[#00152F] text-white px-2 py-1 rounded hover:bg-blue-900">Kelola</button>
        </div>
      </div>
    `);
    adminGisLayerGroup.addLayer(marker);
  });

  // Add Fleet Unit Marker (Regu Alfa 03)
  const unitIcon = L.divIcon({
    className: 'custom-fleet-pin',
    html: `
      <div class="bg-[#00152F] text-white px-2 py-1 rounded-lg text-[10px] font-bold shadow-lg flex items-center gap-1 border border-white">
        <span class="material-symbols-outlined text-[12px] text-[#4EDEA3]">directions_car</span>
        <span>Alfa 03</span>
      </div>
    `,
    iconSize: [64, 24],
    iconAnchor: [32, 12]
  });

  const fleetMarker = L.marker([-5.381200, 105.258900], { icon: unitIcon });
  fleetMarker.bindPopup(`
    <div class="p-2 font-sans">
      <h4 class="font-bold text-sm text-[#00152F]">Regu Alfa 03 (PUPR)</h4>
      <p class="text-xs text-emerald-700 font-semibold mt-1">Status: Siaga Aktif</p>
      <p class="text-xs text-slate-500 mt-1">2 Tugas Aktif di Wilayah Kedaton</p>
    </div>
  `);
  adminGisLayerGroup.addLayer(fleetMarker);
}

function renderAdminTable() {
  const tbody = document.getElementById('adminIncidentTableBody');
  if (!tbody) return;

  const kecFilter = document.getElementById('adminFilterKecamatan')?.value || 'all';
  const sevFilter = document.getElementById('adminFilterSeverity')?.value || 'all';
  const search = document.getElementById('adminSearchInput')?.value.toLowerCase() || '';

  const filtered = citizenReports.filter(inc => {
    if (kecFilter !== 'all' && inc.kecamatan !== kecFilter) return false;
    if (sevFilter !== 'all' && inc.severity !== sevFilter) return false;
    if (search && !inc.title.toLowerCase().includes(search) && !inc.ticket_number.toLowerCase().includes(search)) return false;
    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-slate-400 text-sm">Tidak ada data tiket sesuai filter</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(inc => {
    return `
      <tr class="hover:bg-slate-50 transition border-b border-slate-100">
        <td class="p-4 font-tabular font-bold text-xs text-[#00152F]">${inc.ticket_number}</td>
        <td class="p-4">
          <div class="font-semibold text-sm text-[#00152F]">${inc.title}</div>
          <div class="text-xs text-slate-500">${inc.category}</div>
        </td>
        <td class="p-4 text-xs text-slate-600">${inc.kecamatan}</td>
        <td class="p-4">
          <span class="text-xs font-bold px-2 py-0.5 rounded-full ${inc.severity === 'Tinggi' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}">
            ${inc.severity}
          </span>
        </td>
        <td class="p-4">
          <span class="text-xs font-semibold px-2 py-0.5 rounded-full ${
            inc.status === 'Verifikasi Selesai' ? 'bg-emerald-100 text-emerald-800' :
            inc.status === 'Diproses Lapangan' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
          }">
            ${inc.status}
          </span>
        </td>
        <td class="p-4 text-xs font-tabular">
          ${inc.assigned_team_name ? `<span class="text-blue-700 font-semibold">${inc.assigned_team_name}</span>` : `
            <button onclick="quickAssignCrew('${inc.id}')" class="px-2.5 py-1 bg-[#32618E] text-white rounded-lg hover:bg-blue-900 transition font-sans">
              Disposisi
            </button>
          `}
        </td>
      </tr>
    `;
  }).join('');
}

window.quickAssignCrew = async function(id) {
  const inc = citizenReports.find(i => i.id === id);
  if (!inc) return;

  inc.assigned_team_name = 'Regu Alfa 03 - Dinas PUPR';
  inc.status = 'Disposisi Resmi';

  try {
    await fetch(`${API_BASE}/admin/incidents/${id}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        crew_id: '44444444-4444-4444-4444-444444444441',
        team_name: 'Regu Alfa 03 - Dinas PUPR'
      })
    });
  } catch (e) {}

  showToast(`Tiket ${inc.ticket_number} berhasil didisposisikan ke Regu Alfa 03!`, 'success');
  renderAdminTable();
  renderAdminGisMarkers();
  updateAdminKpis();
};

function updateAdminKpis() {
  const total = citizenReports.length;
  const awaiting = citizenReports.filter(i => i.status === 'Diajukan' || i.status === 'Menunggu Disposisi').length;
  const process = citizenReports.filter(i => i.status === 'Disposisi Resmi' || i.status === 'Diproses Lapangan').length;
  const completed = citizenReports.filter(i => i.status === 'Verifikasi Selesai').length;

  document.getElementById('kpiTotalReports').textContent = total;
  document.getElementById('kpiAwaiting').textContent = awaiting;
  document.getElementById('kpiInProgress').textContent = process;
  document.getElementById('kpiCompleted').textContent = completed;
}

async function handleEmergencyBroadcast() {
  const title = document.getElementById('broadcastTitle').value.trim();
  const message = document.getElementById('broadcastMessage').value.trim();
  const channel = document.getElementById('broadcastChannel').value;

  if (!title || !message) {
    showToast('Harap isi judul dan pesan darurat.', 'error');
    return;
  }

  try {
    await fetch(`${API_BASE}/admin/broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, message, channel })
    });
  } catch (e) {}

  showToast(`Siaran peringatan publik "${title}" berhasil dikirim via ${channel}!`, 'success');
  document.getElementById('broadcastTitle').value = '';
  document.getElementById('broadcastMessage').value = '';
}

// ----------------------------------------------------
// UI Helpers & Toast Notification
// ----------------------------------------------------
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  const bgColor = type === 'success' ? 'bg-[#00152F] border-l-4 border-[#00A472]' : type === 'error' ? 'bg-red-800' : 'bg-[#0F2A4A]';

  toast.className = `${bgColor} text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-sm transition-all duration-300 transform translate-y-2`;
  toast.innerHTML = `
    <span class="material-symbols-outlined text-sm ${type === 'success' ? 'text-[#4EDEA3]' : 'text-white'}">
      ${type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info'}
    </span>
    <span class="flex-1">${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => toast.classList.remove('translate-y-2'), 10);
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-x-4');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ----------------------------------------------------
// Lightbox & WhatsApp Simulation Helpers
// ----------------------------------------------------
window.openLightboxModal = function(src, title, ticket) {
  const modal = document.getElementById('evidenceLightboxModal');
  const img = document.getElementById('lightboxImg');
  const ticketEl = document.getElementById('lightboxTicket');
  const titleEl = document.getElementById('lightboxTitle');
  const dl = document.getElementById('lightboxDownloadBtn');

  if (modal && img) {
    img.src = src;
    if (ticketEl) ticketEl.textContent = ticket || 'Bukti Foto';
    if (titleEl) titleEl.textContent = title || 'Inspeksi Bukti Lapangan';
    if (dl) dl.href = src;
    modal.classList.remove('hidden');
  }
};

window.closeLightboxModal = function() {
  const modal = document.getElementById('evidenceLightboxModal');
  if (modal) modal.classList.add('hidden');
};

window.triggerSimulatedWhatsApp = function(ticket, message) {
  const drawer = document.getElementById('whatsappSimDrawer');
  const msgEl = document.getElementById('waSimMessage');
  const timeEl = document.getElementById('waSimTime');

  if (drawer && msgEl) {
    msgEl.innerHTML = message;
    if (timeEl) {
      const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      timeEl.textContent = `${now} WIB ✓✓`;
    }
    drawer.classList.remove('hidden');
    setTimeout(() => {
      drawer.classList.add('hidden');
    }, 9000);
  }
};


