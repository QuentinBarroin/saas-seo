const EXPORT_FORMATS = [
  { format: 'md', label: 'Markdown', hint: '.md' },
  { format: 'csv', label: 'CSV (tableur)', hint: '.csv' },
  { format: 'github', label: 'GitHub Issues', hint: '.json' },
  { format: 'linear', label: 'Linear', hint: '.csv' },
] as const;

/**
 * Menu d'export du backlog. Disclosure HTML natif (`<details>`) — aucun
 * JavaScript client, reste un Server Component (cf. conventions §7). Chaque
 * lien pointe vers la route d'export qui renvoie un téléchargement.
 */
export function BacklogExportMenu({ projectId }: { projectId: string }) {
  const base = `/api/backlog/${projectId}/export`;

  return (
    <details className="group relative">
      <summary className="nv-focus-ring inline-flex h-11 cursor-pointer list-none items-center gap-2 rounded-[12px] border border-[var(--nv-border)] bg-[var(--nv-surface)] px-5 text-[14px] font-semibold tracking-tight text-[var(--nv-navy)] transition-all duration-200 ease-out hover:bg-[var(--nv-bg)] [&::-webkit-details-marker]:hidden">
        Exporter
        <span aria-hidden className="text-[10px] text-gray-400">
          ▾
        </span>
      </summary>
      <div className="absolute right-0 z-20 mt-2 w-60 rounded-[12px] border border-[var(--nv-border)] bg-[var(--nv-surface)] p-1 shadow-lg">
        {EXPORT_FORMATS.map((f) => (
          <a
            key={f.format}
            href={`${base}?format=${f.format}`}
            className="flex items-center justify-between rounded-[8px] px-3 py-2 text-[13px] text-[var(--nv-navy)] hover:bg-[var(--nv-bg)]"
          >
            <span>{f.label}</span>
            <span className="text-[11px] text-gray-400">{f.hint}</span>
          </a>
        ))}
      </div>
    </details>
  );
}
