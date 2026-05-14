import { MessageSquare } from 'lucide-react';

type Props = {
  questions: string[];
};

export function PAAList({ questions }: Props) {
  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <MessageSquare
          size={32}
          strokeWidth={1.5}
          className="mb-3 text-[var(--nv-text-dim)]"
        />
        <p className="text-sm text-[var(--nv-text-muted)]">Aucune question PAA détectée</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {questions.map((question, idx) => (
        <li
          key={`${idx}-${question.slice(0, 30)}`}
          className="flex gap-3 rounded-lg bg-[var(--nv-bg)] px-4 py-3 text-sm text-[var(--nv-text)]"
        >
          <MessageSquare size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-[var(--nv-accent)]" />
          <span className="leading-relaxed">{question}</span>
        </li>
      ))}
    </ul>
  );
}
