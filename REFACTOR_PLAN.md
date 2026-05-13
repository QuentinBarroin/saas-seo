# REFACTOR_PLAN.md

Idées d'évolution / dette à surveiller. Aucune urgence en MVP : tout est neuf.

## Quick wins (≤ 1 jour)

- Aucun pour l'instant (scaffold initial).

## Moyen terme (1-3 jours)

- **RM-001** — Câbler un logger structuré (pino) côté serveur, sortie JSON. Aujourd'hui : `console`. Déclencheur : premier bug à diagnostiquer en prod.
- **RM-002** — Extraire les schemas Zod de validation dans `lib/validation/` plutôt qu'inline dans les routes. Déclencheur : > 5 routes API actives.
- **RM-003** — Ajouter Sentry quand on dépasse 1 utilisateur ou qu'on a un premier bug en prod.

## Structurant (planifier sprint dédié)

- **RS-001** — Si le scope passe à multi-tenant (post Lot 2), refactor complet de l'auth + RLS Supabase. ADR obligatoire avant.
- **RS-002** — Si la performance crawler devient un problème (> 100 pages), passer en parallèle Playwright workers OU externaliser le crawl vers un service dédié.
- **RS-003** — Si DataForSEO devient trop coûteux, ajouter un cache 24h en DB pour les SERP identiques.

## Anti-patterns à éviter

- Ne pas extraire de helper avant 3 usages.
- Ne pas ajouter de cache avant d'avoir mesuré.
- Ne pas migrer vers un autre ORM sans ADR + ROI clair.
- Ne pas ajouter de queue Kafka/RabbitMQ — Inngest suffit.

## Lien base Obsidian

Les décisions de scope (passer une feature en Lot 2, refuser une demande) sont tracées dans `02_decisions/decisions-produit.md` côté Obsidian, pas ici.
