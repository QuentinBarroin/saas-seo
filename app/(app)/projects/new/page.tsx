import Link from 'next/link';
import { NvButton, NvCard, NvPageHeader } from '@/components/nv';
import { NewProjectForm } from './new-project-form';

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <NvPageHeader
        title="Nouveau projet"
        subtitle="Crée un projet SEO pour ensuite lancer un audit."
        action={
          <NvButton asChild variant="ghost" size="sm">
            <Link href="/dashboard">Annuler</Link>
          </NvButton>
        }
      />
      <NvCard padding="lg">
        <NewProjectForm />
      </NvCard>
    </div>
  );
}
