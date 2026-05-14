import Link from 'next/link';
import { FolderSearch, ArrowLeft } from 'lucide-react';
import { NvButton, NvEmptyState, NvPageHeader } from '@/components/nv';
import { getPageDetail } from '@/lib/pages/get-page-detail';
import { MetaSection } from './meta-section';
import { ContentSection } from './content-section';
import { SignalsSection } from './signals-section';
import { ScoresSection } from './scores-section';
import { ClusterKeywords } from './cluster-keywords';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PageDetailRoute({ params }: Props) {
  const { id } = await params;
  const data = await getPageDetail(id);

  if (!data) {
    return (
      <div className="space-y-8">
        <NvPageHeader title="Page SEO" subtitle="Page introuvable." />
        <NvEmptyState
          icon={<FolderSearch size={28} strokeWidth={1.75} />}
          title="Page introuvable"
          description="Cette page n'existe pas ou a été supprimée."
          primaryAction={
            <NvButton asChild variant="primary" size="md">
              <Link href="/content-gap">Retour au Content Gap</Link>
            </NvButton>
          }
        />
      </div>
    );
  }

  const pageTitle =
    data.page.targetKeyword || data.page.slug || data.page.url || 'Sans titre';

  const statusPart = data.page.status ? ` · ${data.page.status}` : '';
  const subtitle = [
    data.page.cluster && `${data.page.cluster}`,
    data.project.name,
  ]
    .filter(Boolean)
    .join(' · ') + statusPart;

  return (
    <div className="space-y-8">
      <NvPageHeader
        title={pageTitle}
        subtitle={subtitle}
        action={
          <NvButton asChild variant="secondary" size="sm">
            <Link
              href={`/content-gap?projectId=${data.project.id}`}
              className="inline-flex items-center gap-2"
            >
              <ArrowLeft size={16} strokeWidth={2} />
              Retour Content Gap
            </Link>
          </NvButton>
        }
      />

      <div className="space-y-6">
        <MetaSection
          url={data.page.url}
          slug={data.page.slug}
          pageType={data.page.pageType}
          targetKeyword={data.page.targetKeyword}
          canonical={data.page.canonical}
        />

        <ContentSection
          title={data.page.title}
          description={data.page.description}
          h1={data.page.h1}
          wordCount={data.page.wordCount}
        />

        <SignalsSection
          indexable={data.page.indexable}
          hasJsonLd={data.page.hasJsonLd}
          hasFaq={data.page.hasFaq}
          hasCta={data.page.hasCta}
        />

        <ScoresSection scores={data.page.scores} />

        {data.clusterKeywords.length > 0 && (
          <ClusterKeywords
            cluster={data.page.cluster}
            keywords={data.clusterKeywords}
          />
        )}

        <div className="pt-4 border-t border-[var(--nv-border)]">
          <p className="text-xs text-[var(--nv-text-muted)] italic">
            Édition + auto-génération title/meta via Claude → S2-11 (en attente
            Q-010)
          </p>
        </div>
      </div>
    </div>
  );
}
