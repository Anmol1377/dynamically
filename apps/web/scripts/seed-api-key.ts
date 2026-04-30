import Database from 'better-sqlite3';
import { resolve } from 'node:path';
import { sha256 } from '@oslojs/crypto/sha2';
import { encodeHexLowerCase } from '@oslojs/encoding';
import { createId } from '@paralleldrive/cuid2';

const dbPath = resolve(process.cwd(), process.env.DATABASE_URL ?? './data/dynamically.db');
const sqlite = new Database(dbPath);

const scope = (process.argv[2] === 'preview' ? 'preview' : 'read') as 'read' | 'preview';
const name = process.argv[3] ?? `Test ${scope} key`;

const bytes = new Uint8Array(20);
crypto.getRandomValues(bytes);
const body = encodeHexLowerCase(bytes);
const prefix = scope === 'preview' ? 'dyn_prv_' : 'dyn_pub_';
const plain = prefix + body;
const hash = encodeHexLowerCase(sha256(new TextEncoder().encode(plain)));

sqlite
  .prepare(
    'INSERT INTO api_keys (id, name, key_hash, key_prefix, scope) VALUES (?, ?, ?, ?, ?)'
  )
  .run(createId(), name, hash, plain.slice(0, 12), scope);

console.log(plain);
sqlite.close();
