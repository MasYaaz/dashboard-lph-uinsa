import postgres from 'postgres';
import { neon } from '@neondatabase/serverless';
import { DATABASE_URL } from '$app/env/private';

const connectionString = DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/hargapas';

const isProduction = process.env.NODE_ENV === 'production' || !!process.env.NETLIFY;
const isNeon = connectionString.includes('neon.tech');

type SqlRowValue = string | number | boolean | null | Date | object;
type GenericRow = Record<string, SqlRowValue>;

function camelize(str: string): string {
	return str.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

function mapRowsToCamel<T>(rows: unknown[]): T {
	if (!Array.isArray(rows)) return rows as T;

	const mapped = rows.map((row) => {
		if (typeof row !== 'object' || row === null) return row;
		const newObj: GenericRow = {};
		for (const key of Object.keys(row as GenericRow)) {
			newObj[camelize(key)] = (row as GenericRow)[key];
		}
		return newObj;
	});

	Object.defineProperty(mapped, 'count', {
		value: rows.length,
		writable: true,
		enumerable: false
	});

	return mapped as T;
}

// Standard Postgres TCP Client
const standardSql = postgres(connectionString, {
	max: isProduction ? 1 : 10,
	idle_timeout: isProduction ? 1 : 20,
	connect_timeout: 2,
	transform: {
		...postgres.toCamel
	}
});

// Neon Cloud HTTP Client
const neonSql = isNeon ? neon(connectionString) : null;

// Tipe Sql generik tunggal yang mengekspos signature fungsi template literal secara aman
export type CustomSql = postgres.Sql;

export const sql: CustomSql = isNeon
	? (async function <T = GenericRow[]>(strings: TemplateStringsArray, ...values: SqlRowValue[]) {
			const rows = await neonSql!(strings, ...values);
			return mapRowsToCamel<T>(rows as unknown[]);
		} as unknown as CustomSql)
	: (standardSql as unknown as CustomSql);

let pgAvailableCache: { ok: boolean; checkedAt: number } | null = null;
const PG_CACHE_TTL_MS = 15_000;

export async function checkDbConnection(): Promise<{ ok: boolean; message?: string }> {
	const now = Date.now();
	if (pgAvailableCache && now - pgAvailableCache.checkedAt < PG_CACHE_TTL_MS) {
		return { ok: pgAvailableCache.ok };
	}
	try {
		await sql`SELECT 1 FROM stores LIMIT 1`;
		pgAvailableCache = { ok: true, checkedAt: now };
		return { ok: true };
	} catch (err: unknown) {
		pgAvailableCache = { ok: false, checkedAt: now };
		const errorMessage = err instanceof Error ? err.message : 'Database connection error';
		return { ok: false, message: errorMessage };
	}
}

export async function isPostgresAvailable(): Promise<boolean> {
	const res = await checkDbConnection();
	return res.ok;
}

export default sql;
