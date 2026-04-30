import 'server-only';
import { eq } from 'drizzle-orm';
import { sha256 } from '@oslojs/crypto/sha2';
import { encodeHexLowerCase } from '@oslojs/encoding';
import { db } from '@/lib/db/client';
import { apiKeys, settings, type ApiKey } from '@/lib/db/schema';

export type AuthResult =
  | { ok: true; mode: 'anonymous' }
  | { ok: true; mode: 'key'; key: ApiKey }
  | { ok: false; status: 401 | 403; message: string };

function hashKey(plain: string): string {
  return encodeHexLowerCase(sha256(new TextEncoder().encode(plain)));
}

export async function authenticateApi(
  authHeader: string | null,
  required: 'read' | 'preview'
): Promise<AuthResult> {
  if (!authHeader) {
    if (required === 'read') {
      const s = await db.select().from(settings).where(eq(settings.id, 1)).get();
      if (s?.publicReadEnabled) return { ok: true, mode: 'anonymous' };
    }
    return { ok: false, status: 401, message: 'Missing Authorization header. Use: Bearer <key>' };
  }

  const match = /^Bearer\s+(.+)$/i.exec(authHeader.trim());
  if (!match || !match[1]) {
    return { ok: false, status: 401, message: 'Invalid Authorization header' };
  }

  const plain = match[1].trim();
  const hash = hashKey(plain);
  const key = await db.select().from(apiKeys).where(eq(apiKeys.keyHash, hash)).get();
  if (!key) return { ok: false, status: 401, message: 'Invalid API key' };

  if (required === 'preview' && key.scope !== 'preview') {
    return { ok: false, status: 403, message: 'This endpoint requires a preview-scope key' };
  }

  void db
    .update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, key.id))
    .run();

  return { ok: true, mode: 'key', key };
}

export function generateApiKey(scope: 'read' | 'preview'): { plain: string; hash: string; prefix: string } {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  const body = encodeHexLowerCase(bytes);
  const prefix = scope === 'preview' ? 'dyn_prv_' : 'dyn_pub_';
  const plain = prefix + body;
  return { plain, hash: hashKey(plain), prefix: plain.slice(0, 12) };
}
