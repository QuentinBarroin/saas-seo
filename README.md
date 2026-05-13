# saas-audit-seo

SaaS interne d'audit SEO/GEO transformant un audit en backlog Claude Code exécutable.

> **Statut** : scaffold initial (Sprint 0). Aucune feature SEO encore en place. La base Obsidian de cadrage produit vit hors-repo : `C:\Users\quent\Documents\Obsidian\Second cerveau Quentin\brain\05_projects\saas-seo-audit`.

## Quickstart

Voir [QUICKSTART.md](./QUICKSTART.md) pour le détail. Résumé :

```bash
pnpm install
cp .env.example .env.local        # à remplir
pnpm db:up                         # postgres local sur :5434 (si pas Supabase distant)
pnpm prisma:migrate
pnpm dev
```

## Stack

- **Frontend + Backend** : Next.js 15 (App Router) + React 19 + TypeScript strict.
- **UI** : Tailwind CSS 3 + shadcn/ui (composants à copier au fil de l'eau dans `components/ui/`).
- **DB** : Postgres via Supabase + Prisma 6.
- **Auth** : Supabase Auth (mono-utilisateur en MVP).
- **Jobs background** : Inngest.
- **IA** : Anthropic SDK (Claude Sonnet 4.6 par défaut).
- **Tests** : Vitest.
- **Hébergement** : Vercel (front/back) + Supabase (DB/Auth/Storage).

## Pour Claude Code

Lire dans cet ordre avant toute action :

1. [CLAUDE.md](./CLAUDE.md) — invariants opérationnels.
2. [ARCHITECTURE.md](./ARCHITECTURE.md) — couches et flux.
3. [DATA_MODEL.md](./DATA_MODEL.md) — Prisma.
4. [API_SPEC.md](./API_SPEC.md) — endpoints.
5. [docs/WORKFLOWS/](./docs/WORKFLOWS/) — pas-à-pas par type de tâche.

## Documentation projet (hors-repo)

La planification produit complète (MVP / Lot 1 / Lot 2 / agents / sprints / questions ouvertes / prompts) vit dans Obsidian. Référence canonique pour toute décision de scope ou produit.

## Roadmap

- **Sprint 0** (en cours) : scaffold + auth + page projet.
- **Sprint 1** : crawler + scan repo + page /audit-technique.
- **Sprint 2** : GSC + DataForSEO + backlog generator Claude.

Détail dans `docs/WORKFLOWS/` et dans la base Obsidian.

## Licence

Propriétaire — Quentin Barroin / Novera.
