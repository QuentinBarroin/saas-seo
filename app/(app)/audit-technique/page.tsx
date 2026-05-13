import { PlaceholderPage } from '@/components/placeholder-page';

export default function AuditTechniquePage() {
  return (
    <PlaceholderPage
      title="Audit technique"
      description="Findings du crawler et du scan repo (TECH-*, CODE-*, GEO-*)."
      sprintLabel="Sprint 1"
      taskIds={['S1-03', 'S1-05', 'S1-08', 'S1-10']}
    />
  );
}
