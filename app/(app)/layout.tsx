import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Route } from 'next';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { signOut } from './actions';

type NavItem = { href: Route; label: string };

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/audit-technique', label: 'Audit technique' },
  { href: '/keywords', label: 'Keywords' },
  { href: '/serp', label: 'SERP' },
  { href: '/content-gap', label: 'Content gap' },
  { href: '/backlog', label: 'Backlog' },
  { href: '/settings/integrations', label: 'Settings' },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Le middleware redirige déjà ; ceci est une seconde barrière en cas de bypass du matcher.
  if (!user) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 border-r border-neutral-200 bg-neutral-50 p-4">
        <div className="mb-6">
          <Link href="/dashboard" className="text-sm font-semibold tracking-tight">
            saas-audit-seo
          </Link>
        </div>
        <nav className="flex flex-col gap-1 text-sm">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded px-3 py-2 text-neutral-700 transition hover:bg-neutral-200"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-end gap-4 border-b border-neutral-200 px-6 text-sm">
          <span className="text-neutral-500" title={user.email ?? undefined}>
            {user.email}
          </span>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded border border-neutral-300 px-3 py-1 text-xs text-neutral-700 transition hover:bg-neutral-100"
            >
              Déconnexion
            </button>
          </form>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
