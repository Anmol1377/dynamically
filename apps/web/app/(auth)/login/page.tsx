import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ensureSettingsRow, isSetupComplete } from '@/lib/auth/setup-state';
import { getCurrentUser } from '@/lib/auth/session';
import { LoginForm } from './login-form';

export const dynamic = 'force-dynamic';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { redirect?: string };
}) {
  await ensureSettingsRow();
  if (!(await isSetupComplete())) {
    redirect('/setup');
  }
  if (await getCurrentUser()) {
    redirect('/dashboard');
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Welcome back to Dynamically.</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm redirectTo={searchParams.redirect} />
      </CardContent>
    </Card>
  );
}
