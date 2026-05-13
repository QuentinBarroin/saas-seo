# Workflow — Corriger un bug

## 1. Reproduire

- Reproduire le bug en local. Sans repro fiable → ne pas patcher à l'aveugle.
- Capturer : entrée exacte, sortie observée, sortie attendue, version du code.

## 2. Test qui échoue

Écrire un test Vitest qui reproduit le bug. Il doit échouer en l'état.

Placement :
- Bug dans `lib/scoring/*` → `tests/scoring/<rule>.test.ts`.
- Bug dans une route API → `tests/api/<route>.test.ts`.
- Bug dans un composant UI → `tests/components/<comp>.test.tsx`.

## 3. Fix minimal

- Modifier UNIQUEMENT ce qui est nécessaire.
- Pas de refactor opportuniste dans la PR de bugfix.
- Si le fix nécessite un refactor → créer une issue séparée + entrée `REFACTOR_PLAN.md`.

## 4. Re-run

```bash
pnpm test           # le test doit passer
pnpm lint
pnpm typecheck
```

## 5. Golden audit (si bug touche le scoring)

Si la correction change un score :
- Vérifier que le delta est explicable.
- Mettre à jour le golden audit Shooting Pilot si justifié.
- Documenter dans la PR.

## 6. KNOWN_ISSUES.md

- Si le bug y était listé → déplacer l'entrée vers "Résolus" avec date.
- Si pas listé mais c'est un cas qui pourrait se reproduire (config particulière) → ajouter une entrée pour mémoire.

## 7. PR

- Titre : `fix: <description courte du symptôme>`.
- Description :
  - Symptôme exact.
  - Cause racine.
  - Pourquoi le fix marche.
  - Lien vers le test qui prouve.
- Capture d'écran si bug UI.

## Anti-patterns

- Patcher sans test → la régression reviendra.
- "Workaround" sans entrée KNOWN_ISSUES → la dette s'oublie.
- Refactor opportuniste dans le même commit que le fix → noise pour reviewer.
- Modifier le golden audit sans justification écrite.
