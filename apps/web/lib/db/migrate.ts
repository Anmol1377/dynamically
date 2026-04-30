import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const dbPath = resolve(process.cwd(), process.env.DATABASE_URL ?? './data/dynamically.db');
mkdirSync(dirname(dbPath), { recursive: true });

const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

const db = drizzle(sqlite);

console.log(`[migrate] running migrations against ${dbPath}`);
migrate(db, { migrationsFolder: resolve(process.cwd(), 'lib/db/migrations') });
console.log('[migrate] done');

sqlite.close();
