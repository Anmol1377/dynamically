import 'server-only';
import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import * as schema from './schema';

// Lazy singleton — defers opening SQLite until first DB access.
// This keeps Next.js build-time module evaluation (page-data collection,
// docker buildx + qemu emulation) from triggering native binding loads.
let sqliteInstance: Database.Database | null = null;
let dbInstance: BetterSQLite3Database<typeof schema> | null = null;

function open(): BetterSQLite3Database<typeof schema> {
  if (dbInstance) return dbInstance;

  const dbPath = resolve(process.cwd(), process.env.DATABASE_URL ?? './data/dynamically.db');
  mkdirSync(dirname(dbPath), { recursive: true });

  sqliteInstance = new Database(dbPath);
  sqliteInstance.pragma('journal_mode = WAL');
  sqliteInstance.pragma('foreign_keys = ON');
  sqliteInstance.pragma('synchronous = NORMAL');

  dbInstance = drizzle(sqliteInstance, { schema });
  return dbInstance;
}

// `db` is a Proxy so existing `db.select()...` call sites work unchanged
// — the underlying connection opens on the first method access.
export const db = new Proxy({} as BetterSQLite3Database<typeof schema>, {
  get(_target, prop) {
    return Reflect.get(open(), prop);
  },
});

export { schema };
