import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Route } from 'next';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { listProjects } from '@/lib/projects/list';
import { NvButton } from '@/components/nv';
import { signOut } from './actions';
import { ProjectSwitcher } from './project-switcher';

type NavItem = { href: Route; label: string };

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/audit-technique', label: 'Audit technique' },
  { href: '/audits', label: 'Historique' },
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

  if (!user) {
    redirect('/login');
  }

  const projects = await listProjects();
  const cookieStore = await cookies();
  const cookieProjectId = cookieStore.get('nv_project')?.value ?? null;
  // Ne propager que si le cookie pointe vers un projet qui existe encore.
  const selectedProjectId = projects.some((p) => p.id === cookieProjectId)
    ? cookieProjectId
    : null;

  const navHref = (href: Route): Route =>
    selectedProjectId ? (`${href}?projectId=${selectedProjectId}` as Route) : href;

  return (
    <div className="flex min-h-screen bg-[var(--nv-bg)]">
      <aside className="w-60 border-r border-[var(--nv-navy-soft)] bg-[var(--nv-navy)] p-4">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="nv-focus-ring text-[14px] font-semibold tracking-tight text-white"
          >
            saas-audit-seo
          </Link>
        </div>
        <ProjectSwitcher
          projects={projects.map((p) => ({ id: p.id, name: p.name }))}
          currentId={selectedProjectId}
        />
        <nav className="flex flex-col gap-1 text-[13px]">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={navHref(item.href)}
              className="nv-focus-ring nv-sidebar-text rounded-[var(--nv-radius-sm)] px-3 py-2 transition-colors hover:bg-[var(--nv-navy-soft)] hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-end gap-4 border-b border-[var(--nv-border)] bg-[var(--nv-surface)] px-6 text-[13px]">
          <span className="text-[var(--nv-text-muted)]" title={user.email ?? undefined}>
            {user.email}
          </span>
          <form action={signOut}>
            <NvButton type="submit" variant="ghost" size="sm">
              Déconnexion
            </NvButton>
          </form>
        </header>
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
