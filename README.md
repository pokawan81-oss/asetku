# AsetKu — Website Pencatatan Aset

Website pencatatan aset sederhana yang dibuat **hanya dengan HTML, CSS, dan JavaScript** (tanpa framework, tanpa server, tanpa database eksternal).

Data aset disimpan otomatis di **localStorage** browser, sehingga tetap ada walaupun halaman ditutup atau browser di-restart.

**Versi online:** https://pokawan81-oss.github.io/asetku/ — setiap pengunjung memakai data lokal browsernya masing-masing.

## Fitur

- **Login pengelola** — buat akun saat pertama membuka aplikasi, masuk dengan username & kata sandi, "Ingat saya", ganti kata sandi, dan keluar. Kata sandi disimpan sebagai hash (PBKDF2-SHA256), bukan teks biasa.
- **Tambah aset sendiri** — kode otomatis (AST-001, AST-002, …), nama, kategori, jumlah, satuan, kondisi, lokasi, tanggal perolehan, harga, dan keterangan.
- **Edit & hapus** data aset dengan konfirmasi.
- **Form aman** — meminta konfirmasi sebelum ditutup jika ada perubahan belum disimpan, memvalidasi tanggal (tidak boleh masa depan) dan kode duplikat, serta menyimpan dengan `Ctrl + Enter`. Tombol simpan tersedia di footer yang selalu terlihat dan di kanan atas form.
- **Detail aset** dalam modal, termasuk nilai total.
- **Pencarian** berdasarkan nama, kode, kategori, lokasi, atau keterangan.
- **Filter** kategori & kondisi, serta **pengurutan** (terbaru, nama, nilai, tanggal).
- **Kartu ringkasan** di dashboard: total aset, total unit, kondisi aktif/maintenance/rusak, dan total nilai.
- **Dashboard & laporan** — KPI keseluruhan, tren mingguan/bulanan, komposisi kategori, top lokasi, kondisi aset, nilai per kategori, aset terbaru, dan tabel rekap; sumber tanggal (perolehan/input) serta metrik (unit/nilai) dapat dipilih.
- **Paginasi** otomatis.
- **Penyimpanan otomatis** di browser (localStorage) + status "Tersimpan".
- **Ekspor Excel (.xlsx)** asli dengan 5 sheet: Data Aset, Ringkasan, Rekap Kategori, Laporan Mingguan, dan Laporan Bulanan — lengkap dengan format rupiah, tanggal, baris total, dan **tombol filter di setiap kolom**.
- **Ekspor CSV** dan **cadangan/impor JSON**.
- **Mode terang & gelap** (tersimpan otomatis).
- **Muat contoh data** untuk mencoba aplikasi dengan cepat.
- Tampilan responsif (desktop, tablet, ponsel).

## Cara Menjalankan

1. Ekstrak/buka folder proyek ini.
2. Klik dua kali file **`index.html`** (atau buka dengan Chrome/Edge/Firefox).
3. Saat pertama dibuka, **buat akun pengelola** (username + kata sandi minimal 8 karakter), lalu masuk.
4. Klik **Tambah Aset** untuk mulai mencatat.

Opsional (disarankan jika ingin lebih stabil): jalankan server lokal sederhana, misalnya

```bash
# Python
python -m http.server 8000
# lalu buka http://localhost:8000
```

## Tambah & Edit Aset

1. Klik **Tambah Aset** (atau ikon pensil pada baris aset untuk mengedit).
2. Kode aset terisi otomatis (`AST-003`, dst.). Gunakan tombol **Otomatis** untuk membuat ulang, atau ketik kode sendiri.
3. Isi minimal **Nama aset** dan **Kategori**; jumlah minimal 1.
4. **Nilai total** dihitung otomatis dari jumlah × harga satuan.
5. Tanggal perolehan tidak boleh melebihi hari ini. Kode aset harus unik.
6. Klik **Simpan Aset** / **Simpan Perubahan** (tombol di footer yang selalu terlihat), tombol centang **Simpan** di kanan atas form, atau tekan `Ctrl + Enter`.
7. Jika form ditutup lewat backdrop, `Esc`, atau **Batal** saat ada perubahan, aplikasi meminta konfirmasi agar isian tidak hilang.

Jika penyimpanan browser gagal (mis. ruang penuh), form tetap terbuka dan data tidak dianggap tersimpan.

## Dashboard

Halaman utama dibuka dengan panel **Dashboard** yang merangkum seluruh aset.

- **Kartu KPI** — Total Aset (jumlah jenis), Total Unit, Aktif (kondisi Baik), Maintenance (Rusak Ringan), Rusak (Rusak Berat), dan Total Nilai.
- **Sumber tanggal** — pilih **Tanggal perolehan** atau **Tanggal input** (`createdAt`) sebagai dasar pengelompokan.
- **Mingguan / Bulanan** — minggu mengikuti kalender Senin–Minggu, bulan mengikuti bulan kalender.
- **Unit / Nilai** — mengganti satuan grafik antara jumlah unit dan total nilai (jumlah × harga).
- **Navigasi periode** — tombol ‹ › menggeser periode fokus satu minggu/bulan; **Terbaru** kembali ke periode berjalan.
- Jendela laporan menampilkan **8 minggu** atau **6 bulan** terakhir yang berakhir pada periode fokus.

Isi panel:

1. **Aset per Kategori** — diagram donat beserta legenda jumlah unit dan persentasenya.
2. **Aset per Lokasi** — grafik batang vertikal untuk lokasi dengan unit/nilai terbanyak pada rentang laporan.
3. **Aset per Kondisi** — diagram pie jumlah aset per kondisi (Baik, Rusak Ringan, Rusak Berat) pada rentang laporan.
4. **Tren per minggu/bulan** — grafik batang; batang paling kanan adalah periode fokus.
5. **Nilai per Kategori** — lima kategori dengan nilai terbesar.
6. **Aset Terbaru** — lima entri terakhir yang ditambahkan.
7. **Ringkasan Kondisi** — jumlah aset, unit, dan nilai untuk setiap kondisi dari seluruh data.
8. **Rekap periode** — jumlah aset, unit, dan nilai tiap periode, ditutup baris TOTAL.

Aset tanpa tanggal sesuai sumber (misalnya tanggal perolehan kosong) tidak diikutkan pada tren, tetapi jumlahnya dijelaskan pada catatan di atas grafik. Preferensi sumber, mode, dan metrik tersimpan otomatis di browser.

## Struktur File

```
Aset WEB/
├─ index.html            # Struktur halaman & modal
├─ assets/
│  ├─ css/style.css      # Seluruh tampilan (tema terang/gelap, responsif)
│  └─ js/app.js          # Logika aplikasi + penyimpanan localStorage
├─ .nojekyll             # Agar GitHub Pages menyajikan folder assets apa adanya
├─ .gitignore            # Mengabaikan artefak uji & hasil ekspor
└─ README.md
```

## Tempat Penyimpanan Data

| Kunci localStorage / sessionStorage | Isi |
| --- | --- |
| `asetku.data.v1` | Seluruh data aset (format JSON) |
| `asetku.users.v1` | Akun pengelola (username, salt, dan hash kata sandi) |
| `asetku.session.v1` | Sesi login (localStorage bila "Ingat saya", selain itu sessionStorage) |
| `asetku.theme` | Preferensi tema (`light` / `dark`) |
| `asetku.ui.v1` | Preferensi dashboard (sumber tanggal, mode mingguan/bulanan, metrik unit/nilai) |

Data tersimpan **per browser dan per perangkat** — tidak tersinkron ke komputer lain dan tidak dikirim ke internet.

> Penting: menghapus data situs/browser (clear browsing data) akan menghapus data aset. Gunakan **Data → Cadangkan JSON** secara berkala, dan **Data → Impor JSON** untuk memulihkannya.

## Login & Keamanan

1. Saat aplikasi pertama kali dibuka, Anda diminta **membuat akun pengelola** (username 3–24 karakter, kata sandi minimal 8 karakter).
2. Login memakai username & kata sandi tersebut. Centang **Ingat saya** agar sesi bertahan 30 hari; tanpa centang, sesi hanya berlaku di tab tersebut.
3. Menu pengguna (avatar di kanan atas) menyediakan **Ganti kata sandi** dan **Keluar**.
4. Setelah 5 percobaan login gagal, form dikunci sementara selama 30 detik.
5. **Lupa kata sandi**: klik "Lupa kata sandi?" lalu ketik `RESET`. Akun pengelola akan dihapus dan Anda membuat akun baru; **data aset tetap tersimpan**.
6. Logout di satu tab juga mengunci tab lain yang memakai sesi "Ingat saya".

Kata sandi tidak disimpan sebagai teks biasa, melainkan hash **PBKDF2-SHA256** (150.000 iterasi + salt acak) menggunakan Web Crypto API. Bila browser tidak mendukung Web Crypto, aplikasi memakai hash cadangan dan mencatat peringatan di konsol.

> **Catatan keamanan:** karena semua berjalan tanpa server, login ini adalah *pembatas akses lokal*, bukan keamanan sejati. Siapa pun yang memiliki akses ke browser/DevTools perangkat tersebut masih dapat membaca data di localStorage. Untuk keamanan nyata (multi-perangkat, hak akses, audit), diperlukan backend/API.

## Ekspor Excel (.xlsx)

Buka menu **Data → Ekspor Excel (.xlsx)**. File `.xlsx` dibuat langsung di browser (tanpa library) dan berisi:

| Sheet | Isi |
| --- | --- |
| **Data Aset** | Semua aset dengan header berwarna, baris beku (freeze), **tombol filter di setiap kolom**, format rupiah, tanggal `dd/mm/yyyy`, dan baris TOTAL. |
| **Ringkasan** | Statistik umum (jumlah jenis, total unit, total nilai, rata-rata nilai, aset termahal) dan sebaran kondisi. |
| **Rekap Kategori** | Jumlah jenis, total unit, nilai total, dan porsi nilai per kategori, diurutkan dari nilai terbesar. |
| **Laporan Mingguan** | 8 minggu terakhir: periode, tanggal mulai/selesai, jumlah aset, total unit, dan nilai total, ditutup baris TOTAL. |
| **Laporan Bulanan** | 6 bulan terakhir dengan kolom dan format yang sama seperti laporan mingguan. |

- Ekspor selalu memuat **seluruh data**, bukan hanya halaman yang sedang tampil.
- Urutan baris mengikuti pilihan **Urutkan** yang aktif.
- Kolom angka disimpan sebagai angka asli (bisa dihitung ulang di Excel), bukan teks.
- Nama file: `data-aset-YYYY-MM-DD.xlsx`.
- **Ekspor CSV** tetap tersedia untuk kebutuhan impor ke aplikasi lain.
- Sumber tanggal pada kedua sheet laporan mengikuti pilihan di dashboard. Jika fokus periode sedang digeser, sheet dengan mode yang sama ikut bergeser; sheet mode lainnya memakai periode terbaru.

### Memfilter di Excel

Sheet **Data Aset**, **Rekap Kategori**, **Laporan Mingguan**, dan **Laporan Bulanan** diekspor sebagai **Tabel Excel** (`DataAset`, `RekapKategori`, `LaporanMingguan`, `LaporanBulanan`), sehingga tombol panah filter langsung tersedia di setiap header kolom:

1. Buka file `.xlsx` di Excel, lalu klik **Enable Editing** jika muncul Protected View.
2. Klik panah filter pada header kolom (mis. **Kategori** atau **Kondisi**).
3. Pilih nilai yang ingin ditampilkan, atau gunakan **Text Filters / Number Filters**.
4. Klik **Clear Filter** untuk menampilkan semua baris lagi.

Baris **TOTAL** sengaja diletakkan **di luar tabel** agar angkanya tidak ikut tersaring saat filter dipakai.

## Kustomisasi Cepat

Buka `assets/js/app.js` di bagian atas:

```js
const KATEGORI_UMUM = ['Elektronik', 'Furnitur', ...]; // saran kategori
const SATUAN_UMUM   = ['Unit', 'Buah', 'Set', ...];    // saran satuan
const PAGE_SIZE     = 8;                               // jumlah baris per halaman
const REPORT_WEEKS  = 8;                               // jumlah minggu di dashboard
const REPORT_MONTHS = 6;                               // jumlah bulan di dashboard
const CONTOH        = [ ... ];                         // isi tombol "Muat contoh data"
```

Warna tema diatur melalui variabel CSS di bagian atas `assets/css/style.css` (`:root` untuk tema terang, `[data-theme="dark"]` untuk tema gelap).

## Format Data per Aset

```json
{
  "id": "uuid",
  "kode": "AST-001",
  "nama": "Laptop Lenovo ThinkPad E14",
  "kategori": "Inventaris IT",
  "jumlah": 6,
  "satuan": "Unit",
  "kondisi": "Baik",
  "lokasi": "Ruang IT Lt. 2",
  "tanggal": "2024-02-12",
  "harga": 12500000,
  "keterangan": "Catatan tambahan",
  "createdAt": "2026-01-01T10:00:00.000Z",
  "updatedAt": "2026-01-01T10:00:00.000Z"
}
```

Nilai total aset dihitung otomatis: `jumlah × harga`.

## Pintasan Keyboard

- `Ctrl + K` — fokus ke kolom pencarian
- `Ctrl + Enter` — simpan form tambah/edit aset
- `Esc` — menutup modal/menu yang sedang terbuka (form dengan perubahan belum disimpan akan meminta konfirmasi)
