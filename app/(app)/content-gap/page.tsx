import { PlaceholderPage } from '@/components/placeholder-page';

export default function ContentGapPage() {
  return (
    <PlaceholderPage
      title="Content gap"
      description="Pages manquantes + architecture cible (ARCH-001 à ARCH-004) + fiches SEO recommandées."
      sprintLabel="Sprint 2"
      taskIds={['S2-09', 'S2-10']}
    />
  );
}
