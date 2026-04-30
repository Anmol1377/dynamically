'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loginAction, type LoginFormState } from './actions';

const initialState: LoginFormState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Signing in…' : 'Sign in'}
    </Button>
  );
}

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [state, formAction] = useFormState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {redirectTo && <input type="hidden" name="redirect" value={redirectTo} />}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
        {state.errors?.email && <p className="text-sm text-destructive">{state.errors.email[0]}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required autoComplete="current-password" />
        {state.errors?.password && <p className="text-sm text-destructive">{state.errors.password[0]}</p>}
      </div>

      {state.formError && <p className="text-sm text-destructive">{state.formError}</p>}

      <SubmitButton />
    </form>
  );
}
