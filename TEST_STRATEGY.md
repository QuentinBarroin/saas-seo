# TEST_STRATEGY.md

## Outils retenus

| Type | Outil | Statut |
|---|---|---|
| Unitaires | Vitest 2 | MVP |
| Intégration | Vitest (pas de Supertest, on appelle les fonctions `lib/` directement) | MVP |
| E2E | Playwright | Lot 1+ |
| Tests DB | Testcontainers (Postgres) | Lot 1+ |

## Pyramide

- **Beaucoup** d'unitaires sur `lib/scoring`, `lib/crawler`, `lib/repo-scan`, `lib/connectors`, `lib/crypto`.
- **Peu** d'intégration (1-2 cas par feature critique : workflow Inngest sur fixtures).
- **Aucun** E2E en MVP.
- **Golden audits** : snapshots de référence sur Shooting Pilot.

## Couverture cible

- `lib/scoring/**` : ≥ 80 %.
- `lib/crawler/**` : ≥ 70 %.
- `lib/repo-scan/**` : ≥ 70 %.
- `lib/connectors/**` : ≥ 70 % (mocks HTTP).
- `lib/crypto.ts` : 100 % (round-trip + erreurs).
- Routes API : tests d'erreur/validation par route critique.

## Fixtures

- `tests/fixtures/html/` : pages HTML pour tester le crawler.
- `tests/fixtures/repo/` : mini-repo Next.js pour tester le scan.
- `tests/fixtures/dataforseo/` : réponses DataForSEO capturées et anonymisées.
- `tests/fixtures/gsc/` : réponses GSC.
- `tests/fixtures/claude/` : sorties Claude de référence pour valider Zod.
- `tests/fixtures/golden-shooting-pilot-v*.json` : snapshots de référence des audits Shooting Pilot.

## Pratiques

- **Pas de mocks pour le critique** : `lib/crypto`, `lib/scoring`, `lib/repo-scan` tournent sur fixtures réelles.
- **Mocks HTTP** uniquement pour DataForSEO et GSC (réseau externe).
- **Tests skip** interdits sans entrée `KNOWN_ISSUES.md` associée.
- **AAA** : Arrange / Act / Assert. Lisible.
- **Pas de tests qui font dormir** (`setTimeout`). Si nécessaire → utiliser les fake timers Vitest.

## Workflow QA fin de sprint

1. `pnpm lint && pnpm typecheck && pnpm test`.
2. Lancer un audit Shooting Pilot manuel.
3. Comparer avec le dernier golden audit.
4. Si delta : documenter dans la PR + mettre à jour le golden si justifié.

## Tests bootstrap au scaffold

- `tests/sample.test.ts` : sanity check (vérifie que Vitest tourne). À retirer dès qu'on a un vrai test.

## Gaps connus (Lot 1+)

- Pas de tests E2E → ajouter Playwright dès Lot 1.
- Pas de tests d'intégration DB réelle → ajouter Testcontainers dès Lot 1.
- Pas de mutation testing → si la qualité devient un problème, envisager Stryker.
