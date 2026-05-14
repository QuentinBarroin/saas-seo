'use client';

import { NvButton, NvCard, NvPageHeader } from '@/components/nv';
import { AlertOctagon, RefreshCw } from 'lucide-react';

type Props = { error: Error & { digest?: string }; reset: () => void };

export default function AppError({ error, reset }: Props) {
  return (
    <div className="space-y-8">
      <NvPageHeader
        title="Une erreur est survenue"
        subtitle="L'opération a échoué. Tu peux retenter ou retourner au dashboard."
      />
      <NvCard padding="md">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[10px] bg-[var(--nv-danger-soft)] text-[var(--nv-danger)]">
            <AlertOctagon size={22} strokeWidth={1.75} />
          </div>
          <div className="flex-1 space-y-3">
            <p className="text-[14px] text-[var(--nv-text-muted)]">
              {error.message || 'Erreur inconnue'}
            </p>
            {error.digest && (
              <p className="text-[11px] font-mono text-[var(--nv-text-muted)]">
                Digest : {error.digest}
              </p>
            )}
            <div className="flex gap-2 pt-2">
              <NvButton variant="primary" size="sm" onClick={() => reset()}>
                <RefreshCw size={14} strokeWidth={2} /> Réessayer
              </NvButton>
              <NvButton asChild variant="secondary" size="sm">
                <a href="/dashboard">Retour dashboard</a>
              </NvButton>
            </div>
          </div>
        </div>
      </NvCard>
    </div>
  );
}
