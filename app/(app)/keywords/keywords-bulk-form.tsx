'use client';

import { useState } from 'react';
import { Layers } from 'lucide-react';
import { NvButton, NvInput } from '@/components/nv';
import { bulkAssignClusterAction } from './actions';

type KeywordForBulk = {
  id: string;
  query: string;
  cluster: string | null;
};

type Props = {
  projectId: string;
  keywords: KeywordForBulk[];
  existingClusters: string[];
};

export function KeywordsBulkForm({ projectId, keywords, existingClusters }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [clusterName, setClusterName] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleKeyword = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelected(new Set(keywords.map((k) => k.id)));
  };

  const clearSelection = () => {
    setSelected(new Set());
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selected.size === 0) {
      setError('Sélectionne au moins 1 keyword');
      return;
    }
    if (!clusterName.trim()) {
      setError('Nom de cluster requis');
      return;
    }

    setPending(true);
    setError(null);

    const formData = new FormData();
    formData.set('projectId', projectId);
    formData.set('clusterName', clusterName.trim());
    for (const id of selected) {
      formData.append('keywordIds', id);
    }

    const result = await bulkAssignClusterAction({}, formData);

    if (result.error) {
      setError(result.error);
      setPending(false);
    } else {
      setClusterName('');
      setSelected(new Set());
      setPending(false);
    }
  };

  return (
    <div className="rounded border border-nv-border bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <Layers size={20} className="text-nv-gold" />
        <h3 className="text-sm font-semibold text-nv-navy">Assigner un cluster en bulk</h3>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-3 flex flex-wrap gap-2">
          {keywords.map((kw) => (
            <label
              key={kw.id}
              className={`cursor-pointer rounded border px-2 py-1 text-xs transition ${
                selected.has(kw.id)
                  ? 'border-nv-gold bg-nv-gold/10 text-nv-navy'
                  : 'border-nv-border bg-gray-50 text-gray-600 hover:border-nv-navy'
              }`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={selected.has(kw.id)}
                onChange={() => toggleKeyword(kw.id)}
              />
              {kw.query}
            </label>
          ))}
        </div>

        <div className="mb-3 flex items-center gap-2">
          <NvButton type="button" variant="secondary" size="sm" onClick={selectAll}>
            Tout sélectionner
          </NvButton>
          <NvButton type="button" variant="secondary" size="sm" onClick={clearSelection}>
            Désélectionner
          </NvButton>
          <span className="text-xs text-gray-500">
            {selected.size} / {keywords.length} sélectionné{selected.size > 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label htmlFor="clusterName" className="mb-1 block text-xs font-medium text-nv-navy">
              Nom du cluster
            </label>
            <NvInput
              id="clusterName"
              name="clusterName"
              value={clusterName}
              onChange={(e) => setClusterName(e.target.value)}
              placeholder="ex: SEO Local"
              disabled={pending}
              list="existingClusters"
            />
            <datalist id="existingClusters">
              {existingClusters.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <NvButton type="submit" disabled={pending}>
            {pending ? 'Assigner...' : 'Assigner aux sélectionnés'}
          </NvButton>
        </div>

        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </form>
    </div>
  );
}
