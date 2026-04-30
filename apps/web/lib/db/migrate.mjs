// Plain-JS migration runner used by the Docker image at startup.
// Mirrors migrate.ts but doesn't need tsx — invoked as `node migrate.mjs`
// from inside the Next.js standalone output, where better-sqlite3 and
// drizzle-orm are already traced into node_modules.
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
