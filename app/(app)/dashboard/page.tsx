import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { listProjects } from '@/lib/projects/list';

export default async function DashboardPage() {
  const projects = await listProjects();

  if (projects.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Crée ton premier projet pour lancer un audit.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Aucun projet</CardTitle>
            <CardDescription>
              Un projet SEO regroupe : un domaine, un repo optionnel, des concurrents et des seed keywords.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/projects/new">Créer un projet</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">{projects.length} projet(s)</p>
        </div>
        <Button asChild>
          <Link href="/projects/new">Nouveau projet</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {projects.map((p) => (
          <Card key={p.id}>
            <CardHeader>
              <CardTitle className="text-base">{p.name}</CardTitle>
              <CardDescription>
                {p.domain} · {p.type} · {p.market}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {p._count.keywords} kw · {p._count.competitors} concurrents · {p._count.audits} audits
              </span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
