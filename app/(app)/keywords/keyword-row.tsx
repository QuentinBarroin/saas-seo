'use client';

import { useState } from 'react';
import { Save } from 'lucide-react';
import { NvInput } from '@/components/nv';
import { updateKeywordAction } from './actions';

type KeywordData = {
  id: string;
  query: string;
  cluster: string | null;
  intent: string | null;
  isMoneyKeyword: boolean;
  source: string | null;
};

type Props = {
  projectId: string;
  keyword: KeywordData;
  existingClusters: string[];
};

export function KeywordRow({ projectId, keyword, existingClusters }: Props) {
  const [cluster, setCluster] = useState(keyword.cluster ?? '');
  const [intent, setIntent] = useState(keyword.intent ?? '');
  const [isMoneyKeyword, setIsMoneyKeyword] = useState(keyword.isMoneyKeyword);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);

    const formData = new FormData();
    formData.set('keywordId', keyword.id);
    formData.set('projectId', projectId);
    formData.set('cluster', cluster);
    formData.set('intent', intent);
    if (isMoneyKeyword) {
      formData.set('isMoneyKeyword', 'on');
    }

    await updateKeywordAction({}, formData);
    setPending(false);
  };

  return (
    <tr className="border-b border-nv-border">
      <td className="p-2 text-sm text-nv-navy">{keyword.query}</td>
      <td className="p-2">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <NvInput
            name="cluster"
            value={cluster}
            onChange={(e) => setCluster(e.target.value)}
            placeholder="Cluster"
            disabled={pending}
            list="existingClusters"
            className="h-9 w-32 text-sm"
          />
          <datalist id="existingClusters">
            {existingClusters.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <select
            name="intent"
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            disabled={pending}
            className="h-9 w-32 rounded border border-nv-border bg-white px-2 text-sm text-nv-navy outline-none transition-colors hover:border-nv-navy focus:border-nv-navy disabled:opacity-50"
          >
            <option value="">—</option>
            <option value="tofu">TOFU</option>
            <option value="mofu">MOFU</option>
            <option value="bofu">BOFU</option>
            <option value="navigational">Nav.</option>
          </select>
          <label className="flex items-center gap-1 text-xs">
            <input
              type="checkbox"
              name="isMoneyKeyword"
              checked={isMoneyKeyword}
              onChange={(e) => setIsMoneyKeyword(e.target.checked)}
              disabled={pending}
              className="h-4 w-4 rounded border-gray-300 text-nv-gold focus:ring-nv-gold"
            />
            Money
          </label>
          <button
            type="submit"
            disabled={pending}
            className="flex h-9 items-center justify-center rounded bg-nv-gold px-3 text-sm font-semibold text-nv-navy transition-colors hover:bg-nv-gold/90 disabled:opacity-50"
          >
            <Save size={14} />
          </button>
        </form>
      </td>
      <td className="p-2 text-xs text-gray-500">{keyword.source ?? '—'}</td>
    </tr>
  );
}
