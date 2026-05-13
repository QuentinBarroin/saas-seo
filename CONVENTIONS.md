# CONVENTIONS.md

## Nommage

- Fichiers : `kebab-case.ts` / `kebab-case.tsx`. Exceptions : composants React = PascalCase (ex: `BacklogTable.tsx`).
- Variables / fonctions : `camelCase`.
- Constantes : `SCREAMING_SNAKE_CASE` uniquement pour les vraies constantes (env vars, magic numbers fixes).
- Types / interfaces : `PascalCase`.
- Branches Git : `sprint-N/<tache-id>` (ex: `sprint-0/s0-04-auth-supabase`).
- Commits : conventionnels (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`).

## Structure des imports

Ordre des imports (séparé par lignes vides) :

```ts
// 1. Node built-ins
import { randomBytes } from 'node:crypto';

// 2. External packages
import { z } from 'zod';
import { NextResponse } from 'next/server';

// 3. Internal aliases
import { db } from '@/lib/db';
import { encrypt } from '@/lib/crypto';

// 4. Relative imports
import { somethingLocal } from './helper';
```

Alias : `@/*` pointe sur la racine du projet (cf. `tsconfig.json` paths).

## Server vs Client Components

- **Server par défaut**. Aucun `"use client"` sans raison écrite (commentaire en haut du fichier).
- Marqueurs `"use client"` autorisés pour :
  - Formulaires (react-hook-form).
  - Drag & drop (ex: clusters keywords).
  - State local interactif (modals, sidebars toggleable).
- Pas de `"use client"` sur les pages elles-mêmes — wrapper d'un composant client si besoin.

## Routes et navigation

- `app/(app)/**` : routes authentifiées, sidebar visible.
- `app/login`, `app/page.tsx`, `app/api/health` : public.
- `app/api/inngest` : protégé par signature Inngest (pas par auth user).
- Typed routes activés (`experimental.typedRoutes`) → les `<Link href>` sont typés.

## Validation et types

- **Zod** pour toute entrée API + sortie IA + variables d'environnement.
- Pas de `any`. Si vraiment nécessaire → `unknown` + narrowing + commentaire qui explique.
- Pas de `as` cast sauf après narrowing.

## Composants UI

- Tailwind only. Pas de CSS Modules, pas de styled-components.
- shadcn/ui copié dans `components/ui/`. Pas de dépendance NPM.
- `cn()` (de `@/lib/utils`) pour merge de classes.
- États gérés : loading, error, empty. Toujours.
- Pas d'animations en MVP.

## Logs

- `console.warn` / `console.error` autorisés (cf. eslint config).
- `console.log` interdit en code applicatif. Autorisé dans `prisma/seed.ts` et tests.
- En jobs Inngest : utiliser le logger Inngest (`logger`) plutôt que console.

## Tests

- Vitest seul en MVP.
- Fixtures dans `tests/fixtures/`. Golden audits dans `tests/fixtures/golden-shooting-pilot-v*.json`.
- Pas d'`it.skip` sans entrée associée dans `KNOWN_ISSUES.md`.

## SEO du SaaS lui-même

- `app/layout.tsx` force `robots: { index: false, follow: false }`.
- `public/robots.txt` global Disallow.
- Pas de page `/dashboard`, `/settings` indexable.

## Documentation

- Toute évolution architecturale → ADR base Obsidian.
- Toute évolution produit → PDR base Obsidian.
- Tout TODO/FIXME → entrée KNOWN_ISSUES.md avec sévérité.
- Mise à jour CLAUDE.md / ARCHITECTURE.md / DATA_MODEL.md / API_SPEC.md à chaque PR qui les impacte.
