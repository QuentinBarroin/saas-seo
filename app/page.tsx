import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-3xl font-semibold tracking-tight">saas-audit-seo</h1>
        <p className="mt-3 text-neutral-600">
          Cockpit interne d&apos;audit SEO/GEO. Connecte un projet, lance un audit, récupère un
          backlog Claude Code exécutable.
        </p>
      </div>
      <Link
        href="/dashboard"
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
      >
        Entrer dans l&apos;app →
      </Link>
    </main>
  );
}
