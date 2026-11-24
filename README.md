<div align="center">
  <img src="./src/lib/assets/light.svg" alt="Logo UINSA" width="88" />

  <h1>Dashboard LPH UINSA</h1>

  <p>Aplikasi internal untuk mengelola data pelaku usaha, penugasan audit, petugas, dan tagihan.</p>
</div>

## Daftar isi

- [Fitur](#fitur)
- [Teknologi](#teknologi)
- [Prasyarat](#prasyarat)
- [Instalasi dan konfigurasi](#instalasi-dan-konfigurasi)
- [Perintah yang tersedia](#perintah-yang-tersedia)
- [Routes](#routes)
- [Struktur proyek](#struktur-proyek)
- [Catatan keamanan dan database](#catatan-keamanan-dan-database)

## Fitur

- Login dengan peran Administrasi dan Bendahara.
- Dashboard ringkasan status permohonan, pencarian, filter status, dan ekspor laporan CSV.
- Pengelolaan data pelaku usaha dan permohonan audit.
- Perhitungan jarak dari UINSA Kampus 1 berdasarkan alamat outlet.
- Pengelolaan penugasan auditor dan dewan syariah.
- Pengelolaan petugas, termasuk status aktif.
- Penerbitan invoice dengan rincian biaya, perubahan invoice, dan konfirmasi pembayaran.
- Impor data dari dua format CSV: pelaku usaha beserta penugasan, serta keuangan audit.
- Unduhan template CSV untuk membantu menyiapkan data migrasi.

## Teknologi

- SvelteKit dan Svelte 5 dengan TypeScript
- Vite dan Tailwind CSS 4
- PostgreSQL melalui `postgres`; koneksi Neon menggunakan `@neondatabase/serverless`
- `bcryptjs` untuk verifikasi kata sandi
- Bun untuk instalasi dependensi dan menjalankan skrip proyek

## Prasyarat

- [Bun](https://bun.sh/) terpasang.
- Database PostgreSQL yang dapat diakses dari lingkungan aplikasi. Proyek dapat menggunakan PostgreSQL biasa atau Neon.
- Git untuk mengambil kode sumber.

## Instalasi dan konfigurasi

1. Ambil kode sumber dan pasang dependensi:

   ```sh
   git clone https://github.com/MasYaaz/dashboard-lph-uinsa.git
   cd dashboard-lph-uinsa
   bun install
   ```

2. Buat database PostgreSQL kosong. Untuk instalasi lokal dengan PostgreSQL CLI:

   ```sh
   createdb dashboard_db
   ```

   Jika database sudah dibuat atau menggunakan Neon, lewati perintah ini.

3. Buat file `.env` di direktori utama proyek dan isi URL database:

   ```dotenv
   DATABASE_URL=postgres://postgres:postgres@localhost:5432/dashboard_db
   ```

   Ganti URL tersebut dengan connection string database Anda. Untuk Neon, gunakan connection string yang diberikan Neon.

4. Buat skema database dan data awal:

   ```sh
   bun run db:migrate
   bun run db:seed
   ```

5. Jalankan aplikasi dalam mode pengembangan:

   ```sh
   bun run dev
   ```

   Buka URL lokal yang ditampilkan Vite di terminal.

### Akun data awal

Skrip seed membuat dua akun untuk pengembangan lokal:

| Peran | Username | Kata sandi |
| --- | --- | --- |
| Administrasi | `admin` | `admin123` |
| Bendahara | `bendahara` | `bendahara123` |

Jangan gunakan kredensial contoh ini di lingkungan produksi.

## Perintah yang tersedia

| Perintah | Kegunaan |
| --- | --- |
| `bun run dev` | Menjalankan server pengembangan. |
| `bun run check` | Menjalankan pemeriksaan tipe dan diagnostik Svelte. |
| `bun run lint` | Memeriksa format Prettier dan aturan ESLint. |
| `bun run build` | Membuat build produksi. |
| `bun run preview` | Menjalankan build produksi secara lokal. |
| `bun run db:migrate` | Menghapus lalu membuat ulang tabel dan tipe database. |
| `bun run db:seed` | Mengisi akun dan petugas contoh. |
| `bun run db:reset` | Menghapus tabel dan tipe database. |
| `bun run db:fresh` | Menjalankan reset, pembuatan skema, lalu seed. |

## Routes

### Halaman

| Metode | Route | Kegunaan |
| --- | --- | --- |
| `GET` | `/` | Mengarahkan pengguna ke dashboard atau halaman login. |
| `GET`, `POST` | `/login` | Menampilkan formulir login dan memproses autentikasi. |
| `GET`, `POST` | `/dashboard` | Menampilkan ringkasan dan menerima aksi ekspor CSV. |
| `GET`, `POST` | `/dashboard/pelaku-usaha` | Menampilkan dan menghapus data pelaku usaha. |
| `GET`, `POST` | `/dashboard/pelaku-usaha/new` | Menampilkan formulir dan menyimpan pelaku usaha baru. |
| `GET`, `POST` | `/dashboard/pelaku-usaha/[id]/edit` | Menampilkan dan menyimpan perubahan data pelaku usaha. |
| `GET`, `POST` | `/dashboard/penugasan` | Menampilkan riwayat dan menghapus penugasan. |
| `GET`, `POST` | `/dashboard/penugasan/new` | Membuat penugasan audit baru. |
| `GET`, `POST` | `/dashboard/penugasan/[id]/edit` | Mengubah tanggal dan anggota penugasan. |
| `GET`, `POST` | `/dashboard/petugas` | Menampilkan petugas dan mengubah status aktifnya. |
| `GET`, `POST` | `/dashboard/petugas/tambah` | Menambahkan petugas. |
| `GET`, `POST` | `/dashboard/petugas/[id]/edit` | Mengubah data petugas. |
| `GET`, `POST` | `/dashboard/tagihan` | Menampilkan invoice, mengonfirmasi pembayaran, dan menghapus invoice. |
| `GET`, `POST` | `/dashboard/tagihan/new` | Menerbitkan invoice beserta rincian biayanya. |
| `GET`, `POST` | `/dashboard/tagihan/[id]/edit` | Mengubah rincian invoice yang belum diterima. |
| `GET`, `POST` | `/dashboard/migrasi` | Meninjau dan mengimpor data CSV. |

`POST` pada halaman dashboard menggunakan named form actions SvelteKit. Aksi bernama yang tersedia antara lain `exportExcel`, `delete`, `tambah`, `update`, `tugaskan`, `toggleActive`, `konfirmasiPembayaran`, `hapusTagihan`, `terbitkanTagihan`, `updateTagihan`, `previewFile`, dan `executeImport`. Beberapa formulir menggunakan aksi `default`.

### API

| Metode | Route | Parameter | Kegunaan |
| --- | --- | --- | --- |
| `GET` | `/api/template-excel` | `table` | Mengunduh template CSV. Nilai yang digunakan: `pelaku_usaha_penugasan` atau `keuangan_audit`. |
| `GET` | `/api/hitung-jarak` | `alamat` | Mencari alamat outlet dan menghitung jarak jalan dari UINSA Kampus 1. |
| `POST` | `/api/logout` | - | Menghapus cookie sesi dan mengarahkan pengguna ke halaman login. |

Perhitungan jarak memakai Photon atau Nominatim untuk pencarian lokasi, lalu OSRM untuk rute jalan. Fitur ini memerlukan koneksi internet.

## Struktur proyek

```text
src/
  lib/
    assets/        Aset gambar dan logo
    server/db.ts   Koneksi PostgreSQL dan Neon
    types.ts       Tipe data aplikasi
  routes/
    api/           Endpoint API
    dashboard/     Halaman dashboard dan pengelolaan data
    login/         Halaman serta aksi autentikasi
scripts/
  migrate.ts       Pembuatan ulang skema database
  seed.ts          Data awal untuk pengembangan
  reset.ts         Penghapusan skema database
```

## Catatan keamanan dan database

> [!WARNING]
> Skrip database bersifat destruktif. `db:migrate` menghapus tabel dan tipe yang ada sebelum membuat skema baru. `db:reset` menghapus skema, sedangkan `db:fresh` menjalankan reset, migrasi, dan seed. Gunakan hanya pada database pengembangan atau pengujian yang datanya boleh dihapus.

`db:seed` juga menjalankan `TRUNCATE ... CASCADE` pada tabel akun dan petugas. Perintah ini dapat menghapus data terkait, jadi jangan jalankan pada database berisi data yang ingin dipertahankan.

Simpan `DATABASE_URL` hanya di `.env` lokal atau secret manager lingkungan deployment. Jangan commit file `.env` atau gunakan akun contoh di produksi.
