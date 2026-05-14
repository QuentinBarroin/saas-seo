import Link from 'next/link';
import { Plus, FolderPlus } from 'lucide-react';
import { NvButton, NvEmptyState, NvPageHeader } from '@/components/nv';
import {
  listProjectSummaries,
  getProjectDashboard,
} from '@/lib/dashboard/get-dashboard-data';
import { ProjectsGrid } from './projects-grid';
import { ProjectDetail } from './project-detail';

type SearchParams = Promise<{ projectId?: string }>;

type DashboardPageProps = {
  searchParams: SearchParams;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const { projectId } = params;

  if (projectId) {
    const data = await getProjectDashboard(projectId);

    if (!data) {
      return (
        <div className="space-y-8">
          <NvPageHeader title="Projet introuvable" />
          <NvEmptyState
            icon={<FolderPlus size={28} strokeWidth={1.75} />}
            title="Projet introuvable"
            description="Le projet demandé n'existe pas ou a été supprimé."
            primaryAction={
              <NvButton asChild variant="primary" size="md">
                <Link href="/dashboard">Retour au dashboard</Link>
              </NvButton>
            }
          />
        </div>
      );
    }

    return <ProjectDetail data={data} />;
  }

  const projects = await listProjectSummaries();

  if (projects.length === 0) {
    return (
      <div className="space-y-8">
        <NvPageHeader
          title="Dashboard"
          subtitle="Crée ton premier projet pour lancer un audit SEO/GEO."
        />
        <NvEmptyState
          icon={<FolderPlus size={28} strokeWidth={1.75} />}
          title="Aucun projet pour l'instant"
          description="Un projet SEO regroupe un domaine, un repo optionnel, des concurrents et des seed keywords. Tu pourras ensuite lancer un audit."
          primaryAction={
            <NvButton asChild variant="primary" size="md">
              <Link href="/projects/new">
                <Plus size={16} strokeWidth={2} /> Créer un projet
              </Link>
            </NvButton>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <NvPageHeader
        title="Dashboard"
        subtitle={`${projects.length} projet${projects.length > 1 ? 's' : ''} actif${projects.length > 1 ? 's' : ''}.`}
        action={
          <NvButton asChild variant="primary" size="md">
            <Link href="/projects/new">
              <Plus size={16} strokeWidth={2} /> Nouveau projet
            </Link>
          </NvButton>
        }
      />

      <ProjectsGrid projects={projects} />
    </div>
  );
}
