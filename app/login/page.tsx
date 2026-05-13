import { LoginForm } from './login-form';

type PageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  const { next } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-neutral-200 p-6">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Connexion</h1>
          <p className="text-sm text-neutral-600">saas-audit-seo — accès interne Novera</p>
        </div>
        <LoginForm next={next} />
      </div>
    </main>
  );
}
