'use client';

import { useActionState, useEffect, useState } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { NvButton } from '@/components/nv';
import { addSeedKeywordsAction, suggestKeywordsAction } from './actions';

type Props = {
  projectId: string;
  /** Seed keywords déjà présents — filtrés des suggestions. */
  existingQueries: string[];
};

/**
 * Suggestion IA de seed keywords (PDR-013). Claude propose une liste à partir
 * du contexte projet ; l'utilisateur coche ce qu'il garde, puis valide.
 * Partagé entre la page /keywords et l'édition de projet. L'ajout réutilise
 * `addSeedKeywordsAction` (mêmes dédup/persistance que la saisie manuelle).
 */
export function SeedSuggestions({ projectId, existingQueries }: Props) {
  const [suggestState, suggestAction, suggesting] = useActionState(suggestKeywordsAction, {});
  const [addState, addAction, adding] = useActionState(addSeedKeywordsAction, {});
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // À chaque nouvelle suggestion, on présélectionne tout.
  useEffect(() => {
    setSelected(new Set(suggestState.suggestions ?? []));
  }, [suggestState]);

  const suggestions = suggestState.suggestions ?? [];
  const existing = new Set(existingQueries.map((q) => q.trim().toLowerCase()));
  const fresh = suggestions.filter((s) => !existing.has(s.toLowerCase()));
  const selectedFresh = fresh.filter((s) => selected.has(s));

  function toggle(kw: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(kw)) next.delete(kw);
      else next.add(kw);
      return next;
    });
  }

  return (
    <div className="mt-4 border-t border-[var(--nv-border)] pt-4">
      <form action={suggestAction}>
        <input type="hidden" name="projectId" value={projectId} />
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[13px] font-semibold text-[var(--nv-navy)]">Suggestion IA</p>
            <p className="text-[12px] text-[var(--nv-text-muted)]">
              Claude propose des mots-clés à partir du contexte du projet.
            </p>
          </div>
          <NvButton type="submit" variant="secondary" size="sm" disabled={suggesting}>
            <Sparkles size={14} strokeWidth={2} />
            {suggesting ? 'Génération…' : 'Suggérer des mots-clés'}
          </NvButton>
        </div>
      </form>

      {suggestState.error ? (
        <p role="alert" className="mt-2 text-[13px] text-[var(--nv-danger)]">
          {suggestState.error}
        </p>
      ) : null}

      {fresh.length > 0 ? (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {fresh.map((kw) => {
              const on = selected.has(kw);
              return (
                <button
                  type="button"
                  key={kw}
                  onClick={() => toggle(kw)}
                  aria-pressed={on}
                  className={`nv-focus-ring rounded-full border px-3 py-1 text-[12px] font-medium transition-colors ${
                    on
                      ? 'border-[var(--nv-navy)] bg-[var(--nv-navy)] text-white'
                      : 'border-[var(--nv-border)] text-[var(--nv-text-muted)] hover:border-[var(--nv-border-strong)]'
                  }`}
                >
                  {kw}
                </button>
              );
            })}
          </div>
          <form action={addAction} className="flex items-center justify-between gap-3">
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="keywords" value={selectedFresh.join('\n')} />
            {addState.error ? (
              <p role="alert" className="text-[13px] text-[var(--nv-danger)]">
                {addState.error}
              </p>
            ) : addState.inserted !== undefined ? (
              <p className="text-[13px] text-[var(--nv-success)]">
                {addState.inserted} mot-clé{addState.inserted > 1 ? 's' : ''} ajouté
                {addState.inserted > 1 ? 's' : ''}
              </p>
            ) : (
              <span className="text-[12px] text-[var(--nv-text-muted)]">
                {selectedFresh.length} sélectionné{selectedFresh.length > 1 ? 's' : ''}
              </span>
            )}
            <NvButton
              type="submit"
              variant="primary"
              size="sm"
              disabled={adding || selectedFresh.length === 0}
            >
              <Plus size={14} strokeWidth={2} />
              Ajouter la sélection
            </NvButton>
          </form>
        </div>
      ) : suggestions.length > 0 ? (
        <p className="mt-3 text-[13px] text-[var(--nv-text-muted)]">
          Toutes les suggestions sont déjà dans tes seed keywords.
        </p>
      ) : null}
    </div>
  );
}
