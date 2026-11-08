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

async function dropAllTables() {
	let exitCode = 0;
	try {
		console.log('⚠️  Memulai penghapusan seluruh tabel dan tipe data di database...');

		// Menggunakan sql.unsafe untuk mendukung multi-statement SQL sekaligus
		await sql.unsafe(`
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
		`);

		console.log('✅ Seluruh tabel dan tipe ENUM berhasil dihapus dari database.');
	} catch (error: any) {
		exitCode = 1;
		console.error('\n❌ Gagal menghapus tabel dari database:');
		console.error(error?.message || error);
	} finally {
		await sql.end({ timeout: 5 });
		process.exit(exitCode);
	}
}

dropAllTables();
