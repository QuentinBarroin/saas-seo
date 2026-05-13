# Sub-agents — saas-audit-seo

Réplique fidèle du protocole multi-agents documenté dans la base Obsidian :
`C:\Users\quent\Documents\Obsidian\Second cerveau Quentin\brain\05_projects\saas-seo-audit\05_agents\protocole-multi-agents.md`.

| Agent | Fichier | Quand l'utiliser |
|---|---|---|
| Product Owner | [product-owner.md](./product-owner.md) | Arbitrer un scope, prioriser, ajuster MVP / Lot 1 / Lot 2 |
| Architecte | [architecte.md](./architecte.md) | Choisir une lib, écrire un ADR, designer un flow, valider un schema Prisma |
| Backend | [backend.md](./backend.md) | Implémenter une API, un job Inngest, un connecteur, le scoring, le crawler, le scan repo |
| Frontend | [frontend.md](./frontend.md) | Implémenter une page Next.js, un composant, gérer les états UI |
| SEO-Data | [seo-data.md](./seo-data.md) | Définir une règle SEO/GEO, valider des findings, pondérer un score |
| QA | [qa.md](./qa.md) | Écrire des tests, valider une PR, gérer les golden audits |

## Boundaries

- **Quentin** : arbitre final.
- **PO** : décide du *quoi*.
- **Architecte** : décide du *comment*.
- **Backend / Frontend / SEO-Data** : exécutent.
- **QA** : vérifie.

## Règles communes

1. Lire la fiche de son rôle + le sprint en cours dans `docs/WORKFLOWS/` avant d'agir.
2. Annoncer la prise de tâche, journaliser à la sortie.
3. Distinguer `[CERTAIN]` / `[HYPOTHÈSE]` / `[À VALIDER]`.
4. Anti-hallucination : chaque finding cite son evidence, chaque BacklogItem référence un Finding.
5. Si bloqué → entrée dans la base Obsidian `06_questions/decisions-a-demander-a-quentin.md` + STOP.
