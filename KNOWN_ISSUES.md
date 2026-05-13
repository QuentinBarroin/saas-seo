# KNOWN_ISSUES.md

Légende :
- 🔴 **bloquant** — empêche d'avancer.
- 🟠 **important** — à traiter dans le sprint en cours.
- 🟡 **mineur** — peut attendre.
- ❓ **à vérifier** — incertain, à investiguer.

## En cours

| Sévérité | Titre | Origine | Lien |
|---|---|---|---|
| ❓ | URL de production non encore décidée | Sprint 0 | base Obsidian `06_questions/decisions-a-demander-a-quentin.md#Q-012` |
| ❓ | Anthropic SDK : version exacte du modèle Sonnet 4.6 à confirmer | scaffold | `lib/ai/claude.ts` utilise `claude-sonnet-4-5` en placeholder |
| 🟡 | Catalogue de règles SEO vide (`lib/scoring/rules.ts`) | scaffold | tâche S1-01 |
| 🟡 | Pas de tests E2E (Playwright) en MVP — décision actée | décision | base Obsidian `02_decisions/decisions-produit.md#PDR-...` |
| ❓ | Dépendance NPM `@anthropic-ai/sdk@0.40.0` : vérifier dernière version au moment de l'install | scaffold | `package.json` |

## Résolus (trace historique)

| Date | Sévérité | Titre | Résolution |
|---|---|---|---|
| 2026-05-13 | 🟡 | Auth Supabase non encore wirée + middleware protection `app/(app)/*` | S0-04 : Server Actions signIn/signOut + middleware racine + cookies HttpOnly via `@supabase/ssr` |

## Comment ajouter une entrée

1. Sévérité (icône) + titre court.
2. Origine : nom du sprint, PR, ou "scaffold".
3. Lien : fichier impacté, ID de décision, ou ticket externe.
4. Si résolu : déplacer dans "Résolus" avec date de résolution.
