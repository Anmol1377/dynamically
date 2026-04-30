import Database from 'better-sqlite3';
import { resolve } from 'node:path';
import { sha256 } from '@oslojs/crypto/sha2';
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from '@oslojs/encoding';

const dbPath = resolve(process.cwd(), process.env.DATABASE_URL ?? './data/dynamically.db');
const sqlite = new Database(dbPath);

const user = sqlite.prepare("SELECT id FROM users WHERE email = 'test@example.com'").get() as
  | { id: string }
  | undefined;
if (!user) {
  console.error('test user not found — run seed-test-admin first');
  process.exit(1);
}

const bytes = new Uint8Array(20);
crypto.getRandomValues(bytes);
const token = encodeBase32LowerCaseNoPadding(bytes);
const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
const expiresAt = Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000);

sqlite
  .prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)')
  .run(sessionId, user.id, expiresAt);

console.log(token);
sqlite.close();
