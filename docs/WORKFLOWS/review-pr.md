# Workflow — Reviewer une PR

À utiliser par l'agent QA OU par l'Architecte selon la nature de la PR.

## 1. Checks automatiques

Vérifier dans la CI GitHub Actions :
- ✅ `pnpm lint` passe.
- ✅ `pnpm typecheck` passe.
- ✅ `pnpm test` passe.
- ✅ `pnpm build` passe.

Si un check échoue → demander correction avant review humaine.

## 2. Cohérence avec les invariants

- [ ] Pas de `any` ajouté.
- [ ] Pas de `console.log` (sauf seed/tests).
- [ ] Pas de secret dans le diff (`grep -E 'SUPABASE|ANTHROPIC|GOOGLE|DATAFORSEO' diff`).
- [ ] Pas de `TODO` ou `FIXME` sans entrée `KNOWN_ISSUES.md` correspondante.
- [ ] Validation Zod sur toute nouvelle entrée API.
- [ ] Pas d'import direct `@prisma/client` hors `@/lib/db`.
- [ ] Pas de `"use client"` injustifié.
- [ ] Pas de modification d'une migration Prisma déjà committée.

## 3. Critères d'acceptation de la user story

Lire la user story dans la base Obsidian `07_execution/sprint-N.md`.

Cocher chaque critère d'acceptation. Si un seul critère manque → CHANGES_REQUESTED.

## 4. Tests

- Couverture sur le module touché : ≥ 70 % (ou justification dans la PR).
- Pas de tests skip non justifiés.
- Si le module est dans `lib/scoring`, `lib/crawler`, `lib/repo-scan`, `lib/crypto` → couverture ≥ 80 %.

## 5. Documentation

- [ ] `API_SPEC.md` à jour si nouveau endpoint.
- [ ] `DATA_MODEL.md` à jour si schema Prisma modifié.
- [ ] `ARCHITECTURE.md` à jour si nouvelle couche / dépendance.
- [ ] `CLAUDE.md` à jour si nouvelle règle d'agent.
- [ ] `KNOWN_ISSUES.md` à jour si bug résolu.

## 6. Golden audit (si pertinent)

Si la PR touche `lib/scoring/*` :
- Le score de Shooting Pilot a-t-il changé ?
- Si oui : delta documenté dans la PR ?
- Le golden audit a-t-il été mis à jour ?

## 7. Verdict

```
Verdict : APPROVED | CHANGES_REQUESTED | BLOCKED

Critères d'acceptation : x/y cochés
Couverture tests : <module> = X%
Doc-sync : OK / KO

Points à corriger (si CHANGES_REQUESTED) :
- <fichier:ligne> — <description>
```

## Anti-patterns reviewer

- Approuver sans avoir lancé la branche en local quand c'est une feature UI.
- Approuver une PR de bugfix sans test associé.
- Demander des changements sans pointer le fichier:ligne.
- Bloquer pour des préférences personnelles (style mineur).
