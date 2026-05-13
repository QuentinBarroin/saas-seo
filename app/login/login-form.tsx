'use client';

import { useActionState } from 'react';
import { NvButton, NvField, NvInput } from '@/components/nv';
import { signIn, type SignInState } from './actions';

const initialState: SignInState = {};

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <NvField label="Email" required htmlFor="email">
        <NvInput
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="vous@novera.fr"
        />
      </NvField>
      <NvField label="Mot de passe" required htmlFor="password">
        <NvInput
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          minLength={8}
        />
      </NvField>
      {state.error ? (
        <p role="alert" className="text-[13px] text-[var(--nv-danger)]">
          {state.error}
        </p>
      ) : null}
      <NvButton type="submit" disabled={pending} size="md" className="w-full">
        {pending ? 'Connexion…' : 'Se connecter'}
      </NvButton>
    </form>
  );
}
