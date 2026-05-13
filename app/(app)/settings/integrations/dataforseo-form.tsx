'use client';

import { useActionState } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { NvButton, NvField, NvInput } from '@/components/nv';
import {
  saveAndTestDataForSeoCredentials,
  INITIAL_DATAFORSEO_STATE,
  type SaveDataForSeoState,
} from './actions';

type Props = {
  projectId: string;
  /** Indique si des creds sont déjà persistées (pour afficher un hint). */
  hasCredentials: boolean;
};

export function DataForSeoForm({ projectId, hasCredentials }: Props) {
  const [state, formAction, pending] = useActionState<SaveDataForSeoState, FormData>(
    saveAndTestDataForSeoCredentials,
    INITIAL_DATAFORSEO_STATE
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="projectId" value={projectId} />

      {hasCredentials && state.status === 'idle' ? (
        <p className="text-[12px] text-[var(--nv-text-muted)]">
          Des credentials sont déjà enregistrés pour ce projet. Resaisis pour les remplacer.
        </p>
      ) : null}

      <NvField label="Login" required htmlFor="login">
        <NvInput
          id="login"
          name="login"
          type="text"
          required
          autoComplete="username"
          placeholder="exemple@novera.fr"
        />
      </NvField>

      <NvField label="Password" required htmlFor="password" hint="Stocké chiffré AES-256-GCM en DB">
        <NvInput
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
        />
      </NvField>

      {state.status === 'success' ? (
        <div className="flex items-start gap-2 rounded-[var(--nv-radius-md)] border border-[var(--nv-success)]/40 bg-[var(--nv-success-soft)] px-4 py-3 text-[13px] text-[var(--nv-success)]">
          <CheckCircle2 size={16} strokeWidth={2} className="mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="font-semibold">{state.message}</p>
            {state.account ? (
              <p className="text-[12px] text-[var(--nv-text)]">
                Compte : <span className="nv-numeric font-semibold">{state.account.login}</span>
                {state.account.balance ? (
                  <>
                    {' · '}solde{' '}
                    <span className="nv-numeric font-semibold">{state.account.balance}</span>
                  </>
                ) : null}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {state.status === 'error' ? (
        <div className="flex items-start gap-2 rounded-[var(--nv-radius-md)] border border-[var(--nv-danger)]/40 bg-[var(--nv-danger-soft)] px-4 py-3 text-[13px] text-[var(--nv-danger)]">
          <AlertCircle size={16} strokeWidth={2} className="mt-0.5 shrink-0" />
          <p>{state.message}</p>
        </div>
      ) : null}

      <div className="flex justify-end">
        <NvButton type="submit" variant="primary" size="md" disabled={pending}>
          {pending ? 'Test en cours…' : 'Sauvegarder et tester'}
        </NvButton>
      </div>
    </form>
  );
}
