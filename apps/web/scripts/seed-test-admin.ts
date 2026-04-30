import { hash } from '@node-rs/argon2';
import Database from 'better-sqlite3';
import { resolve } from 'node:path';
import { createId } from '@paralleldrive/cuid2';

async function main() {
  const dbPath = resolve(process.cwd(), process.env.DATABASE_URL ?? './data/dynamically.db');
  const sqlite = new Database(dbPath);
  sqlite.pragma('foreign_keys = ON');

  const email = 'test@example.com';
  const password = 'password123';
  const passwordHash = await hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });

  const existing = sqlite.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    console.log('[seed] user already exists, skipping insert');
  } else {
    sqlite
      .prepare('INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, ?)')
      .run(createId(), email, passwordHash, 'admin');
    console.log(`[seed] created ${email} / ${password}`);
  }

  sqlite
    .prepare(
      'INSERT INTO settings (id, setup_complete) VALUES (1, 1) ON CONFLICT(id) DO UPDATE SET setup_complete = 1'
    )
    .run();
  console.log('[seed] setup_complete = true');

  sqlite.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
