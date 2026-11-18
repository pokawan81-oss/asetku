/* ============================================================
   AsetKu — Pencatatan Aset
   JavaScript murni (tanpa library). Data disimpan di localStorage.
   ============================================================ */
(function () {
  'use strict';

  /* ---------------- Konstanta ---------------- */
  const DATA_KEY = 'asetku.data.v1';
  const THEME_KEY = 'asetku.theme';
  const UI_KEY = 'asetku.ui.v1';
  const USERS_KEY = 'asetku.users.v1';
  const SESSION_KEY = 'asetku.session.v1';
  const PAGE_SIZE = 8;

  const REPORT_WEEKS = 8;
  const REPORT_MONTHS = 6;
  const WARNA_GRAFIK = ['#2563eb', '#22c55e', '#f59e0b', '#a855f7', '#ef4444', '#14b8a6', '#64748b'];
  const WARNA_KONDISI = { 'Baik': '#22c55e', 'Rusak Ringan': '#f59e0b', 'Rusak Berat': '#ef4444' };

  const PBKDF2_ITERATIONS = 150000;
  const SESSION_TTL = 30 * 24 * 60 * 60 * 1000; /* 30 hari untuk "Ingat saya" */
  const MAX_LOGIN_ATTEMPTS = 5;
  const LOCK_DURATION = 30 * 1000; /* 30 detik */

  const KONDISI = ['Baik', 'Rusak Ringan', 'Rusak Berat'];
  const KATEGORI_UMUM = ['Elektronik', 'Furnitur', 'Kendaraan', 'Inventaris IT', 'Peralatan Kantor', 'Bangunan', 'Lainnya'];
  const SATUAN_UMUM = ['Unit', 'Buah', 'Set', 'Lembar', 'Dus', 'Paket', 'Orang'];

  /* Tanggal relatif untuk contoh data agar dashboard langsung terisi */
  const tanggalLalu = (hari) => {
    const d = new Date();
    d.setDate(d.getDate() - hari);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };

  const CONTOH = [
    { kode: '', nama: 'Laptop Lenovo ThinkPad E14', kategori: 'Inventaris IT', jumlah: 6, satuan: 'Unit', kondisi: 'Baik', lokasi: 'Ruang IT Lt. 2', tanggal: '2024-02-12', harga: 12500000, keterangan: 'Digunakan tim operasional dan developer.' },
    { kode: '', nama: 'Printer Epson L3250', kategori: 'Elektronik', jumlah: 2, satuan: 'Unit', kondisi: 'Rusak Ringan', lokasi: 'Ruang Administrasi', tanggal: '2023-08-05', harga: 2850000, keterangan: 'Unit kedua sering macet saat mencetak.' },
    { kode: '', nama: 'Meja Kerja Staff', kategori: 'Furnitur', jumlah: 12, satuan: 'Buah', kondisi: 'Baik', lokasi: 'Lantai 1 - Area Staff', tanggal: '2022-11-20', harga: 1450000, keterangan: '' },
    { kode: '', nama: 'Kursi Ergonomis', kategori: 'Furnitur', jumlah: 15, satuan: 'Buah', kondisi: 'Baik', lokasi: 'Lantai 1 - Area Staff', tanggal: '2022-11-20', harga: 950000, keterangan: 'Kursi dengan sandaran mesh.' },
    { kode: '', nama: 'Proyektor BenQ MX560', kategori: 'Elektronik', jumlah: 1, satuan: 'Unit', kondisi: 'Baik', lokasi: 'Ruang Rapat Utama', tanggal: '2024-06-18', harga: 6200000, keterangan: 'Termasuk kabel HDMI 10 meter.' },
    { kode: '', nama: 'Toyota Avanza (B 1234 XYZ)', kategori: 'Kendaraan', jumlah: 1, satuan: 'Unit', kondisi: 'Baik', lokasi: 'Parkir Basement', tanggal: '2021-03-10', harga: 215000000, keterangan: 'Pajak berlaku sampai Maret 2027.' },
    { kode: '', nama: 'AC Split 1.5 PK', kategori: 'Peralatan Kantor', jumlah: 8, satuan: 'Unit', kondisi: 'Rusak Berat', lokasi: 'Lantai 2 - Ruang Meeting', tanggal: '2020-09-01', harga: 4200000, keterangan: 'Satu unit tidak dingin dan perlu diganti.' },
    { kode: '', nama: 'Server NAS Synology DS920+', kategori: 'Inventaris IT', jumlah: 1, satuan: 'Unit', kondisi: 'Baik', lokasi: 'Ruang Server', tanggal: '2023-12-04', harga: 18900000, keterangan: 'Penyimpanan backup internal 32 TB.' },
    { kode: '', nama: 'Laptop Staf Baru', kategori: 'Inventaris IT', jumlah: 2, satuan: 'Unit', kondisi: 'Baik', lokasi: 'Ruang IT Lt. 2', tanggal: tanggalLalu(0), harga: 9500000, keterangan: 'Pengadaan minggu ini.' },
    { kode: '', nama: 'Kursi Kerja Baru', kategori: 'Furnitur', jumlah: 6, satuan: 'Buah', kondisi: 'Baik', lokasi: 'Lantai 1 - Area Staff', tanggal: tanggalLalu(6), harga: 1250000, keterangan: '' },
    { kode: '', nama: 'Printer Kasir', kategori: 'Elektronik', jumlah: 1, satuan: 'Unit', kondisi: 'Rusak Ringan', lokasi: 'Ruang Administrasi', tanggal: tanggalLalu(24), harga: 2150000, keterangan: '' },
    { kode: '', nama: 'Lemari Arsip', kategori: 'Peralatan Kantor', jumlah: 3, satuan: 'Buah', kondisi: 'Baik', lokasi: 'Gudang Lt. 1', tanggal: tanggalLalu(40), harga: 2000000, keterangan: '' }
  ];

  const SVG = {
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="2.6"/></svg>',
    pencil: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3z"/><path d="m14.5 5.5 3 3"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v5M14 11v5"/></svg>',
    box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 8.5 12 3 3 8.5v7L12 21l9-5.5z"/><path d="M3 8.5 12 14l9-5.5"/><path d="M12 14v7"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m4.5 12.5 5 5L20 7"/></svg>',
    alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.3 3.9 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>'
  };

  /* ---------------- Format & util ---------------- */
  const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
  const angka = new Intl.NumberFormat('id-ID');
  const tanggalFmt = new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  const waktuFmt = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const uid = () => {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      try { return window.crypto.randomUUID(); } catch (err) { /* fallback */ }
    }
    return 'a-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
  };

  const esc = (value) => String(value == null ? '' : value).replace(/[&<>"']/g, (ch) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
  ));

  const debounce = (fn, wait = 170) => {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), wait);
    };
  };

  const todayIso = () => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  };

  /* ---------------- Utilitas periode laporan ---------------- */
  const pad2 = (n) => String(n).padStart(2, '0');
  const isoOf = (d) => d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());

  const parseIsoDate = (value) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
    if (!match) return null;
    const d = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    if (d.getFullYear() !== Number(match[1]) || d.getMonth() !== Number(match[2]) - 1 || d.getDate() !== Number(match[3])) return null;
    return d;
  };

  const startOfWeek = (date) => {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const back = (d.getDay() + 6) % 7; /* Senin = awal minggu */
    d.setDate(d.getDate() - back);
    return d;
  };

  const addDays = (date, days) => {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    d.setDate(d.getDate() + days);
    return d;
  };

  const addMonths = (date, months) => new Date(date.getFullYear(), date.getMonth() + months, 1);

  const isoWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const day = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  };

  const bulanPanjang = new Intl.DateTimeFormat('id-ID', { month: 'long' });
  const bulanPendek = new Intl.DateTimeFormat('id-ID', { month: 'short' });
  const angkaRingkas = new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 });

  const formatWeekRange = (start) => {
    const end = addDays(start, 6);
    if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
      return start.getDate() + '–' + end.getDate() + ' ' + bulanPendek.format(start) + ' ' + start.getFullYear();
    }
    if (start.getFullYear() === end.getFullYear()) {
      return start.getDate() + ' ' + bulanPendek.format(start) + ' – ' + end.getDate() + ' ' + bulanPendek.format(end) + ' ' + end.getFullYear();
    }
    return start.getDate() + ' ' + bulanPendek.format(start) + ' ' + start.getFullYear() + ' – ' +
      end.getDate() + ' ' + bulanPendek.format(end) + ' ' + end.getFullYear();
  };

  const formatMonthRange = (start, end) => start.getDate() + '–' + end.getDate() + ' ' +
    bulanPendek.format(start) + ' ' + start.getFullYear();

  const formatMonthLabel = (date) => bulanPanjang.format(date) + ' ' + date.getFullYear();

  const reportMetricLabel = () => (state.report.metric === 'nilai' ? 'nilai' : 'unit');

  function formatTanggal(iso) {
    if (!iso) return '—';
    const parts = String(iso).split('-').map(Number);
    if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return iso;
    return tanggalFmt.format(new Date(parts[0], parts[1] - 1, parts[2]));
  }

  function formatWaktu(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return waktuFmt.format(d);
  }

  const nilaiAset = (a) => (Number(a.jumlah) || 0) * (Number(a.harga) || 0);

  /* ---------------- State ---------------- */
  const state = {
    items: [],
    view: [],
    query: '',
    kategori: 'all',
    kondisi: 'all',
    sort: 'baru',
    columnFilters: {},
    page: 1,
    editId: null,
    detailId: null,
    pendingConfirm: null,
    formSnapshot: '',
    report: {
      source: 'tanggal',
      mode: 'mingguan',
      metric: 'unit',
      offset: 0
    }
  };

  let currentUser = null;
  const loginLock = { fails: 0, until: 0, timer: null };

  /* ---------------- Penyimpanan ---------------- */
  function normalize(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const nama = String(raw.nama == null ? '' : raw.nama).trim().replace(/\s+/g, ' ');
    if (!nama) return null;

    const jumlah = Math.round(Number(raw.jumlah));
    const harga = Number(raw.harga);

    return {
      id: typeof raw.id === 'string' && raw.id ? raw.id : uid(),
      kode: String(raw.kode == null ? '' : raw.kode).trim(),
      nama,
      kategori: String(raw.kategori == null ? '' : raw.kategori).trim() || 'Lainnya',
      jumlah: Number.isFinite(jumlah) && jumlah > 0 ? jumlah : 1,
      satuan: String(raw.satuan == null ? '' : raw.satuan).trim() || 'Unit',
      kondisi: KONDISI.indexOf(raw.kondisi) !== -1 ? raw.kondisi : 'Baik',
      lokasi: String(raw.lokasi == null ? '' : raw.lokasi).trim(),
      tanggal: /^\d{4}-\d{2}-\d{2}$/.test(raw.tanggal || '') ? raw.tanggal : '',
      harga: Number.isFinite(harga) && harga > 0 ? harga : 0,
      keterangan: String(raw.keterangan == null ? '' : raw.keterangan).trim(),
      createdAt: raw.createdAt || new Date().toISOString(),
      updatedAt: raw.updatedAt || raw.createdAt || new Date().toISOString()
    };
  }

  function loadData() {
    try {
      const raw = localStorage.getItem(DATA_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      const list = Array.isArray(parsed) ? parsed : (parsed && Array.isArray(parsed.items) ? parsed.items : []);
      return list.map(normalize).filter(Boolean);
    } catch (err) {
      console.warn('Gagal membaca data aset:', err);
      return [];
    }
  }

  function persistItems(items) {
    try {
      localStorage.setItem(DATA_KEY, JSON.stringify(items));
      setSaveStatus('Tersimpan ' + new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(new Date()));
      return true;
    } catch (err) {
      console.error('Gagal menyimpan data:', err);
      setSaveStatus('Gagal menyimpan', false);
      toast('Data gagal disimpan. Penyimpanan browser penuh atau diblokir — ekspor data Anda untuk cadangan.', 'error');
      return false;
    }
  }

  function persist() {
    return persistItems(state.items);
  }

  let statusTimer = null;
  function setSaveStatus(text, ok = true) {
    const el = $('#saveStatus');
    if (!el) return;
    const label = el.querySelector('.save-text');
    el.classList.toggle('error', !ok);
    if (label) label.textContent = text;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => {
      el.classList.remove('error');
      if (label) label.textContent = 'Tersimpan otomatis';
    }, 2600);
  }

  /* ---------------- Tema ---------------- */
  function applyTheme(theme, save) {
    const next = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    if (save) {
      try { localStorage.setItem(THEME_KEY, next); } catch (err) { /* abaikan */ }
    }
    const btn = $('#themeToggle');
    if (btn) {
      const label = next === 'dark' ? 'Aktifkan mode terang' : 'Aktifkan mode gelap';
      btn.setAttribute('aria-label', label);
      btn.setAttribute('title', label);
    }
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', next === 'dark' ? '#080e1c' : '#2563eb');
  }

  /* ---------------- Autentikasi ---------------- */
  const encoder = new TextEncoder();

  function bytesToB64(bytes) {
    const arr = new Uint8Array(bytes);
    let binary = '';
    for (let i = 0; i < arr.length; i += 1) binary += String.fromCharCode(arr[i]);
    return btoa(binary);
  }

  function b64ToBytes(b64) {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  function randomSalt() {
    const bytes = new Uint8Array(16);
    if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
      window.crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
    }
    return bytesToB64(bytes);
  }

  /* Cadangan bila Web Crypto tidak tersedia (mis. konteks tidak aman). */
  function fallbackHash(password, saltB64) {
    let h1 = 0x811c9dc5;
    let h2 = 0x9e3779b9;
    const input = saltB64 + '|' + password + '|asetku';
    for (let round = 0; round < 15000; round += 1) {
      for (let i = 0; i < input.length; i += 1) {
        const c = input.charCodeAt(i) + round;
        h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
        h2 = Math.imul(h2 ^ c, 0x85ebca6b) >>> 0;
        h2 = ((h2 << 13) | (h2 >>> 19)) >>> 0;
      }
      h1 = (h1 + h2) >>> 0;
    }
    return ('0000000' + h1.toString(16)).slice(-8) + ('0000000' + h2.toString(16)).slice(-8);
  }

  async function hashPassword(password, saltB64, iterations, algo) {
    const wantsFallback = algo === 'fallback';
    if (!wantsFallback && window.crypto && window.crypto.subtle) {
      try {
        const key = await window.crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
        const bits = await window.crypto.subtle.deriveBits(
          {
            name: 'PBKDF2',
            salt: b64ToBytes(saltB64),
            iterations: iterations || PBKDF2_ITERATIONS,
            hash: 'SHA-256'
          },
          key,
          256
        );
        return { algo: 'pbkdf2-sha256', hash: bytesToB64(new Uint8Array(bits)) };
      } catch (err) {
        console.warn('Web Crypto tidak tersedia, memakai hash cadangan.', err);
      }
    }
    return { algo: 'fallback', hash: fallbackHash(password, saltB64) };
  }

  function safeEqual(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
  }

  async function verifyPassword(user, password) {
    if (!user || !user.salt || !user.hash) return false;
    const result = await hashPassword(password, user.salt, user.iterations, user.algo);
    return safeEqual(result.hash, user.hash);
  }

  function loadUsers() {
    try {
      const raw = localStorage.getItem(USERS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      const list = Array.isArray(parsed) ? parsed : (parsed && Array.isArray(parsed.users) ? parsed.users : []);
      return list.filter((u) => u && typeof u === 'object' && u.id && typeof u.username === 'string' && u.salt && u.hash);
    } catch (err) {
      console.warn('Gagal membaca akun:', err);
      return [];
    }
  }

  function saveUsers(users) {
    try {
      localStorage.setItem(USERS_KEY, JSON.stringify({ version: 1, users }));
      return true;
    } catch (err) {
      console.error('Gagal menyimpan akun:', err);
      toast('Akun gagal disimpan di browser ini. Penyimpanan mungkin penuh atau diblokir.', 'error');
      return false;
    }
  }

  function findUserByUsername(username) {
    const needle = String(username || '').trim().toLowerCase();
    if (!needle) return null;
    return loadUsers().find((u) => String(u.username).toLowerCase() === needle) || null;
  }

  function updateLastLogin(userId) {
    const users = loadUsers().map((u) => (
      u.id === userId ? Object.assign({}, u, { lastLogin: new Date().toISOString() }) : u
    ));
    saveUsers(users);
    return users.find((u) => u.id === userId) || null;
  }

  function createSession(user, remember) {
    const payload = {
      userId: user.id,
      username: user.username,
      createdAt: Date.now(),
      expiresAt: remember ? Date.now() + SESSION_TTL : 0
    };
    const raw = JSON.stringify(payload);
    try {
      if (remember) {
        localStorage.setItem(SESSION_KEY, raw);
        sessionStorage.removeItem(SESSION_KEY);
      } else {
        sessionStorage.setItem(SESSION_KEY, raw);
        localStorage.removeItem(SESSION_KEY);
      }
    } catch (err) {
      console.warn('Gagal menyimpan sesi:', err);
    }
  }

  function readSession() {
    let raw = null;
    try {
      raw = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
    } catch (err) {
      return null;
    }
    if (!raw) return null;
    try {
      const session = JSON.parse(raw);
      if (!session || !session.userId) return null;
      if (session.expiresAt && Date.now() > session.expiresAt) {
        clearSession();
        return null;
      }
      return session;
    } catch (err) {
      return null;
    }
  }

  function clearSession() {
    try {
      localStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_KEY);
    } catch (err) { /* abaikan */ }
  }

  function setAuthAlert(id, message) {
    const el = document.getElementById(id);
    if (!el) return;
    if (!message) {
      el.hidden = true;
      el.textContent = '';
      return;
    }
    el.hidden = false;
    el.textContent = message;
  }

  function setUserChip(user) {
    const label = String(user.displayName || user.username || 'Pengguna').trim();
    $('#userName').textContent = label;
    $('#userMetaName').textContent = label;
    $('#userAvatar').textContent = label.charAt(0).toUpperCase() || 'A';
    $('#userMenuBtn').setAttribute('title', 'Masuk sebagai ' + label);
  }

  function closeUserMenu() {
    const menu = $('#userMenu');
    const btn = $('#userMenuBtn');
    if (menu) menu.hidden = true;
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }

  function startLockCountdown() {
    const btn = $('#loginSubmit');
    if (!btn) return;
    clearInterval(loginLock.timer);
    const tick = () => {
      const remaining = Math.ceil((loginLock.until - Date.now()) / 1000);
      if (remaining <= 0) {
        clearInterval(loginLock.timer);
        loginLock.timer = null;
        btn.disabled = false;
        btn.textContent = 'Masuk';
        return;
      }
      btn.disabled = true;
      btn.textContent = 'Tunggu ' + remaining + ' dtk';
    };
    tick();
    loginLock.timer = setInterval(tick, 500);
  }

  function resetLoginLock() {
    loginLock.fails = 0;
    loginLock.until = 0;
    clearInterval(loginLock.timer);
    loginLock.timer = null;
    const btn = $('#loginSubmit');
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Masuk';
    }
  }

  function showAuth(view) {
    const isSetup = view === 'setup';

    $('#appShell').hidden = true;
    $('#authScreen').hidden = false;
    document.body.classList.add('auth-mode');

    $('#loginView').hidden = isSetup;
    $('#setupView').hidden = !isSetup;

    setAuthAlert('loginAlert', '');
    setAuthAlert('setupAlert', '');
    clearFormErrors('#setupForm');
    $('#loginForm').reset();
    $('#setupForm').reset();
    $('#rememberMe').checked = true;

    if (!isSetup) {
      const users = loadUsers();
      if (users[0]) $('#loginUsername').value = users[0].username;
      if (Date.now() >= loginLock.until) {
        const btn = $('#loginSubmit');
        btn.disabled = false;
        btn.textContent = 'Masuk';
      }
    }

    setTimeout(() => {
      const target = isSetup ? $('#setupUsername') : $('#loginUsername');
      if (!target) return;
      target.focus();
      if (!isSetup) target.select();
    }, 60);
  }

  function enterApp(user) {
    currentUser = user;
    $('#authScreen').hidden = true;
    $('#appShell').hidden = false;
    document.body.classList.remove('auth-mode');
    setUserChip(user);

    state.items = loadData();
    state.page = 1;
    renderKategoriOptions();
    renderAll();
    setSaveStatus('Tersimpan otomatis');
  }

  function startAuth() {
    const users = loadUsers();

    if (!users.length) {
      showAuth('setup');
      return;
    }

    const session = readSession();
    if (session) {
      const user = users.find((u) => u.id === session.userId) ||
        users.find((u) => String(u.username).toLowerCase() === String(session.username || '').toLowerCase());
      if (user) {
        enterApp(user);
        return;
      }
      clearSession();
    }

    showAuth('login');
  }

  function logout() {
    clearSession();
    currentUser = null;
    resetLoginLock();
    closeUserMenu();
    closeDataMenu();
    closeAllModals();

    state.items = [];
    state.view = [];
    state.query = '';
    state.kategori = 'all';
    state.kondisi = 'all';
    state.sort = 'baru';
    state.page = 1;
    state.editId = null;
    state.detailId = null;
    state.pendingConfirm = null;

    const search = $('#searchInput');
    if (search) search.value = '';
    const sort = $('#sortSelect');
    if (sort) sort.value = 'baru';
    const kategori = $('#filterKategori');
    if (kategori) kategori.value = 'all';
    const kondisi = $('#filterKondisi');
    if (kondisi) kondisi.value = 'all';

    renderKategoriOptions();
    renderAll();
    showAuth('login');
    toast('Anda telah keluar dari aplikasi.', 'info');
  }

  function resetAccount() {
    try {
      localStorage.removeItem(USERS_KEY);
    } catch (err) { /* abaikan */ }
    clearSession();
    currentUser = null;
    resetLoginLock();
    const word = $('#resetWord');
    if (word) word.value = '';
    const btn = $('#btnResetAccount');
    if (btn) btn.disabled = true;
    closeModal($('#resetModal'));
    showAuth('setup');
    toast('Akun direset. Silakan buat akun baru.', 'info');
  }

  function openPasswordModal() {
    closeUserMenu();
    $('#passwordForm').reset();
    clearFormErrors('#passwordForm');
    setAuthAlert('passwordAlert', '');
    const btn = $('#btnSavePassword');
    btn.disabled = false;
    btn.textContent = 'Simpan Kata Sandi';
    openModal($('#passwordModal'));
  }

  /* ---------------- Render ---------------- */
  /* ---------------- Dashboard & laporan ---------------- */
  function loadUiPrefs() {
    try {
      const raw = localStorage.getItem(UI_KEY);
      if (!raw) return;
      const prefs = JSON.parse(raw);
      const report = prefs && prefs.report;
      if (!report) return;
      if (report.source === 'tanggal' || report.source === 'createdAt') state.report.source = report.source;
      if (report.mode === 'mingguan' || report.mode === 'bulanan') state.report.mode = report.mode;
      if (report.metric === 'unit' || report.metric === 'nilai') state.report.metric = report.metric;
    } catch (err) { /* abaikan preferensi rusak */ }
  }

  function saveUiPrefs() {
    try {
      localStorage.setItem(UI_KEY, JSON.stringify({
        report: {
          source: state.report.source,
          mode: state.report.mode,
          metric: state.report.metric
        }
      }));
    } catch (err) { /* abaikan */ }
  }

  function reportDateOf(item, source) {
    if (source === 'createdAt') {
      const d = new Date(item.createdAt);
      if (Number.isNaN(d.getTime())) return null;
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }
    return parseIsoDate(item.tanggal);
  }

  function periodFor(date, mode) {
    if (mode === 'bulanan') {
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      return {
        key: start.getFullYear() + '-' + pad2(start.getMonth() + 1),
        start,
        end: new Date(start.getFullYear(), start.getMonth() + 1, 0)
      };
    }
    const start = startOfWeek(date);
    return { key: isoOf(start), start, end: addDays(start, 6) };
  }

  function shiftPeriodDate(date, mode, delta) {
    return mode === 'bulanan' ? addMonths(date, delta) : addDays(startOfWeek(date), delta * 7);
  }

  function collectReport(items, source, mode, offset) {
    const windowSize = mode === 'bulanan' ? REPORT_MONTHS : REPORT_WEEKS;
    const focusDate = shiftPeriodDate(new Date(), mode, -offset);
    const periods = [];

    for (let i = windowSize - 1; i >= 0; i -= 1) {
      const period = periodFor(shiftPeriodDate(focusDate, mode, -i), mode);
      period.jenis = 0;
      period.unit = 0;
      period.nilai = 0;
      periods.push(period);
    }

    const buckets = new Map(periods.map((period) => [period.key, period]));
    const tanpaTanggal = { jenis: 0, unit: 0, nilai: 0 };
    const windowItems = [];

    items.forEach((item) => {
      const unit = Number(item.jumlah) || 0;
      const nilai = nilaiAset(item);
      const date = reportDateOf(item, source);

      if (!date) {
        tanpaTanggal.jenis += 1;
        tanpaTanggal.unit += unit;
        tanpaTanggal.nilai += nilai;
        return;
      }

      const bucket = buckets.get(periodFor(date, mode).key);
      if (!bucket) return;

      bucket.jenis += 1;
      bucket.unit += unit;
      bucket.nilai += nilai;
      windowItems.push(item);
    });

    const focus = periods[periods.length - 1];
    const prev = buckets.get(periodFor(shiftPeriodDate(focus.start, mode, -1), mode).key) ||
      { jenis: 0, unit: 0, nilai: 0 };

    const metricKey = state.report.metric === 'nilai' ? 'nilai' : 'unit';

    const kategoriMap = new Map();
    const lokasiMap = new Map();
    const kondisi = { 'Baik': 0, 'Rusak Ringan': 0, 'Rusak Berat': 0 };

    windowItems.forEach((item) => {
      const unit = Number(item.jumlah) || 0;
      const nilai = nilaiAset(item);

      const kategori = item.kategori || 'Lainnya';
      const kategoriEntry = kategoriMap.get(kategori) || { label: kategori, unit: 0, nilai: 0 };
      kategoriEntry.unit += unit;
      kategoriEntry.nilai += nilai;
      kategoriMap.set(kategori, kategoriEntry);

      const lokasi = String(item.lokasi || '').trim() || 'Tanpa lokasi';
      const lokasiEntry = lokasiMap.get(lokasi) || { label: lokasi, unit: 0, nilai: 0 };
      lokasiEntry.unit += unit;
      lokasiEntry.nilai += nilai;
      lokasiMap.set(lokasi, lokasiEntry);

      const kondisiKey = kondisi[item.kondisi] == null ? 'Baik' : item.kondisi;
      kondisi[kondisiKey] += 1;
    });

    const urutMetric = (a, b) => (
      b[metricKey] - a[metricKey] || a.label.localeCompare(b.label, 'id', { sensitivity: 'base' })
    );

    return {
      periods,
      focus,
      prev,
      windowSize,
      kategori: Array.from(kategoriMap.values()).sort(urutMetric),
      lokasi: Array.from(lokasiMap.values()).sort(urutMetric).slice(0, 5),
      kondisi,
      tanpaTanggal
    };
  }

  const chartEmpty = (text) => '<div class="chart-empty">' + esc(text) + '</div>';
  const metricValue = (entry) => (state.report.metric === 'nilai' ? entry.nilai : entry.unit);
  const compactNumber = (value) => angkaRingkas.format(Number(value) || 0);
  const compactRupiah = (value) => 'Rp ' + angkaRingkas.format(Number(value) || 0);

  function periodShort(period, mode) {
    if (mode === 'bulanan') {
      return bulanPendek.format(period.start) + ' ' + String(period.start.getFullYear()).slice(2);
    }
    return period.start.getDate() + ' ' + bulanPendek.format(period.start);
  }

  function periodTitle(period, mode) {
    if (mode === 'bulanan') return formatMonthLabel(period.start);
    return 'Mgg ' + isoWeekNumber(period.start) + ' · ' + formatWeekRange(period.start);
  }

  function niceMax(value) {
    if (!value) return 1;
    const power = Math.pow(10, Math.floor(Math.log10(value)));
    const base = value / power;
    const step = base <= 1 ? 1 : base <= 2 ? 2 : base <= 5 ? 5 : 10;
    return step * power;
  }

  function renderTrendChart(periods, mode) {
    const metric = state.report.metric;
    const values = periods.map(metricValue);
    const maxValue = Math.max.apply(null, values);

    if (!maxValue) return chartEmpty('Belum ada aset pada rentang ini.');

    const W = 720;
    const H = 260;
    const padL = 52;
    const padR = 12;
    const padT = 20;
    const padB = 38;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;
    const max = metric === 'unit'
      ? Math.max(4, Math.ceil(maxValue / 4) * 4)
      : niceMax(maxValue);
    const slot = plotW / periods.length;
    const barW = Math.min(40, slot * 0.52);

    let svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Grafik tren ' + (metric === 'nilai' ? 'nilai' : 'unit') + ' per ' + (mode === 'bulanan' ? 'bulan' : 'minggu') + '">';

    for (let i = 0; i <= 4; i += 1) {
      const y = Math.round(padT + plotH - (plotH * i / 4));
      const tick = max * i / 4;
      svg += '<line class="chart-grid" x1="' + padL + '" y1="' + y + '" x2="' + (W - padR) + '" y2="' + y + '"/>';
      svg += '<text class="chart-axis" x="' + (padL - 8) + '" y="' + (y + 3) + '" text-anchor="end">' + compactNumber(tick) + '</text>';
    }

    periods.forEach((period, index) => {
      const value = metricValue(period);
      const height = value ? Math.max(3, Math.round(plotH * value / max)) : 0;
      const x = padL + slot * index + (slot - barW) / 2;
      const y = padT + plotH - height;
      const focus = index === periods.length - 1;
      const tooltip = periodTitle(period, mode) + ' · ' + (metric === 'nilai' ? rupiah.format(value) : angka.format(value) + ' unit');

      svg += '<rect class="chart-bar' + (focus ? ' is-focus' : '') + '" fill-opacity="' + (focus ? '1' : '0.55') + '" x="' + Math.round(x) + '" y="' + y + '" width="' + Math.round(barW) + '" height="' + height + '" rx="6">' +
        '<title>' + esc(tooltip) + '</title></rect>';

      if (value > 0 && periods.length <= 8) {
        const label = metric === 'nilai' ? compactRupiah(value) : angka.format(value);
        svg += '<text class="chart-value" x="' + Math.round(x + barW / 2) + '" y="' + (y - 5) + '" text-anchor="middle">' + esc(label) + '</text>';
      }

      svg += '<text class="chart-axis" x="' + Math.round(x + barW / 2) + '" y="' + (H - 14) + '" text-anchor="middle">' +
        esc(periodShort(period, mode)) + '</text>';
    });

    svg += '</svg>';
    return svg;
  }

  function renderDonutChart(entries) {
    const metric = state.report.metric;
    const data = entries
      .map((entry) => ({ label: entry.label, value: metricValue(entry) }))
      .filter((entry) => entry.value > 0);

    if (!data.length) return chartEmpty('Belum ada data kategori pada rentang ini.');

    let groups = data;
    if (data.length > 6) {
      const top = data.slice(0, 5);
      const rest = data.slice(5).reduce((sum, entry) => sum + entry.value, 0);
      groups = top.concat([{ label: 'Lainnya', value: rest }]);
    }

    const total = groups.reduce((sum, entry) => sum + entry.value, 0);
    const size = 220;
    const center = size / 2;
    const radius = 78;
    const thickness = 26;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;
    let circles = '';

    groups.forEach((entry, index) => {
      const length = circumference * entry.value / total;
      const color = WARNA_GRAFIK[index % WARNA_GRAFIK.length];
      circles += '<circle cx="' + center + '" cy="' + center + '" r="' + radius + '" fill="none" stroke="' + color + '"' +
        ' stroke-width="' + thickness + '" stroke-dasharray="' + length.toFixed(2) + ' ' + (circumference - length).toFixed(2) + '"' +
        ' stroke-dashoffset="' + (-offset).toFixed(2) + '" transform="rotate(-90 ' + center + ' ' + center + ')">' +
        '<title>' + esc(entry.label + ' · ' + (metric === 'nilai' ? rupiah.format(entry.value) : angka.format(entry.value) + ' unit')) + '</title></circle>';
      offset += length;
    });

    const svg = '<svg viewBox="0 0 ' + size + ' ' + size + '" role="img" aria-label="Komposisi kategori berdasarkan ' + reportMetricLabel() + '">' +
      circles +
      '<text class="donut-center-value" x="' + center + '" y="' + (center - 2) + '" text-anchor="middle">' + compactNumber(total) + '</text>' +
      '<text class="donut-center-label" x="' + center + '" y="' + (center + 14) + '" text-anchor="middle">' + (metric === 'nilai' ? 'total nilai (Rp)' : 'total unit') + '</text>' +
      '</svg>';

    const legend = groups.map((entry, index) => {
      const percent = Math.round(entry.value / total * 100);
      const color = WARNA_GRAFIK[index % WARNA_GRAFIK.length];
      return '<li><span class="donut-dot" style="background:' + color + '"></span>' +
        '<span>' + esc(entry.label) + '</span><b>' + percent + '%</b></li>';
    }).join('');

    return '<div class="donut-wrap">' + svg + '<ul class="donut-legend">' + legend + '</ul></div>';
  }

  function renderHBar(entries, valueKind) {
    if (!entries.length) return chartEmpty('Belum ada data pada rentang ini.');
    const max = Math.max.apply(null, entries.map((entry) => entry.value)) || 1;

    const rows = entries.map((entry) => (
      '<div class="hbar-row">' +
        '<span class="hbar-label" title="' + esc(entry.label) + '">' + esc(entry.label) + '</span>' +
        '<span class="hbar-track"><span class="hbar-fill ' + (entry.className || '') + '" style="width:' +
          Math.max(4, Math.round(entry.value / max * 100)) + '%"></span></span>' +
        '<span class="hbar-value">' + (valueKind === 'nilai' ? compactRupiah(entry.value) : angka.format(entry.value) + ' unit') + '</span>' +
      '</div>'
    )).join('');

    return '<div class="hbar-list">' + rows + '</div>';
  }

  function renderBarChart(entries) {
    if (!entries.length) return chartEmpty('Belum ada data lokasi pada rentang ini.');
    const metric = state.report.metric;
    const maxValue = Math.max.apply(null, entries.map((entry) => entry.value));
    if (!maxValue) return chartEmpty('Belum ada data lokasi pada rentang ini.');

    const W = 420;
    const H = 252;
    const padL = 42;
    const padR = 8;
    const padT = 18;
    const padB = 82;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;
    const max = metric === 'nilai' ? niceMax(maxValue) : Math.max(2, Math.ceil(maxValue / 3) * 3);
    const slot = plotW / entries.length;
    const barW = Math.min(48, slot * 0.56);

    let svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Aset per lokasi">';

    for (let i = 0; i <= 3; i += 1) {
      const y = Math.round(padT + plotH - (plotH * i / 3));
      const tick = max * i / 3;
      svg += '<line class="chart-grid" x1="' + padL + '" y1="' + y + '" x2="' + (W - padR) + '" y2="' + y + '"/>';
      svg += '<text class="chart-axis" x="' + (padL - 7) + '" y="' + (y + 3) + '" text-anchor="end">' + compactNumber(tick) + '</text>';
    }

    entries.forEach((entry, index) => {
      const height = entry.value ? Math.max(3, Math.round(plotH * entry.value / max)) : 0;
      const x = padL + slot * index + (slot - barW) / 2;
      const y = padT + plotH - height;
      const tooltip = entry.label + ' · ' + (metric === 'nilai' ? rupiah.format(entry.value) : angka.format(entry.value) + ' unit');

      svg += '<rect class="chart-bar" x="' + Math.round(x) + '" y="' + y + '" width="' + Math.round(barW) + '" height="' + height + '" rx="4">' +
        '<title>' + esc(tooltip) + '</title></rect>';

      const short = entry.label.length > 16 ? entry.label.slice(0, 15) + '…' : entry.label;
      const lx = Math.round(padL + slot * index + slot / 2);
      const ly = H - padB + 15;
      svg += '<text class="chart-axis bar-label" x="' + lx + '" y="' + ly + '" text-anchor="end" transform="rotate(-32 ' + lx + ' ' + ly + ')">' +
        esc(short) + '</text>';
    });

    svg += '</svg>';
    return svg;
  }

  function renderPieChart(entries) {
    const data = entries.filter((entry) => entry.value > 0);
    if (!data.length) return chartEmpty('Belum ada data kondisi pada rentang ini.');

    const total = data.reduce((sum, entry) => sum + entry.value, 0);
    const size = 220;
    const center = size / 2;
    const radius = 92;
    const rad = (deg) => (deg - 90) * Math.PI / 180;
    let angle = 0;

    const slices = data.map((entry) => {
      const sweep = entry.value / total * 360;
      const start = angle;
      const end = angle + sweep;
      angle = end;
      const color = entry.color || WARNA_KONDISI[entry.label] || WARNA_GRAFIK[0];
      const tooltip = entry.label + ' · ' + angka.format(entry.value);

      if (sweep >= 359.99) {
        return '<circle cx="' + center + '" cy="' + center + '" r="' + radius + '" fill="' + color + '">' +
          '<title>' + esc(tooltip) + '</title></circle>';
      }

      const x1 = center + radius * Math.cos(rad(start));
      const y1 = center + radius * Math.sin(rad(start));
      const x2 = center + radius * Math.cos(rad(end));
      const y2 = center + radius * Math.sin(rad(end));
      const large = sweep > 180 ? 1 : 0;

      return '<path d="M' + center + ' ' + center + ' L' + x1.toFixed(2) + ' ' + y1.toFixed(2) +
        ' A' + radius + ' ' + radius + ' 0 ' + large + ' 1 ' + x2.toFixed(2) + ' ' + y2.toFixed(2) + ' Z" fill="' + color + '">' +
        '<title>' + esc(tooltip) + '</title></path>';
    }).join('');

    const svg = '<svg viewBox="0 0 ' + size + ' ' + size + '" role="img" aria-label="Aset per kondisi">' + slices + '</svg>';
    const legend = data.map((entry) => {
      const percent = Math.round(entry.value / total * 100);
      const color = entry.color || WARNA_KONDISI[entry.label] || WARNA_GRAFIK[0];
      return '<li><span class="donut-dot" style="background:' + color + '"></span>' +
        '<span>' + esc(entry.label) + '</span><b>' + angka.format(entry.value) + ' · ' + percent + '%</b></li>';
    }).join('');

    return '<div class="pie-wrap">' + svg + '<ul class="pie-legend">' + legend + '</ul></div>';
  }

  function formatTanggalPendek(iso) {
    const d = parseIsoDate(iso);
    return d ? d.getDate() + ' ' + bulanPendek.format(d) + ' ' + d.getFullYear() : 'Tanpa tanggal';
  }

  function renderAsetTerbaru(items) {
    if (!items.length) return chartEmpty('Belum ada aset.');

    const latest = items.slice()
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5);

    const rows = latest.map((a) => {
      const initial = String(a.nama || '?').trim().charAt(0).toUpperCase() || '?';
      return '<li class="latest-item">' +
        '<span class="latest-icon" aria-hidden="true">' + esc(initial) + '</span>' +
        '<span class="latest-body">' +
          '<span class="latest-name" title="' + esc(a.nama || '') + '">' + esc(a.nama || 'Tanpa nama') + '</span>' +
          '<span class="latest-meta">' + esc((a.kategori || 'Lainnya') + ' · ' + formatTanggalPendek(a.tanggal)) + '</span>' +
        '</span>' +
        '<span class="latest-value">' + rupiah.format(nilaiAset(a)) + '</span>' +
      '</li>';
    }).join('');

    return '<ul class="latest-list">' + rows + '</ul>';
  }

  function renderRingkasanKondisi(items) {
    const rows = KONDISI.map((key) => {
      const list = items.filter((a) => (a.kondisi || 'Baik') === key);
      return {
        key,
        jenis: list.length,
        unit: list.reduce((sum, a) => sum + (Number(a.jumlah) || 0), 0),
        nilai: list.reduce((sum, a) => sum + nilaiAset(a), 0)
      };
    });

    const body = rows.map((row) => (
      '<tr>' +
        '<td><span class="status-dot" style="background:' + (WARNA_KONDISI[row.key] || WARNA_GRAFIK[0]) + '"></span>' + esc(row.key) + '</td>' +
        '<td class="num">' + angka.format(row.jenis) + '</td>' +
        '<td class="num">' + angka.format(row.unit) + '</td>' +
        '<td class="num">' + compactRupiah(row.nilai) + '</td>' +
      '</tr>'
    )).join('');

    return '<table class="status-table">' +
      '<thead><tr><th scope="col">Kondisi</th><th scope="col" class="num">Aset</th><th scope="col" class="num">Unit</th><th scope="col" class="num">Nilai</th></tr></thead>' +
      '<tbody>' + body + '</tbody>' +
      '</table>';
  }

  function syncSegment(selector, active) {
    const el = $(selector);
    if (!el) return;
    el.classList.toggle('is-active', active);
    el.setAttribute('aria-pressed', active ? 'true' : 'false');
  }

  function renderDashboard() {
    const report = state.report;
    const mode = report.mode;
    const metric = report.metric;
    const weekly = mode === 'mingguan';
    const data = collectReport(state.items, report.source, mode, report.offset);
    const focus = data.focus;

    $('#reportSource').value = report.source;
    syncSegment('#reportModeWeekly', weekly);
    syncSegment('#reportModeMonthly', !weekly);
    syncSegment('#reportMetricUnit', metric === 'unit');
    syncSegment('#reportMetricValue', metric === 'nilai');

    const focusLabel = weekly ? formatWeekRange(focus.start) : formatMonthLabel(focus.start);
    const windowLabel = (weekly ? REPORT_WEEKS + ' minggu' : REPORT_MONTHS + ' bulan') + ' hingga ' + focusLabel;

    $('#reportHint').textContent = weekly
      ? 'Ringkasan aset per minggu, mulai Senin sampai Minggu.'
      : 'Ringkasan aset per bulan dalam kalender.';
    $('#reportRange').textContent = weekly
      ? 'Mgg ' + isoWeekNumber(focus.start) + ' · ' + focusLabel
      : focusLabel;
    $('#reportWindow').textContent = windowLabel;
    $('#reportNext').disabled = report.offset === 0;
    $('#reportToday').disabled = report.offset === 0;

    const tanpa = data.tanpaTanggal;
    const note = $('#reportNoDate');
    if (tanpa.jenis > 0) {
      const sumber = report.source === 'createdAt' ? 'tanggal input' : 'tanggal perolehan';
      note.hidden = false;
      note.textContent = angka.format(tanpa.jenis) + ' aset tanpa ' + sumber +
        ' tidak masuk grafik tren (' + angka.format(tanpa.unit) + ' unit, ' + compactRupiah(tanpa.nilai) + ').';
    } else {
      note.hidden = true;
      note.textContent = '';
    }

    const items = state.items;
    const totalUnit = items.reduce((sum, a) => sum + (Number(a.jumlah) || 0), 0);
    const totalNilai = items.reduce((sum, a) => sum + nilaiAset(a), 0);
    const hitungKondisi = (key) => items.filter((a) => (a.kondisi || 'Baik') === key).length;
    const kpi = [
      { label: 'Total Aset', value: angka.format(items.length) },
      { label: 'Total Unit', value: angka.format(totalUnit) },
      { label: 'Aktif', value: angka.format(hitungKondisi('Baik')), tone: 'is-green' },
      { label: 'Maintenance', value: angka.format(hitungKondisi('Rusak Ringan')), tone: 'is-amber' },
      { label: 'Rusak', value: angka.format(hitungKondisi('Rusak Berat')), tone: 'is-red' },
      { label: 'Total Nilai', value: rupiah.format(totalNilai) }
    ];

    $('#dashKpis').innerHTML = kpi.map((item) => (
      '<div class="kpi">' +
        '<p class="kpi-label">' + esc(item.label) + '</p>' +
        '<strong class="kpi-value' + (item.tone ? ' ' + item.tone : '') + '" title="' + esc(item.label + ': ' + item.value) + '">' + esc(item.value) + '</strong>' +
      '</div>'
    )).join('');

    $('#dashToday').textContent = new Intl.DateTimeFormat('id-ID', {
      weekday: 'long', day: '2-digit', month: 'short', year: 'numeric'
    }).format(new Date());

    $('#trendModeLabel').textContent = weekly ? 'minggu' : 'bulan';
    $('#trendSub').textContent = (weekly ? REPORT_WEEKS + ' minggu' : REPORT_MONTHS + ' bulan') + ' terakhir';
    $('#kategoriSub').textContent = 'Berdasarkan ' + reportMetricLabel() + ' · ' + (weekly ? REPORT_WEEKS + ' minggu' : REPORT_MONTHS + ' bulan') + ' terakhir';
    $('#lokasiSub').textContent = 'Berdasarkan ' + reportMetricLabel() + ' · ' + (weekly ? REPORT_WEEKS + ' minggu' : REPORT_MONTHS + ' bulan') + ' terakhir';
    $('#rekapSub').textContent = windowLabel;

    $('#trendChart').innerHTML = renderTrendChart(data.periods, mode);
    $('#kategoriChart').innerHTML = renderDonutChart(data.kategori);
    $('#lokasiChart').innerHTML = renderBarChart(
      data.lokasi.map((entry) => ({ label: entry.label, value: metricValue(entry) }))
    );
    $('#kondisiChart').innerHTML = renderPieChart(KONDISI.map((key) => ({
      label: key,
      value: data.kondisi[key] || 0,
      color: WARNA_KONDISI[key]
    })));

    const nilaiKategori = data.kategori.slice()
      .sort((a, b) => b.nilai - a.nilai)
      .slice(0, 5)
      .map((entry) => ({ label: entry.label, value: entry.nilai }));
    $('#nilaiKategoriChart').innerHTML = renderHBar(nilaiKategori, 'nilai');
    $('#asetTerbaru').innerHTML = renderAsetTerbaru(items);
    $('#ringkasanKondisi').innerHTML = renderRingkasanKondisi(items);

    const rows = data.periods.slice().reverse();
    const total = rows.reduce((acc, period) => {
      acc.jenis += period.jenis;
      acc.unit += period.unit;
      acc.nilai += period.nilai;
      return acc;
    }, { jenis: 0, unit: 0, nilai: 0 });

    $('#reportRows').innerHTML = rows.map((period) => {
      const label = weekly
        ? 'Mgg ' + isoWeekNumber(period.start) + ' · ' + period.start.getFullYear()
        : formatMonthLabel(period.start);
      const range = weekly ? formatWeekRange(period.start) : formatMonthRange(period.start, period.end);
      const isFocus = period.key === focus.key;
      return '<tr' + (isFocus ? ' class="is-focus"' : '') + '>' +
        '<td>' + esc(label) + '</td>' +
        '<td class="hide-sm">' + esc(range) + '</td>' +
        '<td class="num">' + angka.format(period.jenis) + '</td>' +
        '<td class="num">' + angka.format(period.unit) + '</td>' +
        '<td class="num">' + rupiah.format(period.nilai) + '</td>' +
      '</tr>';
    }).join('') +
      '<tr class="report-total">' +
        '<td>Total</td>' +
        '<td class="hide-sm">' + esc(windowLabel) + '</td>' +
        '<td class="num">' + angka.format(total.jenis) + '</td>' +
        '<td class="num">' + angka.format(total.unit) + '</td>' +
        '<td class="num">' + rupiah.format(total.nilai) + '</td>' +
      '</tr>';
  }

  function renderKategoriOptions() {
    const set = new Set(KATEGORI_UMUM);
    state.items.forEach((a) => { if (a.kategori) set.add(a.kategori); });

    const kategoriList = Array.from(set).sort((a, b) => a.localeCompare(b, 'id', { sensitivity: 'base' }));

    const filter = $('#filterKategori');
    if (filter) {
      filter.innerHTML = '<option value="all">Semua kategori</option>' + kategoriList
        .map((c) => '<option value="' + esc(c) + '">' + esc(c) + '</option>')
        .join('');
      if (kategoriList.indexOf(state.kategori) === -1) state.kategori = 'all';
      filter.value = state.kategori;
    }

    const datalist = $('#kategoriList');
    if (datalist) {
      datalist.innerHTML = kategoriList.map((c) => '<option value="' + esc(c) + '"></option>').join('');
    }

    const satuanList = $('#satuanList');
    if (satuanList) {
      satuanList.innerHTML = SATUAN_UMUM.map((s) => '<option value="' + esc(s) + '"></option>').join('');
    }
  }

  const SORTERS = {
    'baru': (x, y) => new Date(y.createdAt) - new Date(x.createdAt),
    'lama': (x, y) => new Date(x.createdAt) - new Date(y.createdAt),
    'nama': (x, y) => x.nama.localeCompare(y.nama, 'id', { sensitivity: 'base' }),
    'nama-desc': (x, y) => y.nama.localeCompare(x.nama, 'id', { sensitivity: 'base' }),
    'nilai': (x, y) => nilaiAset(y) - nilaiAset(x),
    'tanggal': (x, y) => String(y.tanggal || '').localeCompare(String(x.tanggal || ''))
  };

  function sortItems(list, mode) {
    const arr = list.slice();
    arr.sort(SORTERS[mode] || SORTERS['baru']);
    return arr;
  }

  /* ---------------- Filter per kolom (gaya Excel) ---------------- */
  const KOLOM_FILTER = [
    { key: 'kode', label: 'Kode', tipe: 'teks', nilai: (a) => a.kode || '—' },
    { key: 'nama', label: 'Nama Aset', tipe: 'teks', nilai: (a) => a.nama || '' },
    { key: 'kategori', label: 'Kategori', tipe: 'teks', nilai: (a) => a.kategori || 'Lainnya' },
    { key: 'jumlah', label: 'Jumlah', tipe: 'angka', nilai: (a) => String(Number(a.jumlah) || 0) },
    { key: 'kondisi', label: 'Kondisi', tipe: 'teks', nilai: (a) => a.kondisi || 'Baik' },
    { key: 'nilai', label: 'Nilai Total', tipe: 'angka', nilai: (a) => String(nilaiAset(a)) }
  ];

  const kolomFilter = (key) => KOLOM_FILTER.find((kolom) => kolom.key === key);

  function labelNilaiKolom(key, raw) {
    if (key === 'nilai') return rupiah.format(Number(raw) || 0);
    if (key === 'jumlah') return angka.format(Number(raw) || 0);
    return raw;
  }

  function adaFilterKolom() {
    return KOLOM_FILTER.some((kolom) => {
      const aktif = state.columnFilters[kolom.key];
      return Array.isArray(aktif) && aktif.length > 0;
    });
  }

  function cocokFilterKolom(a, lewati) {
    return KOLOM_FILTER.every((kolom) => {
      if (kolom.key === lewati) return true;
      const aktif = state.columnFilters[kolom.key];
      if (!aktif || !aktif.length) return true;
      return aktif.indexOf(kolom.nilai(a)) !== -1;
    });
  }

  function cocokDasar(a, lewati) {
    const q = state.query.trim().toLowerCase();
    if (state.kategori !== 'all' && a.kategori !== state.kategori) return false;
    if (state.kondisi !== 'all' && a.kondisi !== state.kondisi) return false;
    if (q) {
      const haystack = [a.kode, a.nama, a.kategori, a.lokasi, a.keterangan, a.satuan, a.kondisi]
        .join(' ')
        .toLowerCase();
      if (haystack.indexOf(q) === -1) return false;
    }
    return cocokFilterKolom(a, lewati);
  }

  function opsiKolom(kolom) {
    const map = new Map();
    state.items.forEach((a) => {
      if (!cocokDasar(a, kolom.key)) return;
      const raw = kolom.nilai(a);
      map.set(raw, (map.get(raw) || 0) + 1);
    });

    return Array.from(map.entries())
      .map(([raw, jumlah]) => ({ raw, label: labelNilaiKolom(kolom.key, raw), jumlah }))
      .sort((x, y) => (kolom.tipe === 'angka'
        ? Number(x.raw) - Number(y.raw)
        : x.label.localeCompare(y.label, 'id', { sensitivity: 'base', numeric: true })));
  }

  let filterPop = null;
  let filterPopKey = null;
  let filterPopAnchor = null;

  function sinkronTombolFilter() {
    document.querySelectorAll('.col-filter-btn').forEach((btn) => {
      const key = btn.getAttribute('data-col');
      const kolom = kolomFilter(key);
      const aktif = !!(state.columnFilters[key] && state.columnFilters[key].length);
      const base = 'Filter kolom ' + (kolom ? kolom.label : key);
      btn.classList.toggle('is-active', aktif);
      btn.title = aktif ? base + ' (aktif)' : base;
      btn.setAttribute('aria-label', btn.title);
    });
  }

  function tutupFilterKolom(kembalikanFokus) {
    if (!filterPop) return;
    const anchor = filterPopAnchor;
    filterPop.remove();
    filterPop = null;
    filterPopKey = null;
    filterPopAnchor = null;
    if (anchor) {
      anchor.setAttribute('aria-expanded', 'false');
      if (kembalikanFokus) anchor.focus();
    }
  }

  function posisikanFilterKolom(pop, anchor) {
    const rect = anchor.getBoundingClientRect();
    const margin = 8;
    const width = pop.offsetWidth;
    const height = pop.offsetHeight;
    let left = Math.min(rect.right - width, window.innerWidth - width - margin);
    left = Math.max(margin, left);
    let top = rect.bottom + 6;
    if (top + height > window.innerHeight - margin) {
      top = Math.max(margin, rect.top - height - 6);
    }
    pop.style.left = Math.round(left) + 'px';
    pop.style.top = Math.round(top) + 'px';
  }

  function bukaFilterKolom(key, anchor) {
    const kolom = kolomFilter(key);
    if (!kolom) return;

    if (filterPop && filterPopKey === key) {
      tutupFilterKolom(true);
      return;
    }
    tutupFilterKolom(false);

    const opsi = opsiKolom(kolom);
    const semua = opsi.map((item) => item.raw);
    const terpilih = state.columnFilters[key];
    const draft = new Set(terpilih ? terpilih.filter((raw) => semua.indexOf(raw) !== -1) : semua);

    const pop = document.createElement('div');
    pop.className = 'col-filter-pop';
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-label', 'Filter kolom ' + kolom.label);
    pop.innerHTML =
      '<div class="col-filter-head">' +
        '<strong>Filter ' + esc(kolom.label) + '</strong>' +
        '<button class="col-filter-clear" type="button" data-cf="clear">Hapus</button>' +
      '</div>' +
      '<input class="col-filter-search" type="search" placeholder="Cari nilai…" autocomplete="off" aria-label="Cari nilai ' + esc(kolom.label) + '" />' +
      '<div class="col-filter-tools" hidden>' +
        '<button type="button" data-cf="only">Pilih hanya hasil ini</button>' +
        '<button type="button" data-cf="all">Pilih semua</button>' +
      '</div>' +
      '<ul class="col-filter-list" role="group" aria-label="Nilai ' + esc(kolom.label) + '"></ul>' +
      '<div class="col-filter-foot">' +
        '<span class="col-filter-count" aria-live="polite"></span>' +
        '<button class="btn btn-primary" type="button" data-cf="apply">Terapkan</button>' +
      '</div>';

    document.body.appendChild(pop);
    pop.style.visibility = 'hidden';

    const list = pop.querySelector('.col-filter-list');
    const cari = pop.querySelector('.col-filter-search');
    const tools = pop.querySelector('.col-filter-tools');
    const applyBtn = pop.querySelector('[data-cf="apply"]');
    const clearBtn = pop.querySelector('[data-cf="clear"]');
    const countEl = pop.querySelector('.col-filter-count');
    let tampilSekarang = [];

    function renderStatus() {
      countEl.textContent = draft.size + ' dari ' + semua.length + ' nilai';
      applyBtn.disabled = draft.size === 0;
      clearBtn.disabled = !terpilih;
    }

    function renderList() {
      const q = cari.value.trim().toLowerCase();
      const tampil = q
        ? opsi.filter((item) => item.label.toLowerCase().indexOf(q) !== -1)
        : opsi;
      tampilSekarang = tampil;
      tools.hidden = !q;

      if (!tampil.length) {
        list.innerHTML = '<li class="col-filter-note">Tidak ada nilai yang cocok.</li>';
        renderStatus();
        return;
      }

      list.innerHTML = tampil.map((item) => (
        '<li><label class="col-filter-option">' +
          '<input type="checkbox" data-value="' + esc(item.raw) + '"' + (draft.has(item.raw) ? ' checked' : '') + ' />' +
          '<span title="' + esc(item.label) + '">' + esc(item.label) + '</span>' +
          '<b>' + angka.format(item.jumlah) + '</b>' +
        '</label></li>'
      )).join('');
      renderStatus();
    }

    function terapkan() {
      if (!draft.size) return;
      if (draft.size >= semua.length) delete state.columnFilters[key];
      else state.columnFilters[key] = Array.from(draft);
      state.page = 1;
      tutupFilterKolom(false);
      renderTable();
    }

    list.addEventListener('change', (e) => {
      const box = e.target.closest('input[data-value]');
      if (!box) return;
      if (box.checked) draft.add(box.getAttribute('data-value'));
      else draft.delete(box.getAttribute('data-value'));
      renderStatus();
    });

    cari.addEventListener('input', renderList);

    cari.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        terapkan();
      }
    });

    pop.addEventListener('click', (e) => {
      const act = e.target.closest('[data-cf]');
      if (!act) return;
      const aksi = act.getAttribute('data-cf');
      if (aksi === 'clear') {
        delete state.columnFilters[key];
        state.page = 1;
        tutupFilterKolom(false);
        renderTable();
      } else if (aksi === 'apply') {
        terapkan();
      } else if (aksi === 'only') {
        draft.clear();
        tampilSekarang.forEach((item) => draft.add(item.raw));
        renderList();
      } else if (aksi === 'all') {
        draft.clear();
        semua.forEach((raw) => draft.add(raw));
        renderList();
      }
    });

    renderList();

    filterPop = pop;
    filterPopKey = key;
    filterPopAnchor = anchor;
    anchor.setAttribute('aria-expanded', 'true');
    posisikanFilterKolom(pop, anchor);
    pop.style.visibility = '';
    cari.focus({ preventScroll: true });
  }

  function applyFilters() {
    const list = state.items.filter((a) => cocokDasar(a));
    state.view = sortItems(list, state.sort);
  }

  function badgeClass(kondisi) {
    if (kondisi === 'Rusak Berat') return 'bad';
    if (kondisi === 'Rusak Ringan') return 'warn';
    return 'good';
  }

  function rowHtml(a) {
    const nilai = rupiah.format(nilaiAset(a));
    const nama = esc(a.nama);
    return '' +
      '<tr data-id="' + esc(a.id) + '" tabindex="0" aria-label="Buka detail ' + nama + '">' +
        '<td class="cell-kode"><code>' + esc(a.kode || '—') + '</code></td>' +
        '<td>' +
          '<div class="cell-name">' + nama + '</div>' +
          '<div class="cell-sub">' + esc(a.lokasi || 'Tanpa lokasi') + (a.tanggal ? ' · ' + esc(formatTanggal(a.tanggal)) : '') + '</div>' +
        '</td>' +
        '<td class="hide-md"><span class="chip">' + esc(a.kategori) + '</span></td>' +
        '<td class="num">' + angka.format(a.jumlah) + ' <span class="unit">' + esc(a.satuan) + '</span></td>' +
        '<td><span class="badge ' + badgeClass(a.kondisi) + '">' + esc(a.kondisi) + '</span></td>' +
        '<td class="num cell-total hide-sm">' + nilai + '</td>' +
        '<td class="cell-actions">' +
          '<button class="icon-btn" type="button" data-act="view" title="Lihat detail ' + nama + '" aria-label="Lihat detail ' + nama + '">' + SVG.eye + '</button>' +
          '<button class="icon-btn" type="button" data-act="edit" title="Edit ' + nama + '" aria-label="Edit ' + nama + '">' + SVG.pencil + '</button>' +
          '<button class="icon-btn danger" type="button" data-act="delete" title="Hapus ' + nama + '" aria-label="Hapus ' + nama + '">' + SVG.trash + '</button>' +
        '</td>' +
      '</tr>';
  }

  function renderEmpty(hasFilter) {
    const el = $('#emptyState');
    if (!el) return;

    if (hasFilter) {
      el.innerHTML =
        '<div class="empty-icon" aria-hidden="true">' + SVG.search + '</div>' +
        '<h3>Tidak ada aset yang cocok</h3>' +
        '<p>Coba ubah kata kunci pencarian atau atur ulang filter untuk melihat data lainnya.</p>' +
        '<button class="btn btn-ghost" type="button" data-empty-action="reset">Atur ulang filter</button>';
    } else {
      el.innerHTML =
        '<div class="empty-icon" aria-hidden="true">' + SVG.box + '</div>' +
        '<h3>Belum ada data aset</h3>' +
        '<p>Mulai catat aset Anda dengan menekan tombol di bawah. Data akan tersimpan otomatis di browser ini.</p>' +
        '<div class="empty-actions">' +
          '<button class="btn btn-primary" type="button" data-empty-action="add">+ Tambah Aset</button>' +
          '<button class="btn btn-ghost" type="button" data-empty-action="seed">Muat contoh data</button>' +
        '</div>';
    }
  }

  function updateResetVisibility() {
    const active = state.query.trim() !== '' || state.kategori !== 'all' || state.kondisi !== 'all'
      || adaFilterKolom() || state.sort !== 'baru';
    const btn = $('#btnResetFilter');
    if (btn) btn.hidden = !active;
  }

  function renderTable() {
    tutupFilterKolom(false);
    applyFilters();

    const total = state.view.length;
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    if (state.page > pages) state.page = pages;
    if (state.page < 1) state.page = 1;

    const start = (state.page - 1) * PAGE_SIZE;
    const rows = state.view.slice(start, start + PAGE_SIZE);

    const tbody = $('#assetRows');
    const empty = $('#emptyState');
    const tableWrap = $('#tableWrap');
    const footer = $('#tableFooter');

    const hasFilter = state.query.trim() !== '' || state.kategori !== 'all' || state.kondisi !== 'all' || adaFilterKolom();

    if (!total) {
      if (tbody) tbody.innerHTML = '';
      if (tableWrap) tableWrap.hidden = true;
      if (footer) footer.hidden = true;
      if (empty) empty.hidden = false;
      renderEmpty(hasFilter);
    } else {
      if (tbody) tbody.innerHTML = rows.map(rowHtml).join('');
      if (tableWrap) tableWrap.hidden = false;
      if (empty) empty.hidden = true;
      if (footer) footer.hidden = false;

      const from = start + 1;
      const to = Math.min(start + PAGE_SIZE, total);
      const rangeInfo = $('#rangeInfo');
      const pageInfo = $('#pageInfo');
      if (rangeInfo) rangeInfo.textContent = 'Menampilkan ' + angka.format(from) + '–' + angka.format(to) + ' dari ' + angka.format(total) + ' aset';
      if (pageInfo) pageInfo.textContent = 'Halaman ' + state.page + ' / ' + pages;
      const prev = $('#pagePrev');
      const next = $('#pageNext');
      if (prev) prev.disabled = state.page === 1;
      if (next) next.disabled = state.page === pages;
    }

    updateResetVisibility();
    sinkronTombolFilter();
  }

  function renderAll() {
    renderDashboard();
    renderTable();
  }

  /* ---------------- Modal ---------------- */
  const focusStack = [];

  function openModal(modal) {
    if (!modal || !modal.hidden) return;
    focusStack.push(document.activeElement);
    modal.hidden = false;
    document.body.classList.add('modal-open');

    const target = modal.querySelector('[data-autofocus]') ||
      modal.querySelector('input:not([type="hidden"])') ||
      modal.querySelector('select') ||
      modal.querySelector('textarea') ||
      modal.querySelector('.btn-primary') ||
      modal.querySelector('button');
    if (target) setTimeout(() => { try { target.focus(); } catch (err) { /* abaikan */ } }, 40);
  }

  function closeModal(modal) {
    if (!modal || modal.hidden) return;
    modal.hidden = true;

    if (modal.id === 'confirmModal') state.pendingConfirm = null;
    if (modal.id === 'formModal') {
      state.editId = null;
      state.formSnapshot = '';
    }

    const prev = focusStack.pop();
    if (!document.querySelector('.modal:not([hidden])')) {
      document.body.classList.remove('modal-open');
    }
    if (prev && typeof prev.focus === 'function' && document.body.contains(prev)) {
      prev.focus();
    }
  }

  function closeAllModals() {
    $$('.modal:not([hidden])').forEach((modal) => closeModal(modal));
  }

  function askConfirm(options) {
    const opts = options || {};
    $('#confirmTitle').textContent = opts.title || 'Konfirmasi';
    $('#confirmMessage').textContent = opts.message || '';
    const ok = $('#confirmOk');
    ok.textContent = opts.confirmLabel || 'Hapus';
    ok.classList.toggle('btn-danger', opts.danger !== false);
    ok.classList.toggle('btn-primary', opts.danger === false);
    state.pendingConfirm = typeof opts.onConfirm === 'function' ? opts.onConfirm : null;
    openModal($('#confirmModal'));
    setTimeout(() => { try { ok.focus(); } catch (err) { /* abaikan */ } }, 60);
  }

  /* ---------------- Form ---------------- */
  function nextKode() {
    let max = 0;
    const used = new Set(state.items.map((a) => String(a.kode || '').toUpperCase()));
    state.items.forEach((a) => {
      const m = /^AST-(\d+)$/i.exec(a.kode || '');
      if (m) max = Math.max(max, Number(m[1]));
    });
    let n = max + 1;
    let code = 'AST-' + String(n).padStart(3, '0');
    while (used.has(code.toUpperCase())) {
      n += 1;
      code = 'AST-' + String(n).padStart(3, '0');
    }
    return code;
  }

  function clearFormErrors(scope) {
    const root = $(scope || '#assetForm');
    if (!root) return;
    $$('.field.invalid', root).forEach((field) => field.classList.remove('invalid'));
    $$('.field-error', root).forEach((el) => { el.textContent = ''; });
    $$('[aria-invalid="true"]', root).forEach((el) => el.removeAttribute('aria-invalid'));
  }

  function setFormError(scope, name, message) {
    const root = $(scope || '#assetForm');
    if (!root) return;
    const span = root.querySelector('[data-error-for="' + name + '"]');
    if (!span) return;
    span.textContent = message;
    const field = span.closest('.field');
    if (field) field.classList.add('invalid');
    const input = root.querySelector('[name="' + name + '"]');
    if (input) input.setAttribute('aria-invalid', 'true');
  }

  function clearFieldError(input) {
    if (!input) return;
    const field = input.closest('.field');
    if (!field) return;
    field.classList.remove('invalid');
    const span = field.querySelector('.field-error');
    if (span) span.textContent = '';
    input.removeAttribute('aria-invalid');
  }

  function readForm() {
    const form = $('#assetForm');
    const data = new FormData(form);
    const jumlah = Number(data.get('jumlah'));
    const harga = Number(data.get('harga'));

    return {
      kode: String(data.get('kode') || '').trim(),
      nama: String(data.get('nama') || '').trim().replace(/\s+/g, ' '),
      kategori: String(data.get('kategori') || '').trim(),
      jumlah: jumlah,
      satuan: String(data.get('satuan') || '').trim() || 'Unit',
      kondisi: data.get('kondisi'),
      lokasi: String(data.get('lokasi') || '').trim(),
      tanggal: String(data.get('tanggal') || ''),
      harga: Number.isFinite(harga) ? harga : 0,
      keterangan: String(data.get('keterangan') || '').trim()
    };
  }

  function validate(data) {
    clearFormErrors('#assetForm');
    const errors = [];

    if (!data.nama || data.nama.length < 2) {
      errors.push(['nama', 'Nama aset wajib diisi (minimal 2 karakter).']);
    }
    if (!data.kategori) {
      errors.push(['kategori', 'Kategori wajib diisi.']);
    }
    if (!Number.isFinite(data.jumlah) || !Number.isInteger(data.jumlah) || data.jumlah < 1) {
      errors.push(['jumlah', 'Jumlah harus bilangan bulat minimal 1.']);
    }
    if (!Number.isFinite(data.harga) || data.harga < 0) {
      errors.push(['harga', 'Harga tidak boleh negatif.']);
    }
    if (data.tanggal) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(data.tanggal)) {
        errors.push(['tanggal', 'Format tanggal tidak valid.']);
      } else if (data.tanggal > todayIso()) {
        errors.push(['tanggal', 'Tanggal perolehan tidak boleh melebihi hari ini.']);
      }
    }
    if (data.kode) {
      const duplicate = state.items.some((a) =>
        a.id !== state.editId && String(a.kode || '').toLowerCase() === data.kode.toLowerCase()
      );
      if (duplicate) errors.push(['kode', 'Kode aset sudah digunakan oleh aset lain.']);
    }
    if (KONDISI.indexOf(data.kondisi) === -1) {
      data.kondisi = 'Baik';
    }

    if (errors.length) {
      errors.forEach(([field, message]) => setFormError('#assetForm', field, message));
      const first = $('#assetForm [name="' + errors[0][0] + '"]');
      if (first) first.focus();
      return false;
    }
    return true;
  }

  function updateTotalPreview() {
    const jumlah = Number($('#fJumlah').value) || 0;
    const harga = Number($('#fHarga').value) || 0;
    $('#totalPreview').textContent = rupiah.format(jumlah * harga);
  }

  function formSnapshotValue() {
    const form = $('#assetForm');
    if (!form) return '';
    const parts = [];
    new FormData(form).forEach((value, key) => {
      parts.push(key + '=' + String(value));
    });
    return parts.join('&');
  }

  function requestCloseForm(onClosed) {
    const modal = $('#formModal');
    if (!modal || modal.hidden) return;

    const close = () => {
      state.formSnapshot = '';
      state.editId = null;
      closeModal(modal);
      if (typeof onClosed === 'function') onClosed();
    };

    if (!state.formSnapshot || state.formSnapshot === formSnapshotValue()) {
      close();
      return;
    }

    askConfirm({
      title: 'Tutup form?',
      message: 'Perubahan yang belum disimpan akan hilang.',
      confirmLabel: 'Tutup tanpa simpan',
      danger: true,
      onConfirm: close
    });
  }

  function openForm(id) {
    const form = $('#assetForm');
    const asset = id ? state.items.find((a) => a.id === id) : null;
    if (id && !asset) {
      toast('Data aset tidak ditemukan.', 'error');
      return;
    }

    state.editId = asset ? asset.id : null;
    form.reset();
    clearFormErrors('#assetForm');
    renderKategoriOptions();
    $('#fTanggal').max = todayIso();

    if (asset) {
      $('#formTitle').textContent = 'Edit Aset';
      $('#formSub').textContent = 'Perbarui informasi aset, lalu simpan perubahan.';
      $('#btnSubmit').textContent = 'Simpan Perubahan';
      $('#fKode').value = asset.kode;
      $('#fNama').value = asset.nama;
      $('#fKategori').value = asset.kategori;
      $('#fKondisi').value = asset.kondisi;
      $('#fJumlah').value = asset.jumlah;
      $('#fSatuan').value = asset.satuan;
      $('#fLokasi').value = asset.lokasi;
      $('#fTanggal').value = asset.tanggal;
      $('#fHarga').value = asset.harga;
      $('#fKeterangan').value = asset.keterangan;
    } else {
      $('#formTitle').textContent = 'Tambah Aset';
      $('#formSub').textContent = 'Isi informasi aset yang ingin dicatat. Kolom bertanda * wajib diisi.';
      $('#btnSubmit').textContent = 'Simpan Aset';
      $('#fKondisi').value = 'Baik';
      $('#fJumlah').value = '1';
      $('#fSatuan').value = 'Unit';
      $('#fKode').value = nextKode();
    }

    updateTotalPreview();
    state.formSnapshot = formSnapshotValue();
    openModal($('#formModal'));
  }

  function deleteAsset(id) {
    const asset = state.items.find((a) => a.id === id);
    if (!asset) return;

    askConfirm({
      title: 'Hapus aset ini?',
      message: '"' + asset.nama + '" akan dihapus permanen dari daftar aset. Tindakan ini tidak dapat dibatalkan.',
      confirmLabel: 'Hapus aset',
      onConfirm: function () {
        state.items = state.items.filter((a) => a.id !== id);
        if (state.detailId === id) {
          state.detailId = null;
          closeModal($('#detailModal'));
        }
        persist();
        renderKategoriOptions();
        renderAll();
        toast('Aset berhasil dihapus.', 'success');
      }
    });
  }

  /* ---------------- Detail ---------------- */
  function detailItem(label, value, full) {
    return '<div class="detail-item' + (full ? ' full' : '') + '">' +
      '<span class="detail-label">' + esc(label) + '</span>' +
      '<span class="detail-value">' + esc(value) + '</span>' +
    '</div>';
  }

  function openDetail(id) {
    const a = state.items.find((item) => item.id === id);
    if (!a) return;

    state.detailId = a.id;
    $('#detailTitle').textContent = a.nama;
    $('#detailSub').textContent = a.kode ? 'Kode aset ' + a.kode : 'Tanpa kode aset';

    $('#detailBody').innerHTML =
      '<div class="detail-highlight">' +
        '<div>' +
          '<span class="label">Nilai total</span>' +
          '<strong>' + rupiah.format(nilaiAset(a)) + '</strong>' +
        '</div>' +
        '<div class="detail-badges">' +
          '<span class="badge ' + badgeClass(a.kondisi) + '">' + esc(a.kondisi) + '</span>' +
          '<span class="chip">' + esc(a.kategori) + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="detail-grid">' +
        detailItem('Kode aset', a.kode || '—') +
        detailItem('Kategori', a.kategori) +
        detailItem('Jumlah', angka.format(a.jumlah) + ' ' + a.satuan) +
        detailItem('Kondisi', a.kondisi) +
        detailItem('Lokasi', a.lokasi || '—') +
        detailItem('Tanggal perolehan', formatTanggal(a.tanggal)) +
        detailItem('Harga satuan', rupiah.format(a.harga)) +
        detailItem('Nilai total', rupiah.format(nilaiAset(a))) +
        detailItem('Keterangan', a.keterangan || '—', true) +
        detailItem('Terakhir diperbarui', formatWaktu(a.updatedAt), true) +
      '</div>';

    openModal($('#detailModal'));
  }

  /* ---------------- Ekspor / Impor ---------------- */
  function download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function exportCsv() {
    if (!state.items.length) {
      toast('Belum ada data untuk diekspor.', 'error');
      return;
    }

    const header = ['Kode', 'Nama Aset', 'Kategori', 'Jumlah', 'Satuan', 'Kondisi', 'Lokasi', 'Tanggal Perolehan', 'Harga Satuan', 'Nilai Total', 'Keterangan'];
    const rows = state.items.map((a) => [
      a.kode,
      a.nama,
      a.kategori,
      a.jumlah,
      a.satuan,
      a.kondisi,
      a.lokasi,
      a.tanggal,
      a.harga,
      nilaiAset(a),
      a.keterangan
    ]);

    const csv = [header].concat(rows)
      .map((row) => row.map((cell) => '"' + String(cell == null ? '' : cell).replace(/"/g, '""') + '"').join(','))
      .join('\r\n');

    download(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }), 'data-aset-' + todayIso() + '.csv');
    toast('Data berhasil diekspor ke CSV.', 'success');
  }

  /* ---------------- Ekspor Excel (.xlsx) ---------------- */
  const STYLE = {
    default: 0,
    header: 1,
    text: 2,
    integer: 3,
    currency: 4,
    date: 5,
    label: 6,
    totalLabel: 7,
    totalInteger: 8,
    totalCurrency: 9,
    muted: 10,
    title: 11,
    percent: 12,
    subheader: 13,
    totalPercent: 14
  };

  const CRC_TABLE = (function () {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i += 1) {
      let c = i;
      for (let k = 0; k < 8; k += 1) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[i] = c >>> 0;
    }
    return table;
  })();

  function crc32(bytes) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i += 1) {
      crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ bytes[i]) & 0xFF];
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  function ByteWriter(initial) {
    this.buf = new Uint8Array(Math.max(initial || 256, 256));
    this.len = 0;
  }

  ByteWriter.prototype.reserve = function (extra) {
    if (this.len + extra <= this.buf.length) return;
    let cap = this.buf.length;
    while (cap < this.len + extra) cap *= 2;
    const next = new Uint8Array(cap);
    next.set(this.buf.subarray(0, this.len));
    this.buf = next;
  };

  ByteWriter.prototype.u16 = function (value) {
    this.reserve(2);
    this.buf[this.len++] = value & 0xFF;
    this.buf[this.len++] = (value >>> 8) & 0xFF;
  };

  ByteWriter.prototype.u32 = function (value) {
    this.reserve(4);
    this.buf[this.len++] = value & 0xFF;
    this.buf[this.len++] = (value >>> 8) & 0xFF;
    this.buf[this.len++] = (value >>> 16) & 0xFF;
    this.buf[this.len++] = (value >>> 24) & 0xFF;
  };

  ByteWriter.prototype.bytes = function (arr) {
    const data = arr instanceof Uint8Array ? arr : new Uint8Array(arr);
    this.reserve(data.length);
    this.buf.set(data, this.len);
    this.len += data.length;
  };

  ByteWriter.prototype.result = function () {
    return this.buf.slice(0, this.len);
  };

  /* ZIP tanpa kompresi (method 0) — cukup untuk file .xlsx kecil. */
  function zipStore(files) {
    const now = new Date();
    const dosTime = ((now.getHours() & 31) << 11) | ((now.getMinutes() & 63) << 5) | (Math.floor(now.getSeconds() / 2) & 31);
    const dosDate = (((now.getFullYear() - 1980) & 127) << 9) | (((now.getMonth() + 1) & 15) << 5) | (now.getDate() & 31);

    const entries = files.map((file) => {
      const nameBytes = encoder.encode(file.name);
      const data = file.data instanceof Uint8Array ? file.data : encoder.encode(String(file.data));
      return { nameBytes: nameBytes, data: data, crc: crc32(data), offset: 0 };
    });

    const localSize = entries.reduce((sum, e) => sum + 30 + e.nameBytes.length + e.data.length, 0);
    const centralSize = entries.reduce((sum, e) => sum + 46 + e.nameBytes.length, 0);
    const writer = new ByteWriter(localSize + centralSize + 22);

    entries.forEach((e) => {
      e.offset = writer.len;
      writer.u32(0x04034B50);
      writer.u16(20);
      writer.u16(0x0800);
      writer.u16(0);
      writer.u16(dosTime);
      writer.u16(dosDate);
      writer.u32(e.crc);
      writer.u32(e.data.length);
      writer.u32(e.data.length);
      writer.u16(e.nameBytes.length);
      writer.u16(0);
      writer.bytes(e.nameBytes);
      writer.bytes(e.data);
    });

    const centralStart = writer.len;
    entries.forEach((e) => {
      writer.u32(0x02014B50);
      writer.u16(20);
      writer.u16(20);
      writer.u16(0x0800);
      writer.u16(0);
      writer.u16(dosTime);
      writer.u16(dosDate);
      writer.u32(e.crc);
      writer.u32(e.data.length);
      writer.u32(e.data.length);
      writer.u16(e.nameBytes.length);
      writer.u16(0);
      writer.u16(0);
      writer.u16(0);
      writer.u16(0);
      writer.u32(0);
      writer.u32(e.offset);
      writer.bytes(e.nameBytes);
    });
    const centralWritten = writer.len - centralStart;

    writer.u32(0x06054B50);
    writer.u16(0);
    writer.u16(0);
    writer.u16(entries.length);
    writer.u16(entries.length);
    writer.u32(centralWritten);
    writer.u32(centralStart);
    writer.u16(0);

    return writer.result();
  }

  function xmlEscape(value) {
    return String(value == null ? '' : value)
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function colName(index) {
    let name = '';
    let n = index;
    while (n > 0) {
      const rem = (n - 1) % 26;
      name = String.fromCharCode(65 + rem) + name;
      n = Math.floor((n - 1) / 26);
    }
    return name;
  }

  function excelDateSerial(iso) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    const stamp = Date.UTC(year, month - 1, day);
    const serial = Math.round((stamp - Date.UTC(1899, 11, 30)) / 86400000);
    return serial > 0 ? serial : null;
  }

  function xlsxCell(ref, value, style) {
    const s = style || 0;
    const attr = ' r="' + ref + '"' + (s ? ' s="' + s + '"' : '');

    if (value === null || value === undefined || value === '') {
      return s ? '<c' + attr + '/>' : '';
    }

    if (typeof value === 'number' && isFinite(value)) {
      return '<c' + attr + '><v>' + value + '</v></c>';
    }

    if (typeof value === 'object' && 'date' in value) {
      const serial = excelDateSerial(value.date);
      if (serial !== null) return '<c' + attr + '><v>' + serial + '</v></c>';
      return xlsxCell(ref, value.date, style);
    }

    return '<c' + attr + ' t="inlineStr"><is><t xml:space="preserve">' + xmlEscape(value) + '</t></is></c>';
  }

  function xlsxRow(index, cells, height) {
    return '<row r="' + index + '"' + (height ? ' ht="' + height + '" customHeight="1"' : '') + '>' + cells.join('') + '</row>';
  }

  function colsXml(widths) {
    return '<cols>' + widths.map((w, i) => (
      '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>'
    )).join('') + '</cols>';
  }

  function sheetXml(inner, options) {
    const opts = options || {};
    const merges = (opts.merges && opts.merges.length)
      ? '<mergeCells count="' + opts.merges.length + '">' + opts.merges.map((ref) => '<mergeCell ref="' + ref + '"/>').join('') + '</mergeCells>'
      : '';
    const filter = opts.autoFilter ? '<autoFilter ref="' + opts.autoFilter + '"/>' : '';
    const tableParts = (opts.tableParts && opts.tableParts.length)
      ? '<tableParts count="' + opts.tableParts.length + '">' + opts.tableParts.map((rid) => '<tablePart r:id="' + rid + '"/>').join('') + '</tableParts>'
      : '';
    let view = '';
    if (opts.freeze) {
      view = '<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>' +
        '<selection pane="bottomLeft" activeCell="A2" sqref="A2"/>';
    } else {
      view = '<selection activeCell="A1" sqref="A1"/>';
    }

    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      '<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>' +
      '<dimension ref="' + opts.dimension + '"/>' +
      '<sheetViews><sheetView' + (opts.tab ? ' tabSelected="1"' : '') +
        ' showGridLines="' + (opts.grid ? '1' : '0') + '" workbookViewId="0">' + view + '</sheetView></sheetViews>' +
      '<sheetFormatPr defaultRowHeight="15" baseColWidth="10"/>' +
      (opts.cols || '') +
      '<sheetData>' + inner + '</sheetData>' +
      filter +
      merges +
      '<pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/>' +
      '<pageSetup paperSize="9" orientation="landscape" fitToWidth="1" fitToHeight="0"/>' +
      tableParts +
      '</worksheet>';
  }

  /* Tabel Excel (ListObject): memberi tombol filter native di setiap kolom */
  function tableXml(table) {
    const cols = table.columns.map((name, i) => (
      '<tableColumn id="' + (i + 1) + '" name="' + xmlEscape(name) + '"/>'
    )).join('');
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<table xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"' +
        ' id="' + table.id + '" name="' + table.name + '" displayName="' + table.name + '"' +
        ' ref="' + table.ref + '" totalsRowShown="0">' +
      '<autoFilter ref="' + table.ref + '"/>' +
      '<tableColumns count="' + table.columns.length + '">' + cols + '</tableColumns>' +
      '<tableStyleInfo name="TableStyleMedium2" showFirstColumn="0" showLastColumn="0"' +
        ' showRowStripes="0" showColumnStripes="0"/>' +
      '</table>';
  }

  function buildDataSheet(items) {
    const headers = ['Kode', 'Nama Aset', 'Kategori', 'Jumlah', 'Satuan', 'Kondisi', 'Lokasi', 'Tanggal Perolehan', 'Harga Satuan', 'Nilai Total', 'Keterangan'];
    const widths = [15, 40, 18, 10, 10, 15, 26, 18, 18, 18, 44];
    const lastCol = colName(headers.length);
    const rows = [];

    rows.push(xlsxRow(1, headers.map((h, i) => xlsxCell(colName(i + 1) + '1', h, STYLE.header)), 30));

    let totalUnit = 0;
    let totalNilai = 0;

    items.forEach((a, index) => {
      const r = index + 2;
      const jumlah = Number(a.jumlah) || 0;
      const harga = Number(a.harga) || 0;
      const nilai = jumlah * harga;
      totalUnit += jumlah;
      totalNilai += nilai;

      rows.push(xlsxRow(r, [
        xlsxCell('A' + r, a.kode || '—', STYLE.text),
        xlsxCell('B' + r, a.nama, STYLE.text),
        xlsxCell('C' + r, a.kategori, STYLE.text),
        xlsxCell('D' + r, jumlah, STYLE.integer),
        xlsxCell('E' + r, a.satuan, STYLE.text),
        xlsxCell('F' + r, a.kondisi, STYLE.text),
        xlsxCell('G' + r, a.lokasi || '—', STYLE.text),
        xlsxCell('H' + r, { date: a.tanggal }, STYLE.date),
        xlsxCell('I' + r, harga, STYLE.currency),
        xlsxCell('J' + r, nilai, STYLE.currency),
        xlsxCell('K' + r, a.keterangan, STYLE.text)
      ]));
    });

    const lastDataRow = items.length + 1;
    const totalRow = lastDataRow + 1;
    const table = {
      id: 1,
      name: 'DataAset',
      ref: 'A1:' + lastCol + lastDataRow,
      columns: headers
    };

    rows.push(xlsxRow(totalRow, [
      xlsxCell('A' + totalRow, 'TOTAL', STYLE.totalLabel),
      xlsxCell('B' + totalRow, '', STYLE.totalLabel),
      xlsxCell('C' + totalRow, '', STYLE.totalLabel),
      xlsxCell('D' + totalRow, totalUnit, STYLE.totalInteger),
      xlsxCell('E' + totalRow, '', STYLE.totalLabel),
      xlsxCell('F' + totalRow, '', STYLE.totalLabel),
      xlsxCell('G' + totalRow, '', STYLE.totalLabel),
      xlsxCell('H' + totalRow, '', STYLE.totalLabel),
      xlsxCell('I' + totalRow, '', STYLE.totalLabel),
      xlsxCell('J' + totalRow, totalNilai, STYLE.totalCurrency),
      xlsxCell('K' + totalRow, '', STYLE.totalLabel)
    ], 22));

    return {
      xml: sheetXml(rows.join(''), {
        tab: true,
        grid: true,
        dimension: 'A1:' + lastCol + totalRow,
        cols: colsXml(widths),
        tableParts: ['rId1'],
        freeze: true,
        merges: ['A' + totalRow + ':C' + totalRow]
      }),
      table
    };
  }

  function buildSummarySheet(items) {
    const jenis = items.length;
    const unit = items.reduce((sum, a) => sum + (Number(a.jumlah) || 0), 0);
    const nilai = items.reduce((sum, a) => sum + nilaiAset(a), 0);
    const kategori = new Set(items.map((a) => a.kategori)).size;
    const kondisi = {
      'Baik': { jenis: 0, unit: 0 },
      'Rusak Ringan': { jenis: 0, unit: 0 },
      'Rusak Berat': { jenis: 0, unit: 0 }
    };
    items.forEach((a) => {
      const key = kondisi[a.kondisi] ? a.kondisi : 'Baik';
      kondisi[key].jenis += 1;
      kondisi[key].unit += Number(a.jumlah) || 0;
    });
    const termahal = items.slice().sort((a, b) => nilaiAset(b) - nilaiAset(a))[0] || null;

    const rows = [];
    rows.push(xlsxRow(1, [xlsxCell('A1', 'Ringkasan Data Aset', STYLE.title)], 30));
    rows.push(xlsxRow(2, [xlsxCell('A2', 'AsetKu · dibuat ' + formatWaktu(new Date().toISOString()), STYLE.muted)], 18));
    rows.push(xlsxRow(4, [xlsxCell('A4', 'Statistik Umum', STYLE.header)], 24));

    const stats = [
      ['Jumlah jenis aset', jenis, STYLE.integer],
      ['Total unit aset', unit, STYLE.integer],
      ['Total nilai aset', nilai, STYLE.currency],
      ['Nilai rata-rata per jenis', jenis ? nilai / jenis : 0, STYLE.currency],
      ['Jumlah kategori', kategori, STYLE.integer],
      ['Aset dengan nilai tertinggi', termahal ? termahal.nama : '—', STYLE.text],
      ['Nilai aset tertinggi', termahal ? nilaiAset(termahal) : 0, STYLE.currency]
    ];
    stats.forEach((stat, index) => {
      const r = 5 + index;
      rows.push(xlsxRow(r, [
        xlsxCell('A' + r, stat[0], STYLE.label),
        xlsxCell('B' + r, stat[1], stat[2])
      ]));
    });

    rows.push(xlsxRow(13, [xlsxCell('A13', 'Sebaran Kondisi', STYLE.header)], 24));
    rows.push(xlsxRow(14, [
      xlsxCell('A14', 'Kondisi', STYLE.subheader),
      xlsxCell('B14', 'Jumlah Jenis', STYLE.subheader),
      xlsxCell('C14', 'Total Unit', STYLE.subheader)
    ], 20));

    let r = 15;
    ['Baik', 'Rusak Ringan', 'Rusak Berat'].forEach((key) => {
      rows.push(xlsxRow(r, [
        xlsxCell('A' + r, key, STYLE.text),
        xlsxCell('B' + r, kondisi[key].jenis, STYLE.integer),
        xlsxCell('C' + r, kondisi[key].unit, STYLE.integer)
      ]));
      r += 1;
    });

    rows.push(xlsxRow(r, [
      xlsxCell('A' + r, 'TOTAL', STYLE.totalLabel),
      xlsxCell('B' + r, jenis, STYLE.totalInteger),
      xlsxCell('C' + r, unit, STYLE.totalInteger)
    ], 20));

    return sheetXml(rows.join(''), {
      dimension: 'A1:C' + r,
      cols: colsXml([34, 18, 16]),
      merges: ['A1:C1', 'A2:C2', 'A4:C4', 'A13:C13']
    });
  }

  function buildKategoriSheet(items) {
    const map = new Map();
    items.forEach((a) => {
      const nama = a.kategori || 'Lainnya';
      const entry = map.get(nama) || { nama: nama, jenis: 0, unit: 0, nilai: 0 };
      entry.jenis += 1;
      entry.unit += Number(a.jumlah) || 0;
      entry.nilai += nilaiAset(a);
      map.set(nama, entry);
    });

    const data = Array.from(map.values()).sort((a, b) => (
      b.nilai - a.nilai || a.nama.localeCompare(b.nama, 'id', { sensitivity: 'base' })
    ));
    const totalNilai = data.reduce((sum, row) => sum + row.nilai, 0);
    const totalJenis = data.reduce((sum, row) => sum + row.jenis, 0);
    const totalUnit = data.reduce((sum, row) => sum + row.unit, 0);

    const rows = [];
    rows.push(xlsxRow(1, [xlsxCell('A1', 'Rekap per Kategori', STYLE.title)], 30));
    rows.push(xlsxRow(2, [xlsxCell('A2', 'AsetKu · ' + formatWaktu(new Date().toISOString()) + ' · ' + data.length + ' kategori', STYLE.muted)], 18));
    rows.push(xlsxRow(4, [
      xlsxCell('A4', 'Kategori', STYLE.header),
      xlsxCell('B4', 'Jumlah Jenis', STYLE.header),
      xlsxCell('C4', 'Total Unit', STYLE.header),
      xlsxCell('D4', 'Nilai Total', STYLE.header),
      xlsxCell('E4', 'Porsi Nilai', STYLE.header)
    ], 26));

    let r = 5;
    data.forEach((row) => {
      rows.push(xlsxRow(r, [
        xlsxCell('A' + r, row.nama, STYLE.text),
        xlsxCell('B' + r, row.jenis, STYLE.integer),
        xlsxCell('C' + r, row.unit, STYLE.integer),
        xlsxCell('D' + r, row.nilai, STYLE.currency),
        xlsxCell('E' + r, totalNilai ? row.nilai / totalNilai : 0, STYLE.percent)
      ]));
      r += 1;
    });

    const lastDataRow = r - 1;
    const table = data.length ? {
      id: 2,
      name: 'RekapKategori',
      ref: 'A4:E' + lastDataRow,
      columns: ['Kategori', 'Jumlah Jenis', 'Total Unit', 'Nilai Total', 'Porsi Nilai']
    } : null;

    rows.push(xlsxRow(r, [
      xlsxCell('A' + r, 'TOTAL', STYLE.totalLabel),
      xlsxCell('B' + r, totalJenis, STYLE.totalInteger),
      xlsxCell('C' + r, totalUnit, STYLE.totalInteger),
      xlsxCell('D' + r, totalNilai, STYLE.totalCurrency),
      xlsxCell('E' + r, totalNilai ? 1 : 0, STYLE.totalPercent)
    ], 22));

    return {
      xml: sheetXml(rows.join(''), {
        dimension: 'A1:E' + r,
        cols: colsXml([30, 16, 14, 20, 14]),
        tableParts: table ? ['rId1'] : [],
        merges: ['A1:E1', 'A2:E2']
      }),
      table
    };
  }

  function buildLaporanSheet(items, mode) {
    const weekly = mode !== 'bulanan';
    const source = state.report.source;
    const offset = state.report.mode === mode ? state.report.offset : 0;
    const data = collectReport(items, source, mode, offset);
    const sumberLabel = source === 'createdAt' ? 'Tanggal input' : 'Tanggal perolehan';
    const windowLabel = (weekly ? REPORT_WEEKS + ' minggu' : REPORT_MONTHS + ' bulan') + ' hingga ' +
      (weekly ? formatWeekRange(data.focus.start) : formatMonthLabel(data.focus.start));
    const headers = ['Periode', 'Mulai', 'Selesai', 'Jumlah Aset', 'Total Unit', 'Nilai Total'];

    const rows = [];
    rows.push(xlsxRow(1, [xlsxCell('A1', weekly ? 'Laporan Mingguan' : 'Laporan Bulanan', STYLE.title)], 30));
    rows.push(xlsxRow(2, [
      xlsxCell('A2', 'AsetKu · ' + sumberLabel + ' · ' + windowLabel, STYLE.muted)
    ], 18));
    rows.push(xlsxRow(4, headers.map((h, i) => xlsxCell(colName(i + 1) + '4', h, STYLE.header)), 28));

    let totalJenis = 0;
    let totalUnit = 0;
    let totalNilai = 0;
    let r = 5;

    data.periods.forEach((period) => {
      const label = weekly
        ? 'Mgg ' + isoWeekNumber(period.start) + ' · ' + period.start.getFullYear()
        : formatMonthLabel(period.start);
      rows.push(xlsxRow(r, [
        xlsxCell('A' + r, label, STYLE.text),
        xlsxCell('B' + r, { date: isoOf(period.start) }, STYLE.date),
        xlsxCell('C' + r, { date: isoOf(period.end) }, STYLE.date),
        xlsxCell('D' + r, period.jenis, STYLE.integer),
        xlsxCell('E' + r, period.unit, STYLE.integer),
        xlsxCell('F' + r, period.nilai, STYLE.currency)
      ]));
      totalJenis += period.jenis;
      totalUnit += period.unit;
      totalNilai += period.nilai;
      r += 1;
    });

    const lastDataRow = r - 1;
    const table = {
      id: weekly ? 3 : 4,
      name: weekly ? 'LaporanMingguan' : 'LaporanBulanan',
      ref: 'A4:F' + lastDataRow,
      columns: headers
    };

    rows.push(xlsxRow(r, [
      xlsxCell('A' + r, 'TOTAL', STYLE.totalLabel),
      xlsxCell('B' + r, '', STYLE.totalLabel),
      xlsxCell('C' + r, '', STYLE.totalLabel),
      xlsxCell('D' + r, totalJenis, STYLE.totalInteger),
      xlsxCell('E' + r, totalUnit, STYLE.totalInteger),
      xlsxCell('F' + r, totalNilai, STYLE.totalCurrency)
    ], 22));

    const totalRow = r;
    const merges = ['A1:F1', 'A2:F2'];
    let dimension = 'A1:F' + totalRow;

    const tanpa = data.tanpaTanggal;
    if (tanpa.jenis > 0) {
      const noteRow = totalRow + 2;
      const note = angka.format(tanpa.jenis) + ' aset tanpa ' + sumberLabel.toLowerCase() +
        ' tidak masuk laporan (' + angka.format(tanpa.unit) + ' unit, ' + rupiah.format(tanpa.nilai) + ').';
      rows.push(xlsxRow(noteRow, [xlsxCell('A' + noteRow, note, STYLE.muted)], 18));
      merges.push('A' + noteRow + ':F' + noteRow);
      dimension = 'A1:F' + noteRow;
    }

    return {
      xml: sheetXml(rows.join(''), {
        dimension,
        cols: colsXml([22, 14, 14, 14, 14, 20]),
        tableParts: ['rId1'],
        merges
      }),
      table
    };
  }

  function stylesXml() {
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<numFmts count="3">' +
      '<numFmt numFmtId="164" formatCode="&quot;Rp&quot; #,##0"/>' +
      '<numFmt numFmtId="165" formatCode="dd/mm/yyyy"/>' +
      '<numFmt numFmtId="166" formatCode="0.0%"/>' +
      '</numFmts>' +
      '<fonts count="5">' +
      '<font><sz val="11"/><color theme="1"/><name val="Calibri"/><family val="2"/><scheme val="minor"/></font>' +
      '<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/><family val="2"/><scheme val="minor"/></font>' +
      '<font><b/><sz val="11"/><color rgb="FF1E293B"/><name val="Calibri"/><family val="2"/><scheme val="minor"/></font>' +
      '<font><i/><sz val="10"/><color rgb="FF64748B"/><name val="Calibri"/><family val="2"/><scheme val="minor"/></font>' +
      '<font><b/><sz val="14"/><color rgb="FF1E3A8A"/><name val="Calibri"/><family val="2"/><scheme val="minor"/></font>' +
      '</fonts>' +
      '<fills count="4">' +
      '<fill><patternFill patternType="none"/></fill>' +
      '<fill><patternFill patternType="gray125"/></fill>' +
      '<fill><patternFill patternType="solid"><fgColor rgb="FF2563EB"/><bgColor indexed="64"/></patternFill></fill>' +
      '<fill><patternFill patternType="solid"><fgColor rgb="FFEFF6FF"/><bgColor indexed="64"/></patternFill></fill>' +
      '</fills>' +
      '<borders count="2">' +
      '<border><left/><right/><top/><bottom/><diagonal/></border>' +
      '<border><left/><right/><top style="thin"><color rgb="FFCBD5E1"/></top><bottom style="thin"><color rgb="FFCBD5E1"/></bottom><diagonal/></border>' +
      '</borders>' +
      '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
      '<cellXfs count="15">' +
      '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
      '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>' +
      '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>' +
      '<xf numFmtId="3" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="right" vertical="top"/></xf>' +
      '<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="right" vertical="top"/></xf>' +
      '<xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="center" vertical="top"/></xf>' +
      '<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>' +
      '<xf numFmtId="0" fontId="2" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>' +
      '<xf numFmtId="3" fontId="2" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>' +
      '<xf numFmtId="164" fontId="2" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>' +
      '<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
      '<xf numFmtId="0" fontId="4" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
      '<xf numFmtId="166" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="center" vertical="top"/></xf>' +
      '<xf numFmtId="0" fontId="2" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>' +
      '<xf numFmtId="166" fontId="2" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>' +
      '</cellXfs>' +
      '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
      '<dxfs count="0"/>' +
      '<tableStyles count="0" defaultTableStyle="TableStyleMedium2" defaultPivotStyle="PivotStyleLight16"/>' +
      '</styleSheet>';
  }

  function workbookFiles(items) {
    const now = new Date().toISOString();
    const sheets = [
      Object.assign({ name: 'Data Aset' }, buildDataSheet(items)),
      { name: 'Ringkasan', xml: buildSummarySheet(items), table: null },
      Object.assign({ name: 'Rekap Kategori' }, buildKategoriSheet(items)),
      Object.assign({ name: 'Laporan Mingguan' }, buildLaporanSheet(items, 'mingguan')),
      Object.assign({ name: 'Laporan Bulanan' }, buildLaporanSheet(items, 'bulanan'))
    ];
    const tables = sheets.filter((sheet) => sheet.table).map((sheet) => sheet.table);

    const overrides = sheets.map((sheet, index) => (
      '<Override PartName="/xl/worksheets/sheet' + (index + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
    )).join('') +
      tables.map((table) => (
        '<Override PartName="/xl/tables/table' + table.id + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.table+xml"/>'
      )).join('');

    const contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
      overrides +
      '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
      '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>' +
      '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>' +
      '</Types>';

    const rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
      '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>' +
      '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>' +
      '</Relationships>';

    const sheetEntries = sheets.map((sheet, index) => (
      '<sheet name="' + xmlEscape(sheet.name) + '" sheetId="' + (index + 1) + '" r:id="rId' + (index + 1) + '"/>'
    )).join('');

    const workbook = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      '<fileVersion appName="xl" lastEdited="7" lowestEdited="7" rupBuild="23426"/>' +
      '<workbookPr defaultThemeVersion="166925"/>' +
      '<bookViews><workbookView xWindow="0" yWindow="0" windowWidth="24000" windowHeight="12000" activeTab="0"/></bookViews>' +
      '<sheets>' + sheetEntries + '</sheets>' +
      '<calcPr calcId="191029"/>' +
      '</workbook>';

    const workbookRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      sheets.map((sheet, index) => (
        '<Relationship Id="rId' + (index + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (index + 1) + '.xml"/>'
      )).join('') +
      '<Relationship Id="rId' + (sheets.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
      '</Relationships>';

    const core = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
      '<dc:title>Data Aset AsetKu</dc:title>' +
      '<dc:creator>AsetKu</dc:creator>' +
      '<cp:lastModifiedBy>AsetKu</cp:lastModifiedBy>' +
      '<dcterms:created xsi:type="dcterms:W3CDTF">' + now + '</dcterms:created>' +
      '<dcterms:modified xsi:type="dcterms:W3CDTF">' + now + '</dcterms:modified>' +
      '</cp:coreProperties>';

    const app = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">' +
      '<Application>AsetKu</Application>' +
      '<DocSecurity>0</DocSecurity>' +
      '<ScaleCrop>false</ScaleCrop>' +
      '<HeadingPairs><vt:vector size="2" baseType="variant">' +
      '<vt:variant><vt:lpstr>Worksheets</vt:lpstr></vt:variant>' +
      '<vt:variant><vt:i4>' + sheets.length + '</vt:i4></vt:variant>' +
      '</vt:vector></HeadingPairs>' +
      '<TitlesOfParts><vt:vector size="' + sheets.length + '" baseType="lpstr">' +
      sheets.map((sheet) => '<vt:lpstr>' + xmlEscape(sheet.name) + '</vt:lpstr>').join('') +
      '</vt:vector></TitlesOfParts>' +
      '<Company></Company>' +
      '<LinksUpToDate>false</LinksUpToDate>' +
      '<SharedDoc>false</SharedDoc>' +
      '<HyperlinksChanged>false</HyperlinksChanged>' +
      '<AppVersion>16.0300</AppVersion>' +
      '</Properties>';

    const files = [
      { name: '[Content_Types].xml', text: contentTypes },
      { name: '_rels/.rels', text: rels },
      { name: 'docProps/core.xml', text: core },
      { name: 'docProps/app.xml', text: app },
      { name: 'xl/workbook.xml', text: workbook },
      { name: 'xl/_rels/workbook.xml.rels', text: workbookRels },
      { name: 'xl/styles.xml', text: stylesXml() }
    ];

    sheets.forEach((sheet, index) => {
      files.push({ name: 'xl/worksheets/sheet' + (index + 1) + '.xml', text: sheet.xml });
      if (sheet.table) {
        files.push({
          name: 'xl/worksheets/_rels/sheet' + (index + 1) + '.xml.rels',
          text: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
            '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/table" Target="../tables/table' + sheet.table.id + '.xml"/>' +
            '</Relationships>'
        });
      }
    });

    tables.forEach((table) => {
      files.push({ name: 'xl/tables/table' + table.id + '.xml', text: tableXml(table) });
    });

    return files.map((file) => ({ name: file.name, data: encoder.encode(file.text) }));
  }

  function exportXlsx() {
    if (!state.items.length) {
      toast('Belum ada data untuk diekspor.', 'error');
      return;
    }

    try {
      const items = sortItems(state.items, state.sort);
      const zip = zipStore(workbookFiles(items));
      const blob = new Blob([zip], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      download(blob, 'data-aset-' + todayIso() + '.xlsx');
      toast('Data berhasil diekspor ke Excel (.xlsx).', 'success');
    } catch (err) {
      console.error('Gagal membuat file Excel:', err);
      toast('Gagal membuat file Excel. Coba lagi.', 'error');
    }
  }

  function exportJson() {
    if (!state.items.length) {
      toast('Belum ada data untuk dicadangkan.', 'error');
      return;
    }
    const payload = {
      app: 'AsetKu',
      version: 1,
      exportedAt: new Date().toISOString(),
      items: state.items
    };
    download(
      new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }),
      'cadangan-aset-' + todayIso() + '.json'
    );
    toast('Cadangan JSON berhasil dibuat.', 'success');
  }

  function importJsonFile(file) {
    const reader = new FileReader();

    reader.onload = function () {
      let parsed;
      try {
        parsed = JSON.parse(String(reader.result));
      } catch (err) {
        toast('File bukan JSON yang valid.', 'error');
        return;
      }

      const list = Array.isArray(parsed)
        ? parsed
        : (parsed && (Array.isArray(parsed.items) ? parsed.items : (Array.isArray(parsed.data) ? parsed.data : null)));

      if (!list) {
        toast('Format file tidak dikenali. Gunakan file cadangan dari aplikasi ini.', 'error');
        return;
      }

      const incoming = list.map(normalize).filter(Boolean);
      if (!incoming.length) {
        toast('File tidak berisi data aset yang valid.', 'error');
        return;
      }

      askConfirm({
        title: 'Impor data aset?',
        message: incoming.length + ' aset ditemukan pada file. Data akan digabungkan dengan daftar saat ini; kode aset yang sudah ada akan dilewati.',
        confirmLabel: 'Impor sekarang',
        danger: false,
        onConfirm: function () {
          let added = 0;
          let skipped = 0;
          const now = new Date().toISOString();

          incoming.forEach((item) => {
            const dup = item.kode && state.items.some((a) => String(a.kode || '').toLowerCase() === item.kode.toLowerCase());
            if (dup) {
              skipped += 1;
              return;
            }
            state.items.push(Object.assign({}, item, { id: uid(), createdAt: now, updatedAt: now }));
            added += 1;
          });

          persist();
          renderKategoriOptions();
          renderAll();
          toast(added + ' aset diimpor' + (skipped ? ', ' + skipped + ' dilewati karena kode sama' : '') + '.', added ? 'success' : 'info');
        }
      });
    };

    reader.onerror = function () {
      toast('Gagal membaca file.', 'error');
    };

    reader.readAsText(file);
  }

  function seedContoh() {
    const now = Date.now();
    CONTOH.forEach((item, index) => {
      const data = normalize(Object.assign({}, item, {
        kode: nextKode(),
        createdAt: new Date(now + index).toISOString(),
        updatedAt: new Date(now + index).toISOString()
      }));
      if (data) state.items.push(data);
    });
    persist();
    renderKategoriOptions();
    renderAll();
    toast('Contoh data berhasil dimuat.', 'success');
  }

  function clearAll() {
    if (!state.items.length) {
      toast('Belum ada data untuk dihapus.', 'info');
      return;
    }
    askConfirm({
      title: 'Hapus semua data?',
      message: 'Seluruh ' + state.items.length + ' data aset akan dihapus permanen. Sebaiknya buat cadangan JSON terlebih dahulu.',
      confirmLabel: 'Hapus semua',
      onConfirm: function () {
        state.items = [];
        state.page = 1;
        persist();
        renderKategoriOptions();
        renderAll();
        toast('Semua data aset telah dihapus.', 'success');
      }
    });
  }

  /* ---------------- Toast ---------------- */
  function toast(message, type) {
    const kind = type || 'success';
    const container = $('#toasts');
    if (!container) return;

    const el = document.createElement('div');
    el.className = 'toast ' + kind;
    el.setAttribute('role', kind === 'error' ? 'alert' : 'status');
    el.innerHTML =
      '<span class="toast-icon">' + (kind === 'error' ? SVG.alert : kind === 'info' ? SVG.info : SVG.check) + '</span>' +
      '<span class="toast-text">' + esc(message) + '</span>';
    container.appendChild(el);

    setTimeout(() => {
      el.classList.add('leaving');
      setTimeout(() => el.remove(), 240);
    }, 3800);
  }

  /* ---------------- Filter & navigasi ---------------- */
  function resetFilters() {
    state.query = '';
    state.kategori = 'all';
    state.kondisi = 'all';
    state.sort = 'baru';
    state.columnFilters = {};
    state.page = 1;
    $('#searchInput').value = '';
    $('#filterKategori').value = 'all';
    $('#filterKondisi').value = 'all';
    $('#sortSelect').value = 'baru';
    tutupFilterKolom(false);
    renderTable();
  }

  function closeDataMenu() {
    const menu = $('#dataMenu');
    const btn = $('#dataMenuBtn');
    if (menu) menu.hidden = true;
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }

  /* ---------------- Binding event ---------------- */
  function bindEvents() {
    /* Tema */
    $('#themeToggle').addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      applyTheme(current === 'dark' ? 'light' : 'dark', true);
    });

    /* Dashboard & laporan */
    $('#reportSource').addEventListener('change', (e) => {
      state.report.source = e.target.value === 'createdAt' ? 'createdAt' : 'tanggal';
      saveUiPrefs();
      renderDashboard();
    });

    const setReportMode = (mode) => {
      if (state.report.mode === mode) return;
      state.report.mode = mode;
      state.report.offset = 0;
      saveUiPrefs();
      renderDashboard();
    };

    $('#reportModeWeekly').addEventListener('click', () => setReportMode('mingguan'));
    $('#reportModeMonthly').addEventListener('click', () => setReportMode('bulanan'));

    const setReportMetric = (metric) => {
      if (state.report.metric === metric) return;
      state.report.metric = metric;
      saveUiPrefs();
      renderDashboard();
    };

    $('#reportMetricUnit').addEventListener('click', () => setReportMetric('unit'));
    $('#reportMetricValue').addEventListener('click', () => setReportMetric('nilai'));

    $('#reportPrev').addEventListener('click', () => {
      state.report.offset = Math.min(state.report.offset + 1, 520);
      renderDashboard();
    });

    $('#reportNext').addEventListener('click', () => {
      state.report.offset = Math.max(0, state.report.offset - 1);
      renderDashboard();
    });

    $('#reportToday').addEventListener('click', () => {
      if (state.report.offset === 0) return;
      state.report.offset = 0;
      renderDashboard();
    });

    /* Form */
    const form = $('#assetForm');
    const submitForm = () => {
      if (typeof form.requestSubmit === 'function') form.requestSubmit();
      else form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    };

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = readForm();
      if (!validate(data)) return;

      const now = new Date().toISOString();
      const wasEdit = !!state.editId;
      const newId = wasEdit ? null : uid();
      let nextItems;

      if (wasEdit) {
        const index = state.items.findIndex((a) => a.id === state.editId);
        if (index === -1) {
          toast('Data aset tidak ditemukan.', 'error');
          return;
        }
        nextItems = state.items.slice();
        nextItems[index] = Object.assign({}, nextItems[index], data, { updatedAt: now });
      } else {
        nextItems = state.items.concat([
          Object.assign({ id: newId, createdAt: now, updatedAt: now }, data)
        ]);
      }

      if (!persistItems(nextItems)) return;

      state.items = nextItems;
      state.editId = null;
      state.formSnapshot = '';
      closeModal($('#formModal'));
      renderKategoriOptions();

      if (wasEdit) {
        renderAll();
        toast('Perubahan aset berhasil disimpan.', 'success');
      } else {
        state.page = 1;
        applyFilters();
        if (!state.view.some((a) => a.id === newId)) {
          resetFilters();
        }
        renderAll();
        toast('Aset baru berhasil ditambahkan.', 'success');
      }
    });

    $('#btnSubmitTop').addEventListener('click', submitForm);

    $('#btnGenKode').addEventListener('click', () => {
      const input = $('#fKode');
      input.value = nextKode();
      clearFieldError(input);
    });

    form.addEventListener('input', (e) => {
      clearFieldError(e.target);
      if (e.target.id === 'fJumlah' || e.target.id === 'fHarga') updateTotalPreview();
    });

    form.addEventListener('change', (e) => {
      clearFieldError(e.target);
    });

    /* Tombol tambah */
    $('#btnAdd').addEventListener('click', () => openForm());

    /* Pencarian & filter */
    $('#searchInput').addEventListener('input', debounce((e) => {
      state.query = e.target.value;
      state.page = 1;
      renderTable();
    }));

    $('#filterKategori').addEventListener('change', (e) => {
      state.kategori = e.target.value;
      state.page = 1;
      renderTable();
    });

    $('#filterKondisi').addEventListener('change', (e) => {
      state.kondisi = e.target.value;
      state.page = 1;
      renderTable();
    });

    $('#sortSelect').addEventListener('change', (e) => {
      state.sort = e.target.value;
      state.page = 1;
      renderTable();
    });

    $('#btnResetFilter').addEventListener('click', resetFilters);

    /* Filter per kolom */
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.col-filter-btn');
      if (!btn) return;
      bukaFilterKolom(btn.getAttribute('data-col'), btn);
    });

    document.addEventListener('pointerdown', (e) => {
      if (!filterPop) return;
      if (filterPop.contains(e.target)) return;
      if (e.target.closest('.col-filter-btn')) return;
      tutupFilterKolom(false);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && filterPop) {
        e.stopPropagation();
        tutupFilterKolom(true);
      }
    });

    window.addEventListener('resize', () => tutupFilterKolom(false));
    window.addEventListener('scroll', (e) => {
      if (filterPop && e.target instanceof Node && filterPop.contains(e.target)) return;
      tutupFilterKolom(false);
    }, true);

    /* Paginasi */
    $('#pagePrev').addEventListener('click', () => {
      if (state.page > 1) {
        state.page -= 1;
        renderTable();
      }
    });

    $('#pageNext').addEventListener('click', () => {
      const pages = Math.max(1, Math.ceil(state.view.length / PAGE_SIZE));
      if (state.page < pages) {
        state.page += 1;
        renderTable();
      }
    });

    /* Aksi tabel */
    const tbody = $('#assetRows');
    tbody.addEventListener('click', (e) => {
      const tr = e.target.closest('tr[data-id]');
      if (!tr) return;
      const id = tr.getAttribute('data-id');
      const action = e.target.closest('[data-act]');

      if (!action) {
        openDetail(id);
        return;
      }
      const act = action.getAttribute('data-act');
      if (act === 'view') openDetail(id);
      else if (act === 'edit') openForm(id);
      else if (act === 'delete') deleteAsset(id);
    });

    tbody.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      if (e.target.closest('[data-act]')) return;
      const tr = e.target.closest('tr[data-id]');
      if (!tr) return;
      e.preventDefault();
      openDetail(tr.getAttribute('data-id'));
    });

    /* Empty state */
    $('#emptyState').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-empty-action]');
      if (!btn) return;
      const action = btn.getAttribute('data-empty-action');
      if (action === 'add') openForm();
      else if (action === 'reset') resetFilters();
      else if (action === 'seed') seedContoh();
    });

    /* Detail */
    $('#detailEdit').addEventListener('click', () => {
      const id = state.detailId;
      if (!id) return;
      closeModal($('#detailModal'));
      openForm(id);
    });

    $('#detailDelete').addEventListener('click', () => {
      if (state.detailId) deleteAsset(state.detailId);
    });

    /* Konfirmasi */
    $('#confirmOk').addEventListener('click', () => {
      const callback = state.pendingConfirm;
      closeModal($('#confirmModal'));
      if (typeof callback === 'function') callback();
    });

    /* Menu data */
    const menuBtn = $('#dataMenuBtn');
    const menu = $('#dataMenu');

    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const willOpen = menu.hidden;
      closeUserMenu();
      menu.hidden = !willOpen;
      menuBtn.setAttribute('aria-expanded', String(willOpen));
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.dropdown')) {
        closeDataMenu();
        closeUserMenu();
      }
    });

    menu.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.getAttribute('data-action');
      closeDataMenu();

      if (action === 'export-xlsx') exportXlsx();
      else if (action === 'export-csv') exportCsv();
      else if (action === 'export-json') exportJson();
      else if (action === 'import-json') $('#importFile').click();
      else if (action === 'seed') seedContoh();
      else if (action === 'clear') clearAll();
    });

    $('#importFile').addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      e.target.value = '';
      if (file) importJsonFile(file);
    });

    /* Tutup modal */
    document.addEventListener('click', (e) => {
      const closer = e.target.closest('[data-close]');
      if (!closer) return;
      const modal = closer.closest('.modal');
      if (!modal || modal.hidden) return;
      if (modal.id === 'formModal') requestCloseForm();
      else closeModal(modal);
    });

    /* Keyboard */
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const openModals = $$('.modal:not([hidden])');
        if (openModals.length) {
          e.preventDefault();
          const topModal = openModals[openModals.length - 1];
          if (topModal.id === 'formModal') requestCloseForm();
          else closeModal(topModal);
          return;
        }
        if (!menu.hidden) {
          closeDataMenu();
          menuBtn.focus();
        }
        const userMenu = $('#userMenu');
        if (userMenu && !userMenu.hidden) {
          closeUserMenu();
          $('#userMenuBtn').focus();
        }
      }

      if (!currentUser) return;

      const topModal = $$('.modal:not([hidden])').pop();
      if (topModal && topModal.id === 'formModal' && (e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        submitForm();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const search = $('#searchInput');
        search.focus();
        search.select();
      }
    });

    /* Sinkronisasi antar tab */
    window.addEventListener('storage', (e) => {
      if (!currentUser) return;

      if (e.key === DATA_KEY) {
        state.items = loadData();
        renderKategoriOptions();
        renderAll();
        toast('Data diperbarui dari tab lain.', 'info');
      }

      if (e.key === SESSION_KEY && !e.newValue) {
        currentUser = null;
        state.items = [];
        state.view = [];
        closeUserMenu();
        closeAllModals();
        renderAll();
        showAuth('login');
        toast('Sesi berakhir karena Anda keluar di tab lain.', 'info');
      }
    });
  }

  /* ---------------- Binding autentikasi ---------------- */
  function bindAuthEvents() {
    /* Tampilkan / sembunyikan kata sandi */
    $$('[data-toggle-password]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const input = document.getElementById(btn.getAttribute('data-toggle-password'));
        if (!input) return;
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        btn.classList.toggle('is-visible', show);
        const label = show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi';
        btn.setAttribute('aria-label', label);
        btn.setAttribute('title', label);
      });
    });

    /* Login */
    $('#loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();

      if (Date.now() < loginLock.until) {
        setAuthAlert('loginAlert', 'Terlalu banyak percobaan. Tunggu ' + Math.ceil((loginLock.until - Date.now()) / 1000) + ' detik lagi.');
        startLockCountdown();
        return;
      }

      setAuthAlert('loginAlert', '');
      const username = $('#loginUsername').value.trim();
      const password = $('#loginPassword').value;

      if (!username || !password) {
        setAuthAlert('loginAlert', 'Nama pengguna dan kata sandi wajib diisi.');
        return;
      }

      const btn = $('#loginSubmit');
      if (btn.disabled) return;
      btn.disabled = true;
      btn.textContent = 'Memeriksa…';

      try {
        const user = findUserByUsername(username);
        const valid = user ? await verifyPassword(user, password) : false;

        if (!valid) {
          loginLock.fails += 1;
          $('#loginPassword').value = '';
          if (loginLock.fails >= MAX_LOGIN_ATTEMPTS) {
            loginLock.fails = 0;
            loginLock.until = Date.now() + LOCK_DURATION;
            setAuthAlert('loginAlert', 'Terlalu banyak percobaan gagal. Coba lagi dalam 30 detik.');
          } else {
            const sisa = MAX_LOGIN_ATTEMPTS - loginLock.fails;
            setAuthAlert('loginAlert', 'Nama pengguna atau kata sandi salah. Sisa percobaan: ' + sisa + '.');
          }
          $('#loginPassword').focus();
          return;
        }

        resetLoginLock();

        const remember = $('#rememberMe').checked;
        const fresh = updateLastLogin(user.id) || user;
        createSession(fresh, remember);
        const label = fresh.displayName || fresh.username;
        $('#loginForm').reset();
        enterApp(fresh);
        toast('Selamat datang kembali, ' + label + '.', 'success');
      } catch (err) {
        console.error('Login gagal:', err);
        setAuthAlert('loginAlert', 'Terjadi kesalahan saat memeriksa akun. Coba lagi.');
      } finally {
        if (Date.now() < loginLock.until) {
          startLockCountdown();
        } else {
          btn.disabled = false;
          btn.textContent = 'Masuk';
        }
      }
    });

    /* Setup akun pertama */
    $('#setupForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      clearFormErrors('#setupForm');
      setAuthAlert('setupAlert', '');

      const username = $('#setupUsername').value.trim();
      const displayName = $('#setupName').value.trim();
      const password = $('#setupPassword').value;
      const confirm = $('#setupConfirm').value;
      let ok = true;

      if (!/^[A-Za-z0-9._-]{3,24}$/.test(username)) {
        setFormError('#setupForm', 'setupUsername', 'Gunakan 3–24 karakter: huruf, angka, titik, garis bawah, atau tanda hubung.');
        ok = false;
      } else if (loadUsers().some((u) => String(u.username).toLowerCase() === username.toLowerCase())) {
        setFormError('#setupForm', 'setupUsername', 'Nama pengguna sudah dipakai.');
        ok = false;
      }

      if (!password || password.length < 8) {
        setFormError('#setupForm', 'setupPassword', 'Kata sandi minimal 8 karakter.');
        ok = false;
      }
      if (confirm !== password) {
        setFormError('#setupForm', 'setupConfirm', 'Konfirmasi kata sandi tidak sama.');
        ok = false;
      }
      if (!ok) return;

      const btn = $('#setupSubmit');
      btn.disabled = true;
      btn.textContent = 'Membuat akun…';

      try {
        const salt = randomSalt();
        const result = await hashPassword(password, salt, PBKDF2_ITERATIONS);
        const user = {
          id: uid(),
          username: username,
          displayName: displayName || username,
          salt: salt,
          iterations: PBKDF2_ITERATIONS,
          algo: result.algo,
          hash: result.hash,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        };

        if (!saveUsers([user])) {
          setAuthAlert('setupAlert', 'Akun gagal disimpan. Pastikan penyimpanan browser tersedia, lalu coba lagi.');
          return;
        }

        createSession(user, true);
        $('#setupForm').reset();
        enterApp(user);
        toast('Akun berhasil dibuat. Selamat datang, ' + user.displayName + '!', 'success');
      } catch (err) {
        console.error('Gagal membuat akun:', err);
        setAuthAlert('setupAlert', 'Terjadi kesalahan saat membuat akun. Coba lagi.');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Buat Akun';
      }
    });

    /* Lupa kata sandi -> reset akun */
    $('#btnForgot').addEventListener('click', () => {
      const users = loadUsers();
      const label = users[0] ? users[0].username : 'pengelola';
      const desc = $('#resetModal .confirm-text');
      if (desc) {
        desc.innerHTML = 'Akun <strong>' + esc(label) + '</strong> akan dihapus dari browser ini dan Anda perlu membuat akun baru. Seluruh <strong>data aset tetap tersimpan</strong> dan bisa diakses kembali setelah masuk.';
      }
      $('#resetWord').value = '';
      $('#btnResetAccount').disabled = true;
      clearFormErrors('#resetModal');
      openModal($('#resetModal'));
      setTimeout(() => { try { $('#resetWord').focus(); } catch (err) { /* abaikan */ } }, 60);
    });

    $('#resetWord').addEventListener('input', (e) => {
      $('#btnResetAccount').disabled = e.target.value.trim().toUpperCase() !== 'RESET';
    });

    $('#btnResetAccount').addEventListener('click', () => {
      if ($('#resetWord').value.trim().toUpperCase() !== 'RESET') return;
      resetAccount();
    });

    /* Menu pengguna */
    const userMenuBtn = $('#userMenuBtn');
    const userMenu = $('#userMenu');

    userMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const willOpen = userMenu.hidden;
      closeDataMenu();
      userMenu.hidden = !willOpen;
      userMenuBtn.setAttribute('aria-expanded', String(willOpen));
    });

    $('#btnChangePassword').addEventListener('click', openPasswordModal);
    $('#btnLogout').addEventListener('click', logout);

    /* Ganti kata sandi */
    $('#passwordForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!currentUser) return;

      clearFormErrors('#passwordForm');
      setAuthAlert('passwordAlert', '');

      const current = $('#currentPassword').value;
      const next = $('#newPassword').value;
      const confirm = $('#confirmPassword').value;
      let ok = true;

      if (!current) {
        setFormError('#passwordForm', 'currentPassword', 'Kata sandi saat ini wajib diisi.');
        ok = false;
      }
      if (!next || next.length < 8) {
        setFormError('#passwordForm', 'newPassword', 'Kata sandi baru minimal 8 karakter.');
        ok = false;
      }
      if (confirm !== next) {
        setFormError('#passwordForm', 'confirmPassword', 'Konfirmasi kata sandi tidak sama.');
        ok = false;
      }
      if (!ok) return;

      const btn = $('#btnSavePassword');
      btn.disabled = true;
      btn.textContent = 'Menyimpan…';

      try {
        const valid = await verifyPassword(currentUser, current);
        if (!valid) {
          setFormError('#passwordForm', 'currentPassword', 'Kata sandi saat ini salah.');
          return;
        }
        if (next === current) {
          setFormError('#passwordForm', 'newPassword', 'Gunakan kata sandi yang berbeda dari sebelumnya.');
          return;
        }

        const iterations = currentUser.iterations || PBKDF2_ITERATIONS;
        const salt = randomSalt();
        const result = await hashPassword(next, salt, iterations);
        const users = loadUsers().map((u) => (
          u.id === currentUser.id
            ? Object.assign({}, u, {
              salt: salt,
              iterations: iterations,
              algo: result.algo,
              hash: result.hash,
              updatedAt: new Date().toISOString()
            })
            : u
        ));

        if (!saveUsers(users)) {
          setAuthAlert('passwordAlert', 'Kata sandi gagal disimpan. Coba lagi.');
          return;
        }

        currentUser = users.find((u) => u.id === currentUser.id) || currentUser;
        closeModal($('#passwordModal'));
        toast('Kata sandi berhasil diperbarui.', 'success');
      } catch (err) {
        console.error('Gagal mengganti kata sandi:', err);
        setAuthAlert('passwordAlert', 'Terjadi kesalahan saat menyimpan kata sandi.');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Simpan Kata Sandi';
      }
    });
  }

  /* ---------------- Inisialisasi ---------------- */
  function init() {
    loadUiPrefs();
    bindEvents();
    bindAuthEvents();

    $('#fTanggal').max = todayIso();
    applyTheme(document.documentElement.getAttribute('data-theme') || 'light', false);
    startAuth();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
