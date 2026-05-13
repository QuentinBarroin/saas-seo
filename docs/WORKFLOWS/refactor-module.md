# Workflow — Refactor un module

## 1. Justifier

Un refactor doit avoir une raison écrite (perf, lisibilité, dette technique mesurée, préparation à une feature future).

Pas de refactor "esthétique" sans valeur mesurable.

## 2. Capturer la surface

- Lister les fichiers concernés.
- Identifier les consommateurs externes du module (qui importe quoi).
- Lister les tests existants.
- Si pas de tests → en écrire d'abord (le refactor doit prouver l'iso-comportement).

## 3. Iso-comportement

Avant de modifier le code :
- Lancer les tests existants → tout doit passer.
- Si un test est skip → décider : on le réactive, ou on documente pourquoi il reste skip.

## 4. Refactor

- Pas de changement de comportement public dans cette PR.
- Pas d'ajout de feature.
- Si l'API change → créer une PR séparée "feat:" + une PR "refactor:".

## 5. Re-vérification

```bash
pnpm test          # 100 % vert
pnpm lint
pnpm typecheck
pnpm build
```

## 6. Documentation

- Si le refactor change l'organisation des couches → mettre à jour `ARCHITECTURE.md`.
- Si le refactor introduit un nouveau pattern → l'ajouter à `CONVENTIONS.md`.
- Si le refactor était listé dans `REFACTOR_PLAN.md` → cocher / supprimer l'entrée.

## 7. PR

- Titre : `refactor: <module>`.
- Description :
  - Quoi (en 1 phrase).
  - Pourquoi (la raison documentée à l'étape 1).
  - Iso-comportement prouvé par : <tests/golden audit>.
  - Effets de bord : aucun (ou documentés).

## Anti-patterns

- Refactor sans tests préalables.
- Mélanger refactor + feature dans la même PR.
- "Pendant que j'y suis" → créer une issue séparée.
- Renommer des fichiers + modifier leur contenu dans le même commit → Git suit mal.
