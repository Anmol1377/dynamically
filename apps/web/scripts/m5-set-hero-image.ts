import Database from 'better-sqlite3';
import { resolve } from 'node:path';
import { createId } from '@paralleldrive/cuid2';

const dbPath = resolve(process.cwd(), process.env.DATABASE_URL ?? './data/dynamically.db');
const sqlite = new Database(dbPath);
sqlite.pragma('foreign_keys = ON');

const uploadId = process.argv[2];
if (!uploadId) {
  console.error('usage: tsx scripts/m5-set-hero-image.ts <uploadId>');
  process.exit(1);
}

const upload = sqlite.prepare('SELECT id, alt FROM uploads WHERE id = ?').get(uploadId);
if (!upload) {
  console.error(`upload ${uploadId} not found`);
  process.exit(1);
}

sqlite.prepare("UPDATE uploads SET alt = 'Marketing team collaborating' WHERE id = ?").run(uploadId);

const field = sqlite
  .prepare(
    `SELECT f.id FROM fields f
     JOIN sections s ON s.id = f.section_id
     JOIN pages p ON p.id = s.page_id
     WHERE p.slug = 'home' AND s.slug = 'hero' AND f.slug = 'background'`
  )
  .get() as { id: string } | undefined;

if (!field) {
  console.error('home > hero > background field not found');
  process.exit(1);
}

const now = Math.floor(Date.now() / 1000);
sqlite
  .prepare(
    `INSERT INTO content_values (id, field_id, version, value, updated_at)
     VALUES (?, ?, 'draft', ?, ?)
     ON CONFLICT(field_id, version) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at`
  )
  .run(createId(), field.id, JSON.stringify(uploadId), now);

const drafts = sqlite
  .prepare(
    `SELECT cv.field_id, cv.value FROM content_values cv
     JOIN fields f ON f.id = cv.field_id
     JOIN sections s ON s.id = f.section_id
     JOIN pages p ON p.id = s.page_id
     WHERE p.slug = 'home' AND cv.version = 'draft'`
  )
  .all() as { field_id: string; value: string }[];

const upsert = sqlite.prepare(
  `INSERT INTO content_values (id, field_id, version, value, updated_at)
   VALUES (?, ?, 'published', ?, ?)
   ON CONFLICT(field_id, version) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at`
);
const tx = sqlite.transaction(() => {
  for (const d of drafts) {
    upsert.run(createId(), d.field_id, d.value, now);
  }
  sqlite.prepare(`UPDATE pages SET status='published', updated_at=? WHERE slug='home'`).run(now);
});
tx();

console.log(`[done] hero.background = ${uploadId}, alt set, page published`);
sqlite.close();
