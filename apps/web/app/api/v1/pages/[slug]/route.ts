import { NextResponse, type NextRequest } from 'next/server';
import { authenticateApi } from '@/lib/api/auth';
import { apiError } from '@/lib/api/errors';
import { loadPageContent } from '@/lib/content/loader';
import { serializePageContent } from '@/lib/api/serialize';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const isPreview = req.nextUrl.searchParams.get('preview') === 'true';
  const required = isPreview ? 'preview' : 'read';

  const auth = await authenticateApi(req.headers.get('authorization'), required);
  if (!auth.ok) return apiError(auth.status === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN', auth.message);

  const data = await loadPageContent(params.slug);
  if (!data) return apiError('NOT_FOUND', `Page "${params.slug}" not found`);

  if (!isPreview && data.page.status !== 'published') {
    return apiError('NOT_FOUND', `Page "${params.slug}" has not been published`);
  }

  return NextResponse.json(await serializePageContent(data, isPreview ? 'draft' : 'published'));
}
