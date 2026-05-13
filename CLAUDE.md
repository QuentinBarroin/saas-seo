# CLAUDE.md — Agent operating guide

Opérationnel immédiat pour Claude Code travaillant sur `saas-audit-seo`. Tout est dérivé du scaffold réel et de la base Obsidian de cadrage produit. Incertitudes marquées `UNCERTAIN`.

## 1. Vue d'ensemble²

**Produit** : `saas-audit-seo` — SaaS interne d'audit SEO/GEO transformant un audit en backlog Claude Code exécutable.
**Statut** : scaffold initial — aucune feature SEO encore en place. Sprint 0 en cours.
**Type** : SaaS B2B mono-utilisateur (1 utilisateur : Quentin Barroin).
**Public cible** : équipe Novera (interne), pour auditer Shooting Pilot, Novera Talent, nettoyage-auto, Dealoxa, Social Publisher.
**Langue UI principale** : fr.

## 2. Architecture résumée

```
                ┌──────────────────────────────┐
                │       NEXT.JS 15 APP         │
                │  app/  (App Router, RSC)     │
                │  app/api/*/route.ts          │
                └──────┬───────────────┬───────┘
                       │ Prisma        │ Webhook
                       ▼               ▼
                ┌─────────────┐    ┌──────────────┐
                │  SUPABASE   │    │   INNGEST    │
                │  Postgres   │    │  Workflows   │
                │  Auth       │    │  d'audit     │
                │  Storage    │    └──────┬───────┘
                └─────────────┘           │ HTTPS
                                          ▼
                        Services externes : GSC, DataForSEO,
                                           Anthropic (Claude)
```

Couches logiques :

- `app/` : routes (pages + API), Server Components par défaut.
- `lib/` : domaine partagé (db, supabase, inngest, crypto, scoring, ai, crawler, repo-scan, connectors).
- `prisma/` : schema + migrations + seed.

Détails dans [ARCHITECTURE.md](./ARCHITECTURE.md).

## 3. Stack

Versions exactes (cf. `package.json`) :

- Next.js `^15.1.0` (App Router)
- React `^19.0.0`
- TypeScript `^5.7.2` (strict + noUncheckedIndexedAccess)
- Tailwind CSS `^3.4.17` + design system **"Nv" Novera** (navy `#0F172A` + gold `#D4B97E` + Manrope, scope `data-theme="nv"` sur `<body>`). Composants : `@/components/nv` (barrel, 11 atomes `Nv*`). Tokens : `app/nv.css`. Doc Obsidian : `04_architecture/design-system.md`. ADR : `02_decisions/decisions-architecture.md` ADR-011.
- Prisma `^6.1.0` (+ `@prisma/client`)
- `@supabase/ssr ^0.5.2`, `@supabase/supabase-js ^2.46.2`
- Inngest `^3.27.0`
- `@anthropic-ai/sdk ^0.40.0` — Claude (Sonnet 4.6 par défaut, voir MODEL_POLICY.md)
- Zod `^3.24.1`, react-hook-form `^7.54.0`
- Cheerio `^1.0.0`, undici `^7.0.0`, robots-parser `^3.0.1`, ts-morph `^24.0.0`
- ESLint 9 flat + Prettier
- Vitest `^2.1.8`
- Node ≥ 20, pnpm ≥ 8

## 4. Structure du repo (points chauds)

```
saas-audit-seo/
├── app/
│   ├── (app)/                      # group route authentifié (sidebar)
│   │   ├── dashboard/page.tsx
│   │   ├── audit-technique/page.tsx
│   │   ├── keywords/page.tsx
│   │   ├── serp/page.tsx
│   │   ├── content-gap/page.tsx
│   │   ├── backlog/page.tsx
│   │   └── settings/integrations/page.tsx
│   ├── api/
│   │   ├── health/route.ts
│   │   └── inngest/route.ts        # endpoint Inngest
│   ├── login/page.tsx              # auth Supabase (form + Server Action)
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── db.ts                       # Prisma singleton
│   ├── env.ts                      # validation env Zod
│   ├── supabase/{client,server}.ts
│   ├── inngest/{client,functions}.ts
│   ├── crypto.ts                   # AES-256-GCM credentials
│   ├── utils.ts                    # cn() Tailwind
│   ├── scoring/rules.ts            # à remplir Sprint 1 (S1-01)
│   └── ai/claude.ts                # wrapper Anthropic SDK
├── prisma/
│   ├── schema.prisma               # 10 modèles MVP
│   └── seed.ts
├── docs/
│   └── WORKFLOWS/                  # 5 workflows pas-à-pas
├── .claude/
│   ├── settings.json               # permissions allowlist
│   ├── commands/charger-contexte.md
│   └── agents/                     # 6 sub-agents
├── tests/
└── docker-compose.yml              # Postgres 16 sur :5434
```

## 5. Commandes essentielles

```bash
pnpm install
pnpm dev                            # localhost:3000
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm db:up                          # Postgres local (alternative à Supabase distant)
pnpm prisma:migrate
pnpm prisma:seed
pnpm dlx inngest-cli@latest dev     # dev server Inngest, :8288
```

## 6. Conventions de code

- Fichiers : kebab-case.
- Composants React : PascalCase.
- Hooks : camelCase préfixé `use`.
- Alias d'import : `@/*` (ex. `import { db } from '@/lib/db'`).
- Validation runtime : **Zod obligatoire** sur toutes les entrées API et les sorties IA.
- Pas de `TODO`/`FIXME` en code → créer une entrée dans `KNOWN_ISSUES.md`.
- Pas de comments expliquant le quoi du code (noms d'identifiants > comments). Comments uniquement sur le pourquoi non-évident.

## 7. Conventions d'architecture

- **Server Components par défaut**. `"use client"` uniquement où interactivité nécessaire.
- **Pas de fetching client** en MVP. Server Components + `revalidatePath`.
- **Pas de state global** (Zustand/Redux). React state suffit.
- **Pas de logique métier dans `app/api/*/route.ts`** → tout dans `lib/`.
- **Pas d'import direct Prisma dans une route** : passer par un module `lib/` qui encapsule.
- **Idempotence des steps Inngest** : DELETE-then-INSERT par `auditId`, ou UPSERT.

## 8. Règles de modification

1. **Changement de contrat API** → ordre obligatoire : update API_SPEC.md → schema Zod → route handler → consommateur frontend → tests.
2. **Changement de schéma Prisma** → toujours `pnpm prisma:migrate` + regénérer client + vérifier les usages.
3. **Toute route authentifiée** passe par le middleware Supabase. Pas de bypass.
4. **Tout credential externe** est stocké via `lib/crypto.ts` (AES-256-GCM), jamais en clair.
5. **Toute évolution architecturale** → ADR dans la base Obsidian `02_decisions/decisions-architecture.md` AVANT code.
6. **Toute nouvelle slash command** → fichier dans `.claude/commands/<nom>.md`, jamais ailleurs.
7. **Tout nouveau sub-agent** → fichier dans `.claude/agents/<nom>.md` avec persona explicite.
8. **Toute migration Prisma** → fichier nouveau, jamais de modification d'une migration déjà committée.
9. **Tout TODO/FIXME** → entrée KNOWN_ISSUES.md avec sévérité.

## 9. Règles de sécurité

- **Auth** : Supabase Auth email/password, mono-user. Wirée via `middleware.ts` + Server Actions `app/login/actions.ts`.
- **RLS Supabase** activé dès le départ même en mono-user (bonne hygiène).
- **CSP strict** dans Next.js, pas d'eval, pas d'inline JS hors hash.
- **Secrets** : `.env` jamais committé. `.env.example` est la source de vérité de la liste.
- **Credentials API tiers** : chiffrés AES-256-GCM via `lib/crypto.ts`, stockés dans `SeoProject.integrationsEnc`.
- **Pagination max serveur** : 100 (limite par défaut côté API).
- **Le SaaS lui-même n'est pas indexable** : `app/layout.tsx` force `robots: { index: false }` + `public/robots.txt` global Disallow.

## 10. Stratégie de test

- **Vitest** uniquement en MVP. Playwright et testcontainers en Lot 1+.
- Couverture cible : ≥ 70 % sur `lib/scoring`, `lib/crawler`, `lib/repo-scan`, `lib/connectors`, `lib/crypto`.
- **Golden audits** : snapshot des audits Shooting Pilot dans `tests/fixtures/golden-shooting-pilot-v*.json`. Delta vs précédent doit être justifié.
- Pas de tests E2E en MVP. Détail dans TEST_STRATEGY.md.

## 11. Pièges connus

- Voir KNOWN_ISSUES.md.
- Au scaffold : aucun bug connu, juste des dépendances externes à provisionner (cf. `.env.example`).

## 12. Checklist avant toute implémentation

- [ ] Lu ARCHITECTURE.md, DATA_MODEL.md, API_SPEC.md, MODEL_POLICY.md.
- [ ] Vérifié qu'aucune question bloquante Q-NNN n'empêche la tâche (base Obsidian `06_questions/decisions-a-demander-a-quentin.md`).
- [ ] Mon changement respecte la séparation routes/lib.
- [ ] Si je touche au contrat API, j'ai aligné API_SPEC.md ET le schema Zod côté Server Component consommateur.
- [ ] Si je touche au schéma Prisma, j'ai prévu une migration.
- [ ] Pas d'import direct Prisma dans une page ou route handler — passer par `@/lib/db`.

## 13. Checklist avant commit / PR

- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test` passent.
- [ ] Aucun `console.log` (utiliser un logger ou retirer).
- [ ] Aucun secret dans le diff.
- [ ] Aucun `any` ajouté.
- [ ] Description PR explique le **pourquoi** + référence l'ID de tâche (ex : `S1-02`).
- [ ] CLAUDE.md / ARCHITECTURE.md / DATA_MODEL.md / API_SPEC.md mis à jour si la PR les impacte.
- [ ] Journal d'exécution mis à jour côté Obsidian (`08_logs/journal-execution.md`).
