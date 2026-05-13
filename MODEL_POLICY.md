# MODEL_POLICY.md

## Purpose

Cadrer comment Claude Code choisit le modèle Anthropic selon la tâche, le risque et l'impact business.

## Core Principle

Utiliser le modèle le plus léger qui peut faire le job. Modèle par défaut : **`claude-sonnet-4-6`**. Escalader vers Opus uniquement pour de l'analyse profonde, des trade-offs architecturaux, ou des changements critiques.

## Task Classification

### SIMPLE
Faible risque, localisé, évident.
**Exemples** : tweak UI, changement de copy, README, typo, ajout d'un champ optionnel sur une page.
**Modèle recommandé** : `claude-sonnet-4-6`.

### STANDARD
Implémentation normale, scope clair.
**Exemples** : CRUD endpoint, formulaire, validation Zod, bugfix isolé, tests unitaires d'un module existant.
**Modèle recommandé** : `claude-sonnet-4-6`.

### COMPLEX
Réflexion architecturale, plusieurs fichiers, trade-offs.
**Exemples** : feature multi-step, refactor cross-couche, design d'un schema Prisma, OAuth flow, performance, workflow IA, logique de scoring complexe.
**Modèle recommandé** : `claude-opus-4-7`.

### CRITICAL
Risque élevé : sécurité, intégrité des données, prod, irréversible.
**Exemples** : auth, RLS Supabase, gestion des credentials chiffrés, paiements (N/A en MVP), suppression de données, migrations prod, isolation tenant, calcul de scoring SEO public.
**Modèle recommandé** : `claude-opus-4-7` **obligatoire** avant implémentation.

## Required Pre-Task Output

Avant d'exécuter une tâche significative, Claude Code doit afficher :

```
Classification : SIMPLE | STANDARD | COMPLEX | CRITICAL
Recommended model : <model>
Reason : <pourquoi cette classification>
Main risk : <quoi peut casser>
Action plan : <étapes en puces>
```

## Escalation triggers

Escalader d'une classe (ex : STANDARD → COMPLEX) si :

- La tâche touche plusieurs couches du système.
- Plusieurs approches techniques possibles, choix non trivial.
- Première tentative a échoué.
- Bug intermittent ou difficile à reproduire.
- Incertitude sur l'intégrité des données.
- Impact users / billing / auth / sécurité / production.
- Trade-off stratégique requis (perf vs lisibilité, etc.).

## Anti-patterns

- Utiliser Opus pour un changement de copy → gaspillage.
- Utiliser Sonnet pour une migration Prisma destructive → risque.
- Coder une feature CRITICAL sans annonce du plan préalable → STOP.

## Budget MVP

- Budget IA : 30-100 €/mois max (validé par Quentin).
- Prompt caching **activé systématiquement** sur le contexte projet partagé (gain ~80 % sur les audits récurrents).
- Pas de génération massive de pages en MVP.

## Notes runtime

- `lib/ai/claude.ts` expose `DEFAULT_MODEL`. Le mettre à jour quand un nouveau Sonnet stable sort.
- Pour les tâches CRITICAL, override explicite dans le code (ne pas se fier au défaut).
