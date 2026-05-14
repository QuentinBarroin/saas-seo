import Link from 'next/link';
import { ArrowLeft, Edit } from 'lucide-react';
import {
  NvPageHeader,
  NvBreadcrumb,
  NvEmptyState,
  NvButton,
  type NvBreadcrumbItem,
} from '@/components/nv';
import { getProjectById } from '@/lib/projects/get-by-id';
import { ProjectForm } from '../../project-form';
import { updateProjectAction } from './actions';
import { CompetitorsManager } from './competitors-manager';
import { SeedsManager } from './seeds-manager';
import { DeleteButton } from './delete-button';

type EditProjectPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const { id } = await params;
  const project = await getProjectById(id);

  if (!project) {
    return (
      <div className="flex h-full items-center justify-center">
        <NvEmptyState
          title="Projet introuvable"
          description="Le projet que vous recherchez n'existe pas ou a été supprimé."
          icon={<Edit size={32} strokeWidth={1.5} />}
          primaryAction={
            <NvButton asChild variant="primary">
              <Link href="/dashboard">
                <ArrowLeft size={14} strokeWidth={2} />
                Retour au dashboard
              </Link>
            </NvButton>
          }
        />
      </div>
    );
  }

  const breadcrumbItems: NvBreadcrumbItem[] = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: project.name, href: `/dashboard?projectId=${project.id}` },
    { label: 'Édition' },
  ];

  const businessGoals = project.businessGoal.split(',').filter(Boolean);

  return (
    <div className="space-y-6">
      <div>
        <NvBreadcrumb items={breadcrumbItems} />
        <div className="mt-4 flex items-center justify-between">
          <NvPageHeader
            title={`Édition · ${project.name}`}
            subtitle="Modifiez les paramètres du projet, gérez les concurrents et les seed keywords."
            action={
              <NvButton asChild variant="secondary">
                <Link href={`/dashboard?projectId=${project.id}`}>Voir le projet</Link>
              </NvButton>
            }
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-lg border border-[var(--nv-border)] bg-white p-6">
            <h2 className="mb-4 text-[16px] font-bold tracking-tight text-[var(--nv-navy)]">
              Informations générales
            </h2>
            <ProjectForm
              mode="edit"
              action={updateProjectAction}
              defaultValues={{
                id: project.id,
                name: project.name,
                domain: project.domain,
                repoUrl: project.repoUrl,
                type: project.type,
                market: project.market,
                businessGoals,
              }}
              submitLabel="Enregistrer"
              showSeedsAndCompetitors={false}
            />
          </div>

          <DeleteButton projectId={project.id} projectName={project.name} />
        </div>

        <div className="space-y-6">
          <CompetitorsManager projectId={project.id} competitors={project.competitors} />
          <SeedsManager projectId={project.id} seedKeywords={project.seedKeywords} />
        </div>
      </div>
    </div>
  );
}
