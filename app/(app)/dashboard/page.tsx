export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p className="text-neutral-600">
        Aucun projet pour l&apos;instant. Les fonctionnalités d&apos;audit arrivent en Sprint 1.
      </p>
      <div className="rounded-md border border-dashed border-neutral-300 p-6 text-sm text-neutral-500">
        À venir : score global, risques, opportunités, prochaines actions.
      </div>
    </div>
  );
}
