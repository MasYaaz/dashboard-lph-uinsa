import postgres from 'postgres';
import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';

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

const sql = postgres(connectionString, {
	max: 1,
	connect_timeout: 10,
	onnotice: () => {}
});

async function runSeed() {
	let exitCode = 0;
	try {
		console.log('🌱 Generating dynamic password hashes...');

		const adminHash = await bcrypt.hash('admin123', 10);
		const bendaharaHash = await bcrypt.hash('bendahara123', 10);

		console.log('🌱 Seeding database...');

		// Clean & Insert Users
		await sql`TRUNCATE TABLE users RESTART IDENTITY CASCADE;`;

		await sql`
			INSERT INTO users (nama_lengkap, username, password_hash, role)
			VALUES
				('Staf Administrasi', 'admin', ${adminHash}, 'ADMINISTRASI'::role_login_enum),
				('Staf Bendahara', 'bendahara', ${bendaharaHash}, 'BENDAHARA'::role_login_enum);
		`;

		// Clean & Insert Petugas Field
		await sql`TRUNCATE TABLE petugas_field RESTART IDENTITY CASCADE;`;

		await sql`
			INSERT INTO petugas_field (nama_petugas, kontak, peran)
			VALUES
				('Ahmad Faiq Dzikri', '081234567890', 'AUDITOR'),
				('Ahmad Khoirurrohman', '081987654321', 'AUDITOR'),
				('Alfian Ibnu', '081122334455', 'DEWAN_SYARIAH');
		`;

		console.log('✅ Sample data seeded successfully.');
	} catch (error: any) {
		exitCode = 1;
		console.error('\n❌ Seeding failed:');
		console.error(error?.message || error);
	} finally {
		await sql.end({ timeout: 5 });
		process.exit(exitCode);
	}
}

runSeed();
