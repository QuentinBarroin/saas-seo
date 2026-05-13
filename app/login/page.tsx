import { NvCard } from '@/components/nv';
import { LoginForm } from './login-form';

type PageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  const { next } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--nv-bg)] p-8">
      <div className="w-full max-w-md">
        <NvCard padding="lg">
          <div className="mb-6 space-y-1">
            <p className="nv-eyebrow">Accès interne</p>
            <h1 className="text-[24px] font-bold tracking-tight text-[var(--nv-navy)]">
              Connexion
            </h1>
            <p className="text-[14px] text-[var(--nv-text-muted)]">
              saas-audit-seo · Novera
            </p>
          </div>
          <LoginForm next={next} />
        </NvCard>
      </div>
    </main>
  );
}
