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

### Tabel dan kolom yang digunakan per halaman

Daftar ini mencakup kolom `SELECT`, kunci/filter, serta kolom `INSERT` dan `UPDATE` yang digunakan handler. Setiap route `/dashboard/*` juga membaca `users.id_user`, `nama_lengkap`, `username`, `role`, dan `is_active` melalui layout dashboard.

| Route | Tabel dan kolom yang digunakan |
| --- | --- |
| `/` | Tidak mengakses tabel database. |
| `/login` | `users`: `id_user`, `nama_lengkap`, `username`, `password_hash`, `role`, `is_active`, `last_login`. |
| `/dashboard` | `pelaku_usaha`: `id_daftar`, `nama_pelaku_usaha`, `jumlah_produk`, `jumlah_outlet`, `alamat_outlet`, `jarak_dari_pusat_kota`, `kontak_penyelia`.<br>`permohonan_audit`: `id_permohonan`, `id_daftar`, `tanggal_permohonan`.<br>`penugasan`: `id_penugasan`, `id_permohonan`, `kebutuhan_jumlah_auditor`, `status_penugasan`.<br>`keuangan_audit`: `id_keuangan`, `id_permohonan`, `no_invoice`, `total_tagihan`, `status_keuangan`, `created_at`.<br>`detail_penugasan_petugas`: `id_penugasan`, `id_petugas`.<br>`petugas_field`: `id_petugas`, `nama_petugas`, `peran`.<br>`detail_keuangan_audit`: `id_detail_keuangan`, `id_keuangan`. |
| `/dashboard/pelaku-usaha` | `pelaku_usaha`: `id_daftar`, `nama_pelaku_usaha`, `jumlah_produk`, `jumlah_outlet`, `alamat_outlet`, `jarak_dari_pusat_kota`, `kontak_penyelia`, `created_at`.<br>`permohonan_audit`: `id_permohonan`, `id_daftar`.<br>`keuangan_audit`, `penugasan`: `id_permohonan` untuk penghapusan data terkait. |
| `/dashboard/pelaku-usaha/new` | `pelaku_usaha`: `id_daftar`, `nama_pelaku_usaha`, `jumlah_produk`, `jumlah_outlet`, `alamat_outlet`, `jarak_dari_pusat_kota`, `kontak_penyelia`, `created_by`.<br>`permohonan_audit`: `id_daftar`. |
| `/dashboard/pelaku-usaha/[id]/edit` | `pelaku_usaha`: `id_daftar`, `nama_pelaku_usaha`, `jumlah_produk`, `jumlah_outlet`, `alamat_outlet`, `jarak_dari_pusat_kota`, `kontak_penyelia`, `updated_at`. |
| `/dashboard/penugasan` | `penugasan`: `id_penugasan`, `id_permohonan`, `tanggal_penugasan`, `status_penugasan`.<br>`permohonan_audit`: `id_permohonan`, `id_daftar`.<br>`pelaku_usaha`: `id_daftar`, `nama_pelaku_usaha`.<br>`detail_penugasan_petugas`: `id_penugasan`, `id_petugas`.<br>`petugas_field`: `id_petugas`, `nama_petugas`, `peran`. |
| `/dashboard/penugasan/new` | `permohonan_audit`: `id_permohonan`, `id_daftar`, `tanggal_permohonan`.<br>`pelaku_usaha`: `id_daftar`, `nama_pelaku_usaha`, `jumlah_produk`, `jumlah_outlet`, `alamat_outlet`, `jarak_dari_pusat_kota`, `kontak_penyelia`.<br>`penugasan`: `id_penugasan`, `id_permohonan`, `tanggal_penugasan`, `kebutuhan_jumlah_auditor`, `status_penugasan`, `assigned_by`.<br>`petugas_field`: `id_petugas`, `nama_petugas`, `peran`, `kontak`, `is_active`, `created_at`.<br>`detail_penugasan_petugas`: `id_penugasan`, `id_petugas`. |
| `/dashboard/penugasan/[id]/edit` | `penugasan`: `id_penugasan`, `id_permohonan`, `tanggal_penugasan`, `kebutuhan_jumlah_auditor`, `updated_at`.<br>`permohonan_audit`: `id_permohonan`, `id_daftar`, `tanggal_permohonan`.<br>`pelaku_usaha`: `id_daftar`, `nama_pelaku_usaha`, `jumlah_produk`, `jumlah_outlet`, `alamat_outlet`, `jarak_dari_pusat_kota`, `kontak_penyelia`.<br>`detail_penugasan_petugas`: `id_penugasan`, `id_petugas`.<br>`petugas_field`: `id_petugas`, `nama_petugas`, `peran`, `kontak`, `is_active`, `created_at`. |
| `/dashboard/petugas` | `petugas_field`: `id_petugas`, `nama_petugas`, `peran`, `kontak`, `is_active`, `created_at`. |
| `/dashboard/petugas/tambah` | `petugas_field`: `nama_petugas`, `peran`, `kontak`, `is_active`. |
| `/dashboard/petugas/[id]/edit` | `petugas_field`: `id_petugas`, `nama_petugas`, `peran`, `kontak`, `is_active`. |
| `/dashboard/tagihan` | `keuangan_audit`: `id_keuangan`, `id_permohonan`, `no_invoice`, `total_tagihan`, `status_keuangan`, `verified_by`, `updated_at`, `created_at`.<br>`permohonan_audit`: `id_permohonan`, `id_daftar`.<br>`pelaku_usaha`: `id_daftar`, `nama_pelaku_usaha`.<br>`detail_keuangan_audit`: `id_detail_keuangan`, `id_keuangan`, `jenis_transaksi`, `keterangan`, `jumlah_uang`, `created_at`. |
| `/dashboard/tagihan/new` | `permohonan_audit`: `id_permohonan`, `id_daftar`.<br>`pelaku_usaha`: `id_daftar`, `nama_pelaku_usaha`.<br>`keuangan_audit`: `id_keuangan`, `id_permohonan`, `no_invoice`, `total_tagihan`, `status_keuangan`, `created_by`.<br>`detail_keuangan_audit`: `id_keuangan`, `jenis_transaksi`, `jumlah_uang`, `keterangan`. |
| `/dashboard/tagihan/[id]/edit` | `keuangan_audit`: `id_keuangan`, `id_permohonan`, `no_invoice`, `status_keuangan`, `total_tagihan`, `updated_at`.<br>`permohonan_audit`: `id_permohonan`, `id_daftar`.<br>`pelaku_usaha`: `id_daftar`, `nama_pelaku_usaha`.<br>`detail_keuangan_audit`: `id_detail_keuangan`, `id_keuangan`, `jenis_transaksi`, `jumlah_uang`, `keterangan`. |
| `/dashboard/migrasi` | `petugas_field`: `id_petugas`, `nama_petugas`, `peran`.<br>`permohonan_audit`: `id_permohonan`, `id_daftar`, `tanggal_permohonan`.<br>`pelaku_usaha`: `id_daftar`, `nama_pelaku_usaha`, `jumlah_produk`, `jumlah_outlet`, `alamat_outlet`, `jarak_dari_pusat_kota`, `kontak_penyelia`, `created_by`, `updated_at`.<br>`penugasan`: `id_penugasan`, `id_permohonan`, `tanggal_penugasan`, `kebutuhan_jumlah_auditor`, `status_penugasan`, `assigned_by`, `updated_at`.<br>`detail_penugasan_petugas`: `id_penugasan`, `id_petugas`.<br>`keuangan_audit`: `id_keuangan`, `id_permohonan`, `no_invoice`, `total_tagihan`, `status_keuangan`, `created_by`, `updated_at`.<br>`detail_keuangan_audit`: `id_keuangan`, `jenis_transaksi`, `jumlah_uang`, `keterangan`. |
| `/api/template-excel`, `/api/hitung-jarak`, `/api/logout` | Tidak mengakses tabel database. |

Penghapusan pelaku usaha atau invoice juga dapat menghapus data detail melalui aturan `ON DELETE CASCADE` di database.

### Kolom pada setiap tabel

Daftar berikut mengikuti skema yang dibuat oleh `scripts/migrate.ts`. Penanda `PK` berarti primary key, sedangkan `FK` berarti foreign key.

| Tabel | Kolom |
| --- | --- |
| `users` | `id_user` SERIAL (PK), `nama_lengkap` VARCHAR(150), `username` VARCHAR(50), `password_hash` VARCHAR(255), `role` role_login_enum, `is_active` BOOLEAN, `last_login` TIMESTAMP, `created_at` TIMESTAMP, `updated_at` TIMESTAMP |
| `petugas_field` | `id_petugas` SERIAL (PK), `nama_petugas` VARCHAR(150), `kontak` VARCHAR(50), `peran` VARCHAR(50), `is_active` BOOLEAN, `created_at` TIMESTAMP |
| `pelaku_usaha` | `id_daftar` VARCHAR(50) (PK), `nama_pelaku_usaha` VARCHAR(255), `jumlah_produk` INT, `jumlah_outlet` INT, `alamat_outlet` TEXT, `jarak_dari_pusat_kota` NUMERIC(8,2), `kontak_penyelia` VARCHAR(30), `created_by` INT (FK ke `users.id_user`), `created_at` TIMESTAMP, `updated_at` TIMESTAMP |
| `permohonan_audit` | `id_permohonan` SERIAL (PK), `id_daftar` VARCHAR(50) (FK ke `pelaku_usaha.id_daftar`), `tanggal_permohonan` DATE, `created_at` TIMESTAMP |
| `penugasan` | `id_penugasan` SERIAL (PK), `id_permohonan` INT (FK ke `permohonan_audit.id_permohonan`), `tanggal_penugasan` DATE, `kebutuhan_jumlah_auditor` INT, `status_penugasan` status_penugasan_enum, `assigned_by` INT (FK ke `users.id_user`), `created_at` TIMESTAMP, `updated_at` TIMESTAMP |
| `detail_penugasan_petugas` | `id_detail` SERIAL (PK), `id_penugasan` INT (FK ke `penugasan.id_penugasan`), `id_petugas` INT (FK ke `petugas_field.id_petugas`) |
| `keuangan_audit` | `id_keuangan` SERIAL (PK), `id_permohonan` INT (FK ke `permohonan_audit.id_permohonan`), `no_invoice` VARCHAR(100), `total_tagihan` NUMERIC(12,2), `status_keuangan` status_keuangan_enum, `catatan_revisi` TEXT, `created_by` INT (FK ke `users.id_user`), `verified_by` INT (FK ke `users.id_user`), `created_at` TIMESTAMP, `updated_at` TIMESTAMP |
| `detail_keuangan_audit` | `id_detail_keuangan` SERIAL (PK), `id_keuangan` INT (FK ke `keuangan_audit.id_keuangan`), `jenis_transaksi` jenis_transaksi_enum, `keterangan` VARCHAR(255), `jumlah_uang` NUMERIC(12,2), `created_at` TIMESTAMP |

Nilai enum yang digunakan:

- `role_login_enum`: `ADMINISTRASI`, `BENDAHARA`
- `status_penugasan_enum`: `PENDING`, `ASSIGNED`, `REASSIGNED`
- `status_keuangan_enum`: `DRAFT`, `SIAP_VERIFIKASI`, `DITERIMA`, `REVISI`
- `jenis_transaksi_enum`: `TRANSPORT_TALANGAN`, `UH_PENGINAPAN`, `BIAYA_LPH`, `INPUT_SISTEM`, `TENTATIVE_LAPANGAN`, `TAGIHAN_FINAL`, `BIAYA_LAIN`

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
