-- =============================================================================
-- 1. DROP TABEL LAMA (Reset Skema Bersih)
-- =============================================================================
DROP TABLE IF EXISTS log_arsip_historis CASCADE;
DROP TABLE IF EXISTS import_log CASCADE;
DROP TABLE IF EXISTS keuangan_audit CASCADE;
DROP TABLE IF EXISTS detail_penugasan_petugas CASCADE;
DROP TABLE IF EXISTS penugasan CASCADE;
DROP TABLE IF EXISTS permohonan_audit CASCADE;
DROP TABLE IF EXISTS pelaku_usaha CASCADE;
DROP TABLE IF EXISTS petugas_field CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS status_keuangan_enum CASCADE;
DROP TYPE IF EXISTS status_penugasan_enum CASCADE;
DROP TYPE IF EXISTS role_login_enum CASCADE;

-- =============================================================================
-- 2. CREATE ENUM TYPES
-- =============================================================================
CREATE TYPE role_login_enum AS ENUM ('ADMINISTRASI', 'BENDAHARA');
CREATE TYPE status_penugasan_enum AS ENUM ('PENDING', 'ASSIGNED', 'REASSIGNED');
CREATE TYPE status_keuangan_enum AS ENUM ('DRAFT', 'SIAP_VERIFIKASI', 'DITERIMA', 'REVISI');

-- =============================================================================
-- 3. TABEL INDUK UTAMA
-- =============================================================================

-- A. Tabel Users (Tanpa kolom Email)
CREATE TABLE users (
    id_user SERIAL PRIMARY KEY,
    nama_lengkap VARCHAR(150) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role role_login_enum NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- B. Tabel Petugas Field (Master Nama Auditor & Dewan Syariah - Tanpa Login)
CREATE TABLE petugas_field (
    id_petugas SERIAL PRIMARY KEY,
    nama_petugas VARCHAR(150) NOT NULL,
    kontak VARCHAR(50),
    peran VARCHAR(50) CHECK (peran IN ('AUDITOR', 'DEWAN_SYARIAH')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 4. TABEL TRANSAKSI & DATA UTAMA
-- =============================================================================

-- Pelaku Usaha (Sesuai Data Pelaku Usaha Excel)
CREATE TABLE pelaku_usaha (
    id_daftar VARCHAR(50) PRIMARY KEY,               -- 1. No ID-Daftar
    nama_pelaku_usaha VARCHAR(255) NOT NULL,        -- 2. Nama Pelaku Usaha
    jumlah_produk INT DEFAULT 0,                    -- 3. Jumlah Produk
    jumlah_outlet INT DEFAULT 0,                    -- 4. Jumlah Outlet/Pabrik
    alamat_outlet TEXT NOT NULL,                    -- 5. Alamat Outlet/Pabrik
    jarak_dari_pusat_kota NUMERIC(8,2) NOT NULL,    -- 6. Jarak dari Pusat Kota (km)
    nama_kontak_penyelia VARCHAR(150) NOT NULL,      -- 7. Nama & Kontak Penyelia
    created_by INT REFERENCES users(id_user),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Permohonan Audit
CREATE TABLE permohonan_audit (
    id_permohonan SERIAL PRIMARY KEY,
    id_daftar VARCHAR(50) REFERENCES pelaku_usaha(id_daftar) ON DELETE RESTRICT,
    tanggal_permohonan DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Penugasan (Sesuai Data Internal Excel)
CREATE TABLE penugasan (
    id_penugasan SERIAL PRIMARY KEY,
    id_permohonan INT REFERENCES permohonan_audit(id_permohonan) ON DELETE CASCADE,
    kebutuhan_jumlah_auditor INT NOT NULL,          -- 1. Kebutuhan Jumlah Auditor
    status_penugasan status_penugasan_enum DEFAULT 'ASSIGNED',
    assigned_by INT REFERENCES users(id_user),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Detail Penugasan (Nama Auditor & Dewan Syariah)
CREATE TABLE detail_penugasan_petugas (
    id_detail SERIAL PRIMARY KEY,
    id_penugasan INT REFERENCES penugasan(id_penugasan) ON DELETE CASCADE,
    id_petugas INT REFERENCES petugas_field(id_petugas) ON DELETE RESTRICT  -- 2 & 3. Nama Auditor & Dewan Syariah
);

-- Keuangan Audit (Sesuai Data Keuangan Excel)
CREATE TABLE keuangan_audit (
    id_keuangan SERIAL PRIMARY KEY,
    id_permohonan INT REFERENCES permohonan_audit(id_permohonan) ON DELETE CASCADE,
    no_invoice VARCHAR(100) UNIQUE NOT NULL,         -- 5. Nomor Invoice Penagihan
    biaya_transport_talangan NUMERIC(12,2) DEFAULT 0.00,  -- 1. Biaya Transport utk Talangan
    biaya_uh_penginapan NUMERIC(12,2) DEFAULT 0.00,      -- 2. Biaya UH + Penginapan
    total_biaya_lph NUMERIC(12,2) DEFAULT 0.00,          -- 3. Total Biaya Perhitungan LPH
    biaya_input_sistem NUMERIC(12,2) DEFAULT 0.00,       -- 4. Biaya yang Diinput ke Sistem
    penambahan_produk INT DEFAULT 0,
    penambahan_outlet INT DEFAULT 0,
    biaya_tambahan NUMERIC(12,2) DEFAULT 0.00,       -- 6. Biaya Tambahan (Tentative Lapangan)
    total_biaya_final NUMERIC(12,2) NOT NULL,
    status_keuangan status_keuangan_enum DEFAULT 'DRAFT',
    catatan_revisi TEXT,
    created_by INT REFERENCES users(id_user),
    verified_by INT REFERENCES users(id_user),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Import Log
CREATE TABLE import_log (
    id_log SERIAL PRIMARY KEY,
    nama_berkas VARCHAR(255) NOT NULL,
    baris_ke INT NOT NULL,
    id_daftar_input VARCHAR(50),
    jenis_error VARCHAR(50) CHECK (jenis_error IN ('FORMAT_ERROR', 'DUPLIKAT_ERROR')),
    pesan_error TEXT NOT NULL,
    uploaded_by INT REFERENCES users(id_user),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Log Arsip Historis
CREATE TABLE log_arsip_historis (
    id_arsip BIGSERIAL PRIMARY KEY,
    id_user INT REFERENCES users(id_user),
    nama_tabel VARCHAR(100) NOT NULL,
    aksi VARCHAR(20) NOT NULL,
    timestamp_kejadian TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    snapshot_data JSONB NOT NULL
);
