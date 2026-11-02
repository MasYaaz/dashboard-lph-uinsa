-- =============================================================================
-- 1. DROP TABEL LAMA (Opsional, gunakan jika ingin reset skema bersih)
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
-- 3. TABEL INDUK UTAMA (HARUS DIJALANKAN PERTAMA)
-- =============================================================================

-- A. Tabel Users (Must be created FIRST before referenced by other tables)
CREATE TABLE users (
    id_user SERIAL PRIMARY KEY,
    nama_lengkap VARCHAR(150) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role role_login_enum NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- B. Tabel Petugas Field
CREATE TABLE petugas_field (
    id_petugas SERIAL PRIMARY KEY,
    nama_petugas VARCHAR(150) NOT NULL,
    kontak VARCHAR(50),
    peran VARCHAR(50) CHECK (peran IN ('AUDITOR', 'DEWAN_SYARIAH')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 4. TABEL TRANSAKSI & PENUGASAN (Merujuk ke users & petugas_field)
-- =============================================================================

-- Pelaku Usaha (Merujuk ke users)
CREATE TABLE pelaku_usaha (
    id_daftar VARCHAR(50) PRIMARY KEY,
    nama_pelaku_usaha VARCHAR(255) NOT NULL,
    produk TEXT NOT NULL,
    outlet TEXT NOT NULL,
    alamat TEXT NOT NULL,
    jarak NUMERIC(8,2) NOT NULL,
    kontak VARCHAR(50) NOT NULL,
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

-- Penugasan (Merujuk ke permohonan_audit & users)
CREATE TABLE penugasan (
    id_penugasan SERIAL PRIMARY KEY,
    id_permohonan INT REFERENCES permohonan_audit(id_permohonan) ON DELETE CASCADE,
    jumlah_kebutuhan_auditor INT NOT NULL,
    status_penugasan status_penugasan_enum DEFAULT 'ASSIGNED',
    assigned_by INT REFERENCES users(id_user),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Detail Penugasan (Merujuk ke penugasan & petugas_field)
CREATE TABLE detail_penugasan_petugas (
    id_detail SERIAL PRIMARY KEY,
    id_penugasan INT REFERENCES penugasan(id_penugasan) ON DELETE CASCADE,
    id_petugas INT REFERENCES petugas_field(id_petugas) ON DELETE RESTRICT
);

-- Keuangan Audit (Merujuk ke permohonan_audit & users)
CREATE TABLE keuangan_audit (
    id_keuangan SERIAL PRIMARY KEY,
    id_permohonan INT REFERENCES permohonan_audit(id_permohonan) ON DELETE CASCADE,
    no_invoice VARCHAR(100) UNIQUE NOT NULL,
    biaya_transportasi NUMERIC(12,2) DEFAULT 0.00,
    biaya_uh_penginapan NUMERIC(12,2) DEFAULT 0.00,
    biaya_operasional_lph NUMERIC(12,2) DEFAULT 0.00,
    penambahan_produk INT DEFAULT 0,
    penambahan_outlet INT DEFAULT 0,
    biaya_tambahan NUMERIC(12,2) DEFAULT 0.00,
    total_biaya NUMERIC(12,2) NOT NULL,
    status_keuangan status_keuangan_enum DEFAULT 'DRAFT',
    catatan_revisi TEXT,
    created_by INT REFERENCES users(id_user),
    verified_by INT REFERENCES users(id_user),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Import Log (Merujuk ke users)
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

-- Log Arsip Historis (Merujuk ke users)
CREATE TABLE log_arsip_historis (
    id_arsip BIGSERIAL PRIMARY KEY,
    id_user INT REFERENCES users(id_user),
    nama_tabel VARCHAR(100) NOT NULL,
    aksi VARCHAR(20) NOT NULL,
    timestamp_kejadian TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    snapshot_data JSONB NOT NULL
);
