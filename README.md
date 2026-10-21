# 🎓 Repositori Akademik Kampus (UNSIKA)

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

Platform arsip materi perkuliahan terpusat berbasis web yang dirancang khusus untuk civitas akademika. Aplikasi ini mempermudah mahasiswa dalam mengakses dokumen akademik berdasarkan semester dan tahun ajaran, sekaligus melindungi hak cipta materi kuliah melalui *protected online-only viewer*.

---

## 📑 Daftar Isi
- [Fitur Utama](#-fitur-utama)
- [Matriks Hak Akses](#-matriks-hak-akses-role-matrix)
- [Teknologi yang Digunakan](#-teknologi-yang-digunakan)
- [Struktur Direktori](#-struktur-direktori)
- [Panduan Instalasi & Menjalankan](#-panduan-instalasi--menjalankan)
- [Konfigurasi Basis Data (Supabase)](#-konfigurasi-basis-data-supabase)
- [Keamanan & Proteksi Dokumen](#-keamanan--proteksi-dokumen)

---

## 🌟 Fitur Utama

### 🎓 Mahasiswa & Pengunjung (Guest)
- **Domain Whitelist Kampus:** Pendaftaran dan login eksklusif untuk akun resmi institusi (`@unsika.ac.id` / `@student.unsika.ac.id`) divalidasi hingga level trigger database.
- **Navigasi Bertingkat (Mother Button UI):** Pemilihan materi interaktif dari kartu mata kuliah menuju modal pemilihan tahun ajaran.
- **Pencarian & Filter Cepat:** Temukan materi seketika dengan pencarian instan dan filter semester 1 hingga 8.
- **Pembaca Materi Terproteksi (Protected Reader):** 
  - Penampil PDF bebas unduh (*no direct download/print*).
  - Akses file berbasis *Temporary Signed URL* (kedaluwarsa dalam 60 menit).
  - *Dynamic Watermark* berisi Nama Mahasiswa, NPM, dan Timestamp untuk mencegah pembajakan screenshot.
- **Bookmark & Riwayat Baca:** Simpan materi favorit dan rekam riwayat bacaan yang otomatis terintegrasi.
- **Activity Switcher 3D:** Animasi transisi otomatis antara navigasi Bookmark dan Riwayat pada bilah navigasi.
- **Mode Gelap & Terang (Dark / Light Theme):** Personalisasi tema visual terpusat yang tersimpan di `localStorage`.

### 🛡️ Administrator Panel
- **Manajemen Materi (CRUD):** Tambah materi baru dengan berkas PDF, edit metadata, dan penghapusan berkas fisik di storage yang sinkron dengan database.
- **Manajemen Pengguna:** Audit akun civitas akademika, ubah role pengguna (Mahasiswa ⇄ Admin), aktivasi/suspend akun, hingga penghapusan akun.
- **Prioritas Monitoring Akun:** Akun non-aktif secara otomatis diprioritaskan di urutan teratas tabel untuk kemudahan audit.

---

## 👥 Matriks Hak Akses (Role Matrix)

| Fitur / Halaman | Pengunjung (Guest) | Mahasiswa | Administrator |
| :--- | :---: | :---: | :---: |
| **Katalog Mata Kuliah & Semester** | View Only | View | Full Access |
| **Pencarian & Filter Semester** | ✅ | ✅ | ✅ |
| **Akses File Materi (`reader.html`)** | ❌ *(Redirect Login)* | ✅ *(Watermarked)* | ✅ *(View & Edit)* |
| **Bookmark Materi** | ❌ | ✅ | ✅ |
| **Riwayat Baca** | ❌ | ✅ | ✅ |
| **Panel Admin (`admin-dashboard.html`)** | ❌ *(Blocked)* | ❌ *(Blocked)* | ✅ |
| **Unggah / Hapus Berkas Materi** | ❌ | ❌ | ✅ |
| **Manajemen Pengguna** | ❌ | ❌ | ✅ |

---

## 💻 Teknologi yang Digunakan

- **Frontend:** Vanilla HTML5, Modern CSS3 (Variables, Flexbox, Grid), JavaScript ES6+
- **Backend-as-a-Service (BaaS):** [Supabase](https://supabase.com)
  - **Auth:** Manajemen sesi dan pendaftaran pengguna
  - **PostgreSQL:** Basis data relasional dengan Row Level Security (RLS)
  - **Storage:** Private bucket untuk penyimpanan berkas PDF materi
  - **Triggers & RPC:** Validasi domain otomatis dan perhitungan agregat view

---

## 📁 Struktur Direktori

```text
ProjectSC/
├── CBCBproject/
│   ├── CSS/
│   │   ├── admin.css              # Styling halaman admin & manajemen
│   │   ├── auth.css               # Styling halaman autentikasi (login/register)
│   │   ├── history-bookmarks.css  # Styling halaman riwayat dan bookmark
│   │   └── style.css              # Styling utama, tema global, & katalog
│   ├── JS/
│   │   ├── admin.js               # Logika CRUD materi dan manajemen user
│   │   ├── app.js                 # Logika katalog, modal tahun, & filter
│   │   ├── auth.js                # Penanganan autentikasi & validasi kampus
│   │   ├── history-bookmarks.js   # Logika pemuatan bookmark dan history
│   │   └── utils.js               # Konfigurasi Supabase, sanitize XSS, & tema
│   └── html/
│       ├── admin-dashboard.html   # Halaman kontrol administrator
│       ├── history-bookmarks.html # Halaman daftar riwayat & bookmark
│       ├── index.html             # Beranda & katalog mata kuliah utama
│       ├── login.html             # Halaman masuk & pendaftaran civitas
│       ├── materials.html         # Daftar berkas materi per mata kuliah
│       └── reader.html            # Penampil PDF terproteksi dengan watermark
├── supabase-scheme.sql            # Skema lengkap SQL, RLS, Trigger, & RPC
└── README.md                      # Dokumentasi repositori
```

---

## 🚀 Panduan Instalasi & Menjalankan

### 1. Kloning Repositori
```bash
git clone https://github.com/ajinurmjd-dev/RepoKampus.git
cd RepoKampus
```

### 2. Konfigurasi Supabase
1. Buat project baru di [Supabase Dashboard](https://supabase.com).
2. Masuk ke menu **SQL Editor**, salin seluruh isi berkas [`supabase-scheme.sql`](supabase-scheme.sql), lalu jalankan (**Run**).
3. Buat bucket penyimpanan privat di menu **Storage** bernama `materials` (Private Bucket).
4. Buka file [`CBCBproject/JS/utils.js`](CBCBproject/JS/utils.js) dan masukkan URL & Anon Key Supabase Anda:
   ```javascript
   const SUPABASE_URL = "https://YOUR_PROJECT_ID.supabase.co";
   const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
   ```

### 3. Menjalankan Aplikasi
Karena project ini dibangun menggunakan arsitektur Vanilla Web murni, Anda dapat menjalankannya langsung menggunakan web server statis:
- **VS Code Live Server:** Klik kanan pada `CBCBproject/html/index.html` lalu pilih **"Open with Live Server"**.
- **Atau menggunakan `npx serve`:**
  ```bash
  npx serve CBCBproject
  ```

---

## 🔒 Keamanan & Proteksi Dokumen

1. **Row Level Security (RLS):** Mahasiswa hanya dapat membaca dan memodifikasi riwayat serta bookmark miliknya sendiri (`auth.uid() = user_id`).
2. **Anti Role-Escalation:** Trigger PostgreSQL `protect_profile_roles` memblokir pengubahan kolom `role` melalui manipulasi API konsol klien.
3. **Penyimpanan Privat (No Public URL):** Berkas materi diunggah ke private storage bucket dan hanya dapat diakses melalui token sementara (*Signed URL*) berdurasi terbatas.
4. **Sanitasi XSS:** Seluruh data yang di-render secara dinamis melewati fungsi pengaman `escapeHtml()`.

---

## 👨‍💻 Kontribusi & Pengembang

Dikembangkan untuk kebutuhan arsip dan repositori perkuliahan civitas akademika **Universitas Singaperbangsa Karawang (UNSIKA)**.

