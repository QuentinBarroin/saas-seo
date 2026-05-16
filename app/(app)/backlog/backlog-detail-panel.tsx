'use client';

import { Fragment, useState } from 'react';
import type { BacklogPrGroup } from '@/lib/backlog/group-by-pr';
import { NvButton, NvCard, NvStatusBadge } from '@/components/nv';

type Props = {
  groups: BacklogPrGroup[];
};

function PriorityBadge({ priority }: { priority: 'P0' | 'P1' | 'P2' }) {
  const colors = {
    P0: 'bg-red-100 text-red-800 border-red-200',
    P1: 'bg-amber-100 text-amber-800 border-amber-200',
    P2: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${colors[priority]}`}
    >
      {priority}
    </span>
  );
}

function EffortBadge({ effort }: { effort: string }) {
  return (
    <span className="inline-flex items-center rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-700">
      {effort}
    </span>
  );
}

export function BacklogDetailPanel({ groups }: Props) {
  const items = groups.flatMap((group) => group.items);
  const [selectedId, setSelectedId] = useState<string | null>(
    items.length > 0 && items[0] ? items[0].id : null
  );
  const [copied, setCopied] = useState(false);

  const selected = items.find((item) => item.id === selectedId) ?? null;

  const handleCopy = async () => {
    if (!selected?.claudePrompt) return;
    await navigator.clipboard.writeText(selected.claudePrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <NvCard>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-3 py-2 text-left font-semibold">Tâche</th>
                  <th className="px-3 py-2 text-left font-semibold">Pri.</th>
                  <th className="px-3 py-2 text-left font-semibold">Effort</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => (
                  <Fragment key={group.id}>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <td
                        colSpan={3}
                        className="px-3 py-2 text-xs font-semibold text-gray-600"
                      >
                        {group.label} · {group.items.length} tâche(s)
                      </td>
                    </tr>
                    {group.items.map((item) => (
                      <tr
                        key={item.id}
                        className={`cursor-pointer border-b border-gray-100 hover:bg-gray-50 ${
                          selectedId === item.id ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => setSelectedId(item.id)}
                      >
                        <td className="px-3 py-2">
                          <div className="font-medium">{item.title}</div>
                          <div className="text-xs text-gray-500">
                            {item.category}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <PriorityBadge priority={item.priority} />
                        </td>
                        <td className="px-3 py-2">
                          <EffortBadge effort={item.effort} />
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </NvCard>
      </div>

      {selected && (
        <div className="lg:col-span-2">
          <NvCard>
            <div className="space-y-6">
              <div>
                <div className="mb-2 flex items-start justify-between gap-4">
                  <h3 className="text-lg font-semibold">{selected.title}</h3>
                  <div className="flex shrink-0 items-center gap-2">
                    <PriorityBadge priority={selected.priority} />
                    <EffortBadge effort={selected.effort} />
                    <NvStatusBadge variant="neutral">{selected.status}</NvStatusBadge>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  Catégorie : {selected.category}
                </div>
              </div>

              <div>
                <h4 className="mb-2 font-semibold text-gray-700">
                  Description
                </h4>
                <p className="whitespace-pre-wrap text-sm text-gray-700">
                  {selected.description}
                </p>
              </div>

              {selected.sourceFinding && (
                <div>
                  <h4 className="mb-2 font-semibold text-gray-700">
                    Finding source
                  </h4>
                  <div className="text-sm">
                    <span className="font-mono text-xs">
                      {selected.sourceFinding.rule}
                    </span>
                    {' — '}
                    <span>{selected.sourceFinding.title}</span>
                    {' · '}
                    <span className="text-gray-500">
                      {selected.sourceFinding.severity}
                    </span>
                  </div>
                </div>
              )}

              {selected.filePathsTargeted.length > 0 && (
                <div>
                  <h4 className="mb-2 font-semibold text-gray-700">
                    Fichiers à toucher
                  </h4>
                  <ul className="space-y-1">
                    {selected.filePathsTargeted.map((path, idx) => (
                      <li key={idx} className="font-mono text-xs text-gray-700">
                        {path}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selected.acceptanceCriteria.length > 0 && (
                <div>
                  <h4 className="mb-2 font-semibold text-gray-700">
                    Critères d'acceptation
                  </h4>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
                    {selected.acceptanceCriteria.map((criterion, idx) => (
                      <li key={idx}>{criterion}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selected.testsExpected.length > 0 && (
                <div>
                  <h4 className="mb-2 font-semibold text-gray-700">
                    Tests attendus
                  </h4>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
                    {selected.testsExpected.map((test, idx) => (
                      <li key={idx}>{test}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selected.definitionOfDone && (
                <div>
                  <h4 className="mb-2 font-semibold text-gray-700">
                    Definition of Done
                  </h4>
                  <p className="text-sm text-gray-700">
                    {selected.definitionOfDone}
                  </p>
                </div>
              )}

              {selected.claudePrompt && (
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="font-semibold text-gray-700">
                      Prompt Claude Code
                    </h4>
                    <NvButton variant="secondary" size="sm" onClick={handleCopy}>
                      {copied ? 'Copié ✓' : 'Copier'}
                    </NvButton>
                  </div>
                  <pre className="overflow-x-auto rounded border border-gray-200 bg-gray-50 p-3 text-xs">
                    {selected.claudePrompt}
                  </pre>
                </div>
              )}
            </div>
          </NvCard>
        </div>
      )}
    </div>
  );
}
