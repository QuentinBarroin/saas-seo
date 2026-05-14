import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

type Props = {
  projectId: string;
  keywords: string[];
  selectedKeyword: string | null;
};

export function KeywordSelector({ projectId, keywords, selectedKeyword }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {keywords.map((keyword) => {
        const isActive = keyword === selectedKeyword;
        return (
          <Link
            key={keyword}
            href={`/serp?projectId=${projectId}&keyword=${encodeURIComponent(keyword)}`}
            className={`
              inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium
              transition-all duration-[var(--nv-duration)] ease-[var(--nv-ease)]
              ${
                isActive
                  ? 'bg-[var(--nv-accent-soft)] text-[var(--nv-accent-deep)] ring-1 ring-[var(--nv-accent)]'
                  : 'bg-[var(--nv-surface)] text-[var(--nv-text-muted)] ring-1 ring-[var(--nv-border)] hover:ring-[var(--nv-border-strong)]'
              }
            `}
          >
            {isActive && <CheckCircle size={14} strokeWidth={2} />}
            <span>{keyword}</span>
          </Link>
        );
      })}
    </div>
  );
}
