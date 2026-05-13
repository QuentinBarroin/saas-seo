# Workflow — Ajouter une feature

Pas-à-pas standard pour implémenter une feature MVP / Lot 1 / Lot 2.

## 1. Cadrer

- Lire `CLAUDE.md` §12 (checklist avant implémentation).
- Identifier l'ID de tâche (ex : `S2-11`).
- Lire la user story dans la base Obsidian `07_execution/sprint-N.md`.
- Vérifier qu'aucune question bloquante `Q-NNN` n'empêche la tâche.

## 2. Décider la classification

Choisir SIMPLE / STANDARD / COMPLEX / CRITICAL selon `MODEL_POLICY.md` et **annoncer le plan d'action en puces avant de coder**.

## 3. Impacts à anticiper

| Type d'impact | Action |
|---|---|
| DB | Modifier `prisma/schema.prisma`, `pnpm prisma:migrate`, mettre à jour `DATA_MODEL.md` |
| API | Ajouter le schema Zod dans `lib/validation/`, créer le `route.ts`, mettre à jour `API_SPEC.md` |
| UI | Ajouter la page + composants. Server Components par défaut |
| IA | Modifier le prompt dans `lib/ai/prompts/`, valider Zod la sortie, ajouter fixture dans `tests/fixtures/claude/` |
| Crawler / scan repo | Ajouter règle dans `lib/scoring/rules.ts` + détecteur dans `lib/scoring/detectors/` |

## 4. Implémentation

1. Brancher en mode TDD si possible : un test qui échoue d'abord.
2. Écrire l'implémentation minimale qui fait passer le test.
3. Refactor si besoin.
4. Mettre à jour la doc impactée (ARCHITECTURE / DATA_MODEL / API_SPEC).

## 5. Tests

```bash
pnpm lint
pnpm typecheck
pnpm test
```

Couverture cible : ≥ 70 % sur le module touché.

## 6. Validation locale

- Lancer `pnpm dev` et vérifier le rendu UI.
- Si feature liée à un job : `pnpm dlx inngest-cli@latest dev` dans un terminal séparé.
- Si feature liée à la DB : vérifier qu'une migration tourne sur Postgres local OU Supabase.

## 7. PR

- Branche : `sprint-N/<tache-id>` (ex: `sprint-2/s2-11-backlog-generator`).
- Description PR : explique le **pourquoi**, référence l'ID de tâche.
- Capture d'écran si UI.
- Lien vers le golden audit si changement de scoring.

## 8. Suivi post-merge

- Mettre à jour le journal Obsidian `08_logs/journal-execution.md`.
- Marquer le BacklogItem `done` (s'il existe en DB) ou la ligne du backlog priorisé Obsidian.
- Si nouvelle décision technique → ADR (Architecte).
- Si nouvelle décision produit → PDR (PO).

## Anti-patterns

- Implémenter sans avoir lu la user story.
- Coder sans annonce du plan en classification CRITICAL.
- Pousser sans `pnpm lint && pnpm test`.
- Oublier de mettre à jour les 4 docs canoniques quand pertinents.
