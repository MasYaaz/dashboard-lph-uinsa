import postgres from 'postgres';
import fs from 'node:fs';
import path from 'node:path';

function loadEnv() {
	const envPath = path.resolve(process.cwd(), '.env');
	if (fs.existsSync(envPath)) {
		const envContent = fs.readFileSync(envPath, 'utf-8');
		for (const line of envContent.split('\n')) {
			const trimmed = line.trim();
			if (!trimmed || trimmed.startsWith('#')) continue;
			const eqIdx = trimmed.indexOf('=');
			if (eqIdx !== -1) {
				const key = trimmed.slice(0, eqIdx).trim();
				let value = trimmed.slice(eqIdx + 1).trim();
				value = value.replace(/(^['"]|['"]$)/g, '');
				if (!process.env[key]) {
					process.env[key] = value;
				}
			}
		}
	}
}

loadEnv();

const connectionString =
	process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/dashboard_db';

console.log('🔄 Connecting to PostgreSQL:', connectionString.replace(/:[^:@]+@/, ':****@'));

const sql = postgres(connectionString, {
	max: 1,
	connect_timeout: 10,
	onnotice: () => {}
});

async function runMigration() {
	let exitCode = 0;
	try {
		console.log('🚀 Running Schema Migration...');

		await sql.unsafe(`
			-- =============================================================================
			-- 1. DROP TABEL LAMA (Reset Skema Bersih)
			-- =============================================================================
			DROP TABLE IF EXISTS keuangan_audit CASCADE;
			DROP TABLE IF EXISTS detail_penugasan_petugas CASCADE;
			DROP TABLE IF EXISTS penugasan CASCADE;
			DROP TABLE IF EXISTS permohonan_audit CASCADE;
			DROP TABLE IF EXISTS pelaku_usaha CASCADE;
			DROP TABLE IF EXISTS petugas_field CASCADE;
			DROP TABLE IF EXISTS users CASCADE;

			DROP TYPE IF EXISTS jenis_transaksi_enum CASCADE;
			DROP TYPE IF EXISTS status_keuangan_enum CASCADE;
			DROP TYPE IF EXISTS status_penugasan_enum CASCADE;
			DROP TYPE IF EXISTS role_login_enum CASCADE;

			-- =============================================================================
			-- 2. CREATE ENUM TYPES
			-- =============================================================================
			CREATE TYPE role_login_enum AS ENUM ('ADMINISTRASI', 'BENDAHARA');
			CREATE TYPE status_penugasan_enum AS ENUM ('PENDING', 'ASSIGNED', 'REASSIGNED');
			CREATE TYPE status_keuangan_enum AS ENUM ('DRAFT', 'SIAP_VERIFIKASI', 'DITERIMA', 'REVISI');

			CREATE TYPE jenis_transaksi_enum AS ENUM (
				'TRANSPORT_TALANGAN',
				'UH_PENGINAPAN',
				'BIAYA_LPH',
				'INPUT_SISTEM',
				'TENTATIVE_LAPANGAN',
				'TAGIHAN_FINAL',
				'BIAYA_LAIN'
			);

			-- =============================================================================
			-- 3. TABEL INDUK UTAMA
			-- =============================================================================
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
			CREATE TABLE pelaku_usaha (
				id_daftar VARCHAR(50) PRIMARY KEY,
				nama_pelaku_usaha VARCHAR(255) NOT NULL,
				jumlah_produk INT DEFAULT 0,
				jumlah_outlet INT DEFAULT 0,
				alamat_outlet TEXT NOT NULL,
				jarak_dari_pusat_kota NUMERIC(8,2) NOT NULL,
				kontak_penyelia VARCHAR(30) NOT NULL,
				created_by INT REFERENCES users(id_user),
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			);

			CREATE TABLE permohonan_audit (
				id_permohonan SERIAL PRIMARY KEY,
				id_daftar VARCHAR(50) REFERENCES pelaku_usaha(id_daftar) ON DELETE RESTRICT,
				tanggal_permohonan DATE DEFAULT CURRENT_DATE,
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			);

			CREATE TABLE penugasan (
				id_penugasan SERIAL PRIMARY KEY,
				id_permohonan INT REFERENCES permohonan_audit(id_permohonan) ON DELETE CASCADE,
				kebutuhan_jumlah_auditor INT NOT NULL,
				status_penugasan status_penugasan_enum DEFAULT 'ASSIGNED',
				assigned_by INT REFERENCES users(id_user),
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			);

			CREATE TABLE detail_penugasan_petugas (
				id_detail SERIAL PRIMARY KEY,
				id_penugasan INT REFERENCES penugasan(id_penugasan) ON DELETE CASCADE,
				id_petugas INT REFERENCES petugas_field(id_petugas) ON DELETE RESTRICT
			);

			-- =============================================================================
			-- REFACTOR: MENGUBAH KEUANGAN AUDIT MENJADI HEADER & DETAIL
			-- =============================================================================

			-- 1. Tabel Header Invoice/Tagihan
			CREATE TABLE keuangan_audit (
        id_keuangan SERIAL PRIMARY KEY,
        id_permohonan INT REFERENCES permohonan_audit(id_permohonan) ON DELETE CASCADE,
        no_invoice VARCHAR(100) UNIQUE NOT NULL, -- Di-set UNIQUE agar tidak terduplikasi
        total_tagihan NUMERIC(12,2) NOT NULL DEFAULT 0.00,
        status_keuangan status_keuangan_enum DEFAULT 'DRAFT',
        catatan_revisi TEXT,
        created_by INT REFERENCES users(id_user),
        verified_by INT REFERENCES users(id_user),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			);

			-- 2. Tabel Detail Rincian Item Pembayaran
			CREATE TABLE detail_keuangan_audit (
        id_detail_keuangan SERIAL PRIMARY KEY,
        id_keuangan INT REFERENCES keuangan_audit(id_keuangan) ON DELETE CASCADE,
        jenis_transaksi jenis_transaksi_enum NOT NULL,
        keterangan VARCHAR(255), -- Opsional: Catatan per rincian biaya
        jumlah_uang NUMERIC(12,2) NOT NULL DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			);
		`);

		console.log('✅ Schema migration applied successfully.');
	} catch (error: any) {
		exitCode = 1;
		console.error('\n❌ Migration failed:');
		console.error(error?.message || error);
	} finally {
		await sql.end({ timeout: 5 });
		process.exit(exitCode);
	}
}

runMigration();
