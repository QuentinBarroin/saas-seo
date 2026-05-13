import { PlaceholderPage } from '@/components/placeholder-page';

export default function BacklogPage() {
  return (
    <PlaceholderPage
      title="Backlog"
      description="Backlog Claude Code généré (prompts par PR) + export Markdown."
      sprintLabel="Sprint 2"
      taskIds={['S2-11', 'S2-12']}
    />
  );
}
