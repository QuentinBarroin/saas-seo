import Link from 'next/link';
import { FolderSearch } from 'lucide-react';
import { NvButton, NvEmptyState, NvPageHeader } from '@/components/nv';

export default function AppNotFound() {
  return (
    <div className="space-y-8">
      <NvPageHeader title="Page introuvable" subtitle="404 · Cette route n'existe pas dans l'app." />
      <NvEmptyState
        icon={<FolderSearch size={28} strokeWidth={1.75} />}
        title="Rien à afficher ici"
        description="L'URL que tu as ouverte ne correspond à aucune page. Retourne au dashboard pour reprendre le travail."
        primaryAction={
          <NvButton asChild variant="primary" size="md">
            <Link href="/dashboard">Aller au dashboard</Link>
          </NvButton>
        }
      />
    </div>
  );
}
