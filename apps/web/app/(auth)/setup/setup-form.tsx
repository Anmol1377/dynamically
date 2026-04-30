'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { setupAction, type SetupFormState } from './actions';

const initialState: SetupFormState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Creating account…' : 'Create admin account'}
    </Button>
  );
}

export function SetupForm() {
  const [state, formAction] = useFormState(setupAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
        {state.errors?.email && <p className="text-sm text-destructive">{state.errors.email[0]}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required autoComplete="new-password" />
        {state.errors?.password && <p className="text-sm text-destructive">{state.errors.password[0]}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" required autoComplete="new-password" />
        {state.errors?.confirmPassword && (
          <p className="text-sm text-destructive">{state.errors.confirmPassword[0]}</p>
        )}
      </div>

      {state.formError && <p className="text-sm text-destructive">{state.formError}</p>}

      <SubmitButton />
    </form>
  );
}
