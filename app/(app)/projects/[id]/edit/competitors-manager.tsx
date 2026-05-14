'use client';

import { useActionState } from 'react';
import { X, Plus } from 'lucide-react';
import { NvButton, NvCard, NvField, NvInput, NvStatusBadge } from '@/components/nv';
import { addCompetitorAction, removeCompetitorAction } from './actions';

type Competitor = {
  id: string;
  domain: string;
  source: string | null;
  serpFrequency: number | null;
};

type CompetitorsManagerProps = {
  projectId: string;
  competitors: Competitor[];
};

export function CompetitorsManager({ projectId, competitors }: CompetitorsManagerProps) {
  const [addState, addFormAction, addPending] = useActionState(addCompetitorAction, {});

  const manualCompetitors = competitors.filter((c) => c.source === 'manual');
  const autoCompetitors = competitors.filter((c) => c.source === 'serp_auto');

  return (
    <NvCard>
      <h2 className="mb-4 text-[16px] font-bold tracking-tight text-[var(--nv-navy)]">
        Gestion des concurrents
      </h2>

      {autoCompetitors.length > 0 ? (
        <div className="mb-6">
          <p className="mb-2 text-[13px] text-[var(--nv-text-muted)]">
            Concurrents automatiques (régénérés à chaque audit)
          </p>
          <div className="space-y-2">
            {autoCompetitors.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded border border-[var(--nv-border)] bg-[var(--nv-bg-subtle)] p-3"
              >
                <div className="flex items-center gap-3">
                  <NvStatusBadge variant="neutral">Auto</NvStatusBadge>
                  <span className="text-[13px] text-[var(--nv-navy)]">{c.domain}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mb-4">
        <p className="mb-2 text-[13px] font-medium text-[var(--nv-navy)]">Concurrents manuels</p>
        {manualCompetitors.length > 0 ? (
          <div className="space-y-2">
            {manualCompetitors.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded border border-[var(--nv-border)] bg-white p-3"
              >
                <div className="flex items-center gap-3">
                  <NvStatusBadge variant="neutral">Manuel</NvStatusBadge>
                  <span className="text-[13px] text-[var(--nv-navy)]">{c.domain}</span>
                </div>
                <form action={removeCompetitorAction}>
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="projectId" value={projectId} />
                  <NvButton
                    type="submit"
                    variant="ghost"
                    size="sm"
                    aria-label={`Supprimer ${c.domain}`}
                  >
                    <X size={14} strokeWidth={2} />
                  </NvButton>
                </form>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-[var(--nv-text-muted)]">Aucun concurrent manuel</p>
        )}
      </div>

      <form action={addFormAction} className="space-y-3 border-t border-[var(--nv-border)] pt-4">
        <input type="hidden" name="projectId" value={projectId} />
        <NvField label="Ajouter un concurrent" htmlFor="add-competitor" hint="Domaine uniquement">
          <div className="flex gap-2">
            <div className="flex-1">
              <NvInput
                id="add-competitor"
                name="domain"
                placeholder="concurrent.com"
                disabled={addPending}
              />
            </div>
            <NvButton type="submit" disabled={addPending} variant="secondary" size="sm">
              <Plus size={14} strokeWidth={2} />
              Ajouter
            </NvButton>
          </div>
        </NvField>
        {addState.error ? (
          <p role="alert" className="text-[13px] text-[var(--nv-danger)]">
            {addState.error}
          </p>
        ) : null}
      </form>
    </NvCard>
  );
}
