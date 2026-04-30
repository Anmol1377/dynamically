import Database from 'better-sqlite3';
import { resolve } from 'node:path';
import { createId } from '@paralleldrive/cuid2';

const dbPath = resolve(process.cwd(), process.env.DATABASE_URL ?? './data/dynamically.db');
const sqlite = new Database(dbPath);
sqlite.pragma('foreign_keys = ON');

const cmd = process.argv[2];

function showState() {
  const page = sqlite.prepare("SELECT id, slug, title, status FROM pages WHERE slug='home'").get() as
    | { id: string; slug: string; title: string; status: string }
    | undefined;
  if (!page) {
    console.log('(no home page)');
    return;
  }
  console.log(`page: ${page.title} (${page.status})`);

  const rows = sqlite
    .prepare(
      `SELECT f.slug AS field_slug, cv.version, cv.value
       FROM content_values cv
       JOIN fields f ON f.id = cv.field_id
       JOIN sections s ON s.id = f.section_id
       WHERE s.page_id = ?
       ORDER BY f.slug, cv.version`
    )
    .all(page.id) as { field_slug: string; version: string; value: string }[];

  if (rows.length === 0) {
    console.log('  no content values');
  } else {
    for (const r of rows) console.log(`  [${r.version}] ${r.field_slug} = ${r.value}`);
  }
}

if (cmd === 'show') {
  showState();
} else if (cmd === 'save-draft') {
  const headline = process.argv[3] ?? 'Build sites your marketing team can edit';
  const page = sqlite.prepare("SELECT id FROM pages WHERE slug='home'").get() as { id: string };
  const field = sqlite
    .prepare(
      `SELECT f.id FROM fields f JOIN sections s ON s.id = f.section_id WHERE s.page_id = ? AND f.slug = 'headline'`
    )
    .get(page.id) as { id: string };

  const now = Math.floor(Date.now() / 1000);
  sqlite
    .prepare(
      `INSERT INTO content_values (id, field_id, version, value, updated_at)
       VALUES (?, ?, 'draft', ?, ?)
       ON CONFLICT(field_id, version) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at`
    )
    .run(createId(), field.id, JSON.stringify(headline), now);

  console.log(`[saved draft] headline = ${JSON.stringify(headline)}`);
  showState();
} else if (cmd === 'publish') {
  const page = sqlite.prepare("SELECT id FROM pages WHERE slug='home'").get() as { id: string };
  const drafts = sqlite
    .prepare(
      `SELECT cv.field_id, cv.value
       FROM content_values cv
       JOIN fields f ON f.id = cv.field_id
       JOIN sections s ON s.id = f.section_id
       WHERE s.page_id = ? AND cv.version = 'draft'`
    )
    .all(page.id) as { field_id: string; value: string }[];

  const now = Math.floor(Date.now() / 1000);
  const upsert = sqlite.prepare(
    `INSERT INTO content_values (id, field_id, version, value, updated_at)
     VALUES (?, ?, 'published', ?, ?)
     ON CONFLICT(field_id, version) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at`
  );
  const tx = sqlite.transaction(() => {
    for (const d of drafts) {
      upsert.run(createId(), d.field_id, d.value, now);
    }
    sqlite.prepare(`UPDATE pages SET status='published', updated_at=? WHERE id=?`).run(now, page.id);
  });
  tx();

  console.log(`[published] copied ${drafts.length} draft row(s) to published, page.status=published`);
  showState();
} else if (cmd === 'discard') {
  const page = sqlite.prepare("SELECT id FROM pages WHERE slug='home'").get() as { id: string };
  const result = sqlite
    .prepare(
      `DELETE FROM content_values WHERE version='draft' AND field_id IN
        (SELECT f.id FROM fields f JOIN sections s ON s.id = f.section_id WHERE s.page_id = ?)`
    )
    .run(page.id);
  console.log(`[discarded] removed ${result.changes} draft row(s)`);
  showState();
} else if (cmd === 'reset') {
  const page = sqlite.prepare("SELECT id FROM pages WHERE slug='home'").get() as
    | { id: string }
    | undefined;
  if (!page) {
    console.log('no home page to reset');
  } else {
    const r = sqlite
      .prepare(
        `DELETE FROM content_values WHERE field_id IN
          (SELECT f.id FROM fields f JOIN sections s ON s.id = f.section_id WHERE s.page_id = ?)`
      )
      .run(page.id);
    sqlite.prepare(`UPDATE pages SET status='draft' WHERE id=?`).run(page.id);
    console.log(`[reset] removed ${r.changes} content rows, page.status=draft`);
  }
  showState();
} else {
  console.log('usage: tsx scripts/m3-flow-test.ts <show|save-draft [text]|publish|discard|reset>');
  process.exit(1);
}

sqlite.close();
