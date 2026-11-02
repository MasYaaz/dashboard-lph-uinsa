import postgres from 'postgres';
import { DATABASE_URL } from '$app/env/private';

// Inisialisasi instance singleton connection ke PostgreSQL
export const sql = postgres(
	DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/dashboard_db',
	{
		max: 10, // Maksimum jumlah koneksi dalam pool
		idle_timeout: 20, // Durasi (detik) koneksi idle sebelum ditutup
		connect_timeout: 10, // Timeout (detik) saat mencoba terhubung
		transform: {
			// Menangani pencocokan tipe otomatis jika diperlukan
		}
	}
);
