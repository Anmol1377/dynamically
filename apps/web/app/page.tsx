import { redirect } from 'next/navigation';
import { ensureSettingsRow, isSetupComplete } from '@/lib/auth/setup-state';
import { getCurrentUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export default async function RootPage() {
  await ensureSettingsRow();

  if (!(await isSetupComplete())) {
    redirect('/setup');
  }

  const user = await getCurrentUser();
  redirect(user ? '/dashboard' : '/login');
}
