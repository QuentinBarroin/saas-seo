# Workflow — Ajouter une entité (table Prisma)

À utiliser quand on doit ajouter une nouvelle table OU modifier significativement une table existante.

## 1. ADR obligatoire

Toute nouvelle entité ou évolution majeure du schema passe par un ADR dans la base Obsidian `02_decisions/decisions-architecture.md`.

L'ADR documente :
- Le pourquoi (besoin produit).
- Les champs et leurs contraintes.
- Les relations.
- Les index.
- Les impacts sur les tables existantes.

## 2. Modifier `prisma/schema.prisma`

Ajouter le nouveau model. Conventions :

- `id String @id @default(cuid())` partout.
- `createdAt DateTime @default(now())` si la donnée a une notion temporelle.
- `updatedAt DateTime @updatedAt` si mutable.
- FK : `@relation(fields: [...], references: [id], onDelete: Cascade)` sauf raison.
- Index sur les colonnes fréquemment filtrées : `@@index([projectId, status])`.
- Champs JSON : `Json` (mutable). `Json?` si nullable.
- Chiffrement : `Bytes?` pour les credentials (utiliser `lib/crypto.ts` à l'usage).

## 3. Générer une migration

```bash
pnpm prisma:migrate
# nom de migration suggéré : "add-<entity-name>"
```

## 4. Vérifier le client Prisma

```bash
pnpm prisma generate
pnpm typecheck
```

## 5. Mettre à jour `DATA_MODEL.md`

Ajouter une section pour la nouvelle entité avec tableau des colonnes et notes.

## 6. Créer le repository (optionnel selon scope)

Pour les entités très utilisées, créer un module dédié `lib/repositories/<entity>.ts` qui encapsule les requêtes Prisma. Sinon, utiliser `@/lib/db` directement dans les usecases.

## 7. Validation Zod

Créer `lib/validation/<entity>.ts` avec :
- Schema de création (`<Entity>CreateSchema`).
- Schema de mise à jour (`<Entity>UpdateSchema`).
- Schema de réponse API (`<Entity>ResponseSchema`).

## 8. API routes (si exposée)

Documenter dans `API_SPEC.md` avant de coder, puis implémenter dans `app/api/<entity>/route.ts`.

## 9. Tests

- Test unitaire sur les schemas Zod.
- Test sur le repository (si créé) avec une DB mockée OU Testcontainers (Lot 1+).

## 10. Seed (optionnel)

Si l'entité a besoin de données initiales (ex : règles SEO, types de pages), ajouter dans `prisma/seed.ts`.

## Anti-patterns

- Modifier une migration déjà mergée → **interdit**. Créer une nouvelle migration.
- Ajouter une table sans ADR.
- Oublier `onDelete: Cascade` quand pertinent (orphelins).
- Mettre du PII non chiffré.
