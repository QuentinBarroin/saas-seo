---
description: Charge le contexte produit avant toute session de code sur saas-audit-seo.
---

Avant de répondre à la prochaine demande utilisateur, charge le contexte projet en exécutant ces étapes.

## Étape 1 — contexte du repo
Lis ces fichiers à la racine :
1. `CLAUDE.md` — invariants opérationnels.
2. `ARCHITECTURE.md` — couches et imports autorisés.
3. `DATA_MODEL.md` — schemas Prisma.
4. `API_SPEC.md` — endpoints.
5. `MODEL_POLICY.md` — quel modèle Claude utiliser selon la tâche.

## Étape 2 — contexte produit (hors-repo, Obsidian)

La planification produit complète vit dans Obsidian :
`C:\Users\quent\Documents\Obsidian\Second cerveau Quentin\brain\05_projects\saas-seo-audit\`

Lis dans cet ordre :
1. `README.md` — vue d'ensemble.
2. `01_context/vision-produit.md` — promesse.
3. `03_scope/mvp.md` — user stories MVP.
4. `02_decisions/decisions-architecture.md` + `decisions-produit.md` — ADRs et PDRs actifs.
5. `06_questions/decisions-a-demander-a-quentin.md` — bloqueurs non résolus.
6. Le sprint en cours dans `07_execution/sprint-N.md`.

## Étape 3 — récap de calibration (5–6 lignes max)

Affiche un récap structuré :
- Promesse produit (1 phrase).
- Sprint courant + objectif.
- Question bloquante ouverte qui pourrait empêcher l'action demandée.
- Mon rôle pour la session (PO / Architecte / Backend / Frontend / SEO-Data / QA).
- Fichiers clés à toucher pour la tâche.

## Étape 4 — confirmation avant action

Si la demande croise une décision non encore tranchée par Quentin (entrée Q-NNN ouverte) → demander avant de coder.

Si la demande implique de modifier le schema Prisma, le contrat d'API, ou un ADR → proposer un draft d'ADR-N avant code.
