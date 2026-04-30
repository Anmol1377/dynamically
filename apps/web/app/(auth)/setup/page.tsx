import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ensureSettingsRow, isSetupComplete } from '@/lib/auth/setup-state';
import { SetupForm } from './setup-form';

export const dynamic = 'force-dynamic';

export default async function SetupPage() {
  await ensureSettingsRow();
  if (await isSetupComplete()) {
    redirect('/login');
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome to Dynamically</CardTitle>
        <CardDescription>
          Create your admin account to get started. This is a one-time setup.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SetupForm />
      </CardContent>
    </Card>
  );
}
