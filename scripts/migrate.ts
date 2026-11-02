import postgres from 'postgres';
import fs from 'node:fs';
import path from 'node:path';

// Helper untuk membaca .env secara manual
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

        // Hapus tanda kutip jika ada
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
  onnotice: () => {} // abaikan notice dari DB
});

async function runMigration() {
  let exitCode = 0;

  try {
    console.log('🚀 Running Schema Migration...');
    const schemaPath = path.resolve(process.cwd(), 'scripts/schema.sql');

    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at: ${schemaPath}`);
    }

    // Eksekusi DDL Skema Utama
    await sql.file(schemaPath);
    console.log('✅ Schema migration applied successfully.');

    // Jalankan seeding jika flag --seed diberikan
    const shouldSeed = process.argv.includes('--seed');
    if (shouldSeed) {
      console.log('🌱 Seeding database with sample data...');
      const seedPath = path.resolve(process.cwd(), 'scripts/seed.sql');

      if (!fs.existsSync(seedPath)) {
        throw new Error(`Seed file not found at: ${seedPath}`);
      }

      await sql.file(seedPath);
      console.log('✅ Sample data seeded successfully.');
    }

    console.log('🎉 Database setup complete!');
  } catch (error: any) {
    exitCode = 1;
    console.error('\n❌ Migration failed:');

    if (error?.code === '28P01') {
      console.error('👉 Authentication error: Invalid username or password in DATABASE_URL.');
      console.error(
        '   Please check your credentials in .env (e.g. DATABASE_URL=postgres://user:password@localhost:5432/dbname)'
      );
    } else if (error?.code === '3D000') {
      console.error(
        '👉 Database does not exist: Please create the database first (e.g. createdb dashboard_db).'
      );
    } else if (error?.code === 'ECONNREFUSED') {
      console.error(
        '👉 Connection refused: PostgreSQL server is not running on the specified host/port.'
      );
    } else {
      console.error(error?.message || error);
    }
  } finally {
    // Pastikan koneksi ditutup secara bersih sebelum proses Node.js dihentikan
    await sql.end({ timeout: 5 });
    process.exit(exitCode);
  }
}

runMigration();
