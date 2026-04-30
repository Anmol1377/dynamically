import { NextResponse, type NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { pages } from '@/lib/db/schema';
import { authenticateApi } from '@/lib/api/auth';
import { apiError } from '@/lib/api/errors';
import { serializePageSummary } from '@/lib/api/serialize';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await authenticateApi(req.headers.get('authorization'), 'read');
  if (!auth.ok) return apiError(auth.status === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN', auth.message);

  const rows = await db
    .select()
    .from(pages)
    .where(eq(pages.status, 'published'))
    .orderBy(pages.order, pages.createdAt)
    .all();

  return NextResponse.json({ pages: rows.map(serializePageSummary) });
}
