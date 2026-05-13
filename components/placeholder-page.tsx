import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type Props = {
  title: string;
  description: string;
  sprintLabel: string;
  taskIds?: string[];
};

export function PlaceholderPage({ title, description, sprintLabel, taskIds }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pas encore disponible</CardTitle>
          <CardDescription>
            Cette section sera livrée en <strong>{sprintLabel}</strong>.
            {taskIds && taskIds.length > 0 ? ` Tâches : ${taskIds.join(', ')}.` : null}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Lance d&apos;abord un audit depuis un projet créé sur le Dashboard.
        </CardContent>
      </Card>
    </div>
  );
}
