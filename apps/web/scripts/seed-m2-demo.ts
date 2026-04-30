import Database from 'better-sqlite3';
import { resolve } from 'node:path';
import { createId } from '@paralleldrive/cuid2';

const dbPath = resolve(process.cwd(), process.env.DATABASE_URL ?? './data/dynamically.db');
const sqlite = new Database(dbPath);
sqlite.pragma('foreign_keys = ON');

sqlite.prepare("DELETE FROM pages WHERE slug = 'home'").run();

const pageId = createId();
sqlite
  .prepare("INSERT INTO pages (id, slug, title, status, \"order\") VALUES (?, ?, ?, 'draft', 0)")
  .run(pageId, 'home', 'Home');

const heroId = createId();
sqlite
  .prepare(
    "INSERT INTO sections (id, page_id, slug, title, \"order\") VALUES (?, ?, ?, ?, 0)"
  )
  .run(heroId, pageId, 'hero', 'Hero');

const headlineId = createId();
sqlite
  .prepare(
    "INSERT INTO fields (id, section_id, slug, label, type, \"order\", config) VALUES (?, ?, ?, ?, ?, ?, ?)"
  )
  .run(
    headlineId,
    heroId,
    'headline',
    'Headline',
    'text',
    0,
    JSON.stringify({ required: true, helpText: 'Main hero headline' })
  );

const imageId = createId();
sqlite
  .prepare(
    "INSERT INTO fields (id, section_id, slug, label, type, \"order\", config) VALUES (?, ?, ?, ?, ?, ?, ?)"
  )
  .run(
    imageId,
    heroId,
    'background',
    'Background image',
    'image',
    1,
    JSON.stringify({ required: false, aspectRatioHint: '16:9' })
  );

console.log('[seed] home page → hero section → headline (text, required) + background (image)');
sqlite.close();
