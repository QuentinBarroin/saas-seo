# ARCHITECTURE.md

Vue technique des couches, imports autorisés/interdits, et patterns transverses. Toute modification structurelle passe par un ADR (base Obsidian `02_decisions/decisions-architecture.md`).

## Schéma macro

```
┌─────────────────────────────────────────────────────────────┐
│                       NEXT.JS 15 APP                         │
│                                                              │
│   ┌──────────────────┐         ┌──────────────────────┐     │
│   │ app/             │         │ app/api/             │     │
│   │   (app)/         │         │   health/route.ts    │     │
│   │   layout.tsx     │         │   inngest/route.ts   │     │
│   │   page.tsx       │         │   <future routes>    │     │
│   └────────┬─────────┘         └──────────┬───────────┘     │
│            │                              │                  │
│            └──────────────┬───────────────┘                  │
│                           ▼                                  │
│                       lib/                                   │
│                                                              │
│   ┌─────────────────────────────────────────────────────┐   │
│   │  domain partagé (mono-package)                       │   │
│   │  - db.ts (Prisma client)                             │   │
│   │  - env.ts (validation env)                           │   │
│   │  - supabase/{client,server}.ts                       │   │
│   │  - inngest/{client,functions}.ts                     │   │
│   │  - crypto.ts (AES-256-GCM credentials)               │   │
│   │  - scoring/ (rules, detectors, aggregate)            │   │
│   │  - crawler/ (Cheerio + robots-parser)                │   │
│   │  - repo-scan/ (ts-morph)                             │   │
│   │  - connectors/ (gsc, dataforseo, anthropic)          │   │
│   │  - ai/ (Claude wrapper + prompts)                    │   │
│   │  - utils.ts (cn helper)                              │   │
│   └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
            │                      │
            │ Prisma               │ webhook
            ▼                      ▼
    ┌──────────────┐         ┌──────────────┐
    │   SUPABASE   │         │   INNGEST    │
    │   Postgres   │         │   Workflows  │
    │   Auth       │         └──────┬───────┘
    │   Storage    │                │ HTTPS
    └──────────────┘                ▼
                              Services externes :
                              - GSC API
                              - DataForSEO API
                              - Anthropic API (Claude)
```

## Tableau des couches

| Couche | Rôle | Imports autorisés | Imports interdits |
|---|---|---|---|
| `app/(app)/**` | Pages UI authentifiées | `@/lib/*`, `@/components/*`, `react`, `next/*` | `@prisma/client` direct |
| `app/api/**/route.ts` | Routes API HTTP | `@/lib/*`, `zod`, `next/server` | Logique métier (déléguer à `lib/`) |
| `lib/db.ts` | Prisma client singleton | `@prisma/client` | — |
| `lib/scoring/**` | Règles + détecteurs + scoring | `@/lib/scoring/*` interne | Réseau (HTTP), `@/lib/db` direct |
| `lib/crawler/**` | Crawler Cheerio | `cheerio`, `robots-parser`, `undici` | `@/lib/db`, Next.js |
| `lib/repo-scan/**` | Scan repo Next.js | `ts-morph`, `node:fs`, `node:path` | `@/lib/db`, Next.js |
| `lib/connectors/**` | Clients API externes | `undici`, `@/lib/crypto`, `@/lib/env` | `@/lib/db` direct |
| `lib/inngest/**` | Workflows | `inngest`, `@/lib/*` | — |
| `lib/ai/**` | Wrapper Anthropic SDK | `@anthropic-ai/sdk`, `zod`, `@/lib/env` | `@/lib/db` (passer par usecase) |
| `lib/crypto.ts` | Chiffrement creds | `node:crypto`, `@/lib/env` | — |
| `prisma/` | Schema + migrations | — | — |

Règle générale : **lib/ ne dépend jamais de app/**.

## Flow d'un audit (cible Sprint 1-2)

```
UI: POST /api/projects/{id}/audits
  → INSERT SeoAudit(status=pending)
  → inngest.send("audit/requested", { auditId, projectId })
  → 202 Accepted

Workflow Inngest "run-audit" :
  step.run("init")                     → status=running
  step.run("crawl")        ─┐
  step.run("repo-scan")     │  parallèle
  step.run("import-gsc")    │
  step.run("serp")         ─┘
  step.run("findings")                 → applique catalogue de règles
  step.run("competitors")              → analyse SerpResult
  step.run("content-gap")              → architecture cible vs routes
  step.run("score")                    → 5 axes + score global
  step.run("backlog")                  → appel Claude, anti-hallu
  step.run("finalize")                 → status=done
```

Détails : base Obsidian `04_architecture/flows.md`.

## Patterns de validation

- **Zod sur les entrées API** : toujours.
- **Zod sur les sorties IA** : toujours. Si la sortie Claude ne parse pas → reject + log + finding "ai-output-invalid".

## Anti-patterns interdits

- `@prisma/client` importé dans une page ou un composant.
- `fetch` côté client en MVP (utiliser Server Components + revalidate).
- Logique métier dans `route.ts`.
- State global (Zustand/Redux) en MVP.
- Custom CSS au-delà de Tailwind.
- Tests E2E en MVP.

## Choix infra MVP

- **Hébergement** : Vercel (front+back) + Supabase (DB+Auth+Storage) + Inngest cloud.
- **Aucun cache externe** (Redis, etc.) — Postgres et Next.js cache suffisent.
- **Pas de Docker en prod**, Docker uniquement pour Postgres local dev (`docker-compose.yml`).
- **Pas de monorepo** : un seul package racine.

## Évolutions prévues (Lot 1+)

- Cron Inngest (GSC quotidien, SERP hebdo, crawl hebdo).
- Connecteur Plausible.
- Playwright pour rendu navigateur sur SPA.
- Exports CSV / GitHub Issues / Linear.

Voir la base Obsidian `03_scope/lot-1.md` et `03_scope/lot-2.md`.
