import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NewProjectForm } from './new-project-form';

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Nouveau projet</h1>
          <p className="text-sm text-muted-foreground">
            Crée un projet SEO pour ensuite lancer un audit.
          </p>
        </div>
        <Button variant="ghost" asChild>
          <Link href="/dashboard">Annuler</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations du projet</CardTitle>
          <CardDescription>
            Domaine, repo, type, objectifs business + seeds optionnels (concurrents, keywords).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NewProjectForm />
        </CardContent>
      </Card>
    </div>
  );
}
