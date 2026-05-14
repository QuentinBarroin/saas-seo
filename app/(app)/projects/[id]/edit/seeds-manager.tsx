'use client';

import { useActionState } from 'react';
import { X, Plus } from 'lucide-react';
import { NvButton, NvCard, NvField, NvTextarea } from '@/components/nv';
import { addSeedKeywordsAction, removeSeedKeywordAction } from './actions';

type SeedKeyword = {
  id: string;
  query: string;
};

type SeedsManagerProps = {
  projectId: string;
  seedKeywords: SeedKeyword[];
};

export function SeedsManager({ projectId, seedKeywords }: SeedsManagerProps) {
  const [addState, addFormAction, addPending] = useActionState(addSeedKeywordsAction, {});

  return (
    <NvCard>
      <h2 className="mb-4 text-[16px] font-bold tracking-tight text-[var(--nv-navy)]">
        Gestion des seed keywords
      </h2>

      <div className="mb-4">
        {seedKeywords.length > 0 ? (
          <div className="space-y-2">
            {seedKeywords.map((k) => (
              <div
                key={k.id}
                className="flex items-center justify-between rounded border border-[var(--nv-border)] bg-white p-3"
              >
                <span className="text-[13px] text-[var(--nv-navy)]">{k.query}</span>
                <form action={removeSeedKeywordAction}>
                  <input type="hidden" name="id" value={k.id} />
                  <input type="hidden" name="projectId" value={projectId} />
                  <NvButton
                    type="submit"
                    variant="ghost"
                    size="sm"
                    aria-label={`Supprimer ${k.query}`}
                  >
                    <X size={14} strokeWidth={2} />
                  </NvButton>
                </form>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-[var(--nv-text-muted)]">Aucun seed keyword</p>
        )}
      </div>

      <form action={addFormAction} className="space-y-3 border-t border-[var(--nv-border)] pt-4">
        <input type="hidden" name="projectId" value={projectId} />
        <NvField
          label="Ajouter des seed keywords"
          htmlFor="add-keywords"
          hint="1 mot-clé par ligne"
        >
          <NvTextarea
            id="add-keywords"
            name="keywords"
            rows={3}
            placeholder={'audit seo\nbacklog claude code'}
            disabled={addPending}
          />
        </NvField>
        <div className="flex items-center justify-between">
          <div>
            {addState.error ? (
              <p role="alert" className="text-[13px] text-[var(--nv-danger)]">
                {addState.error}
              </p>
            ) : addState.inserted !== undefined ? (
              <p className="text-[13px] text-[var(--nv-success)]">
                {addState.inserted} mot-clé{addState.inserted > 1 ? 's' : ''} ajouté
                {addState.inserted > 1 ? 's' : ''}
              </p>
            ) : null}
          </div>
          <NvButton type="submit" disabled={addPending} variant="secondary" size="sm">
            <Plus size={14} strokeWidth={2} />
            Ajouter
          </NvButton>
        </div>
      </form>
    </NvCard>
  );
}
