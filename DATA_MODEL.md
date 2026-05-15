# DATA_MODEL.md

Source de vérité : `prisma/schema.prisma`. Ce fichier documente le pourquoi de chaque table.

## Convention

- Toutes les tables ont `id String @id @default(cuid())`.
- Toutes les FK utilisent `onDelete: Cascade` sauf indication contraire.
- Pas de soft-delete en MVP.
- Tous les `JSON` sont immuables une fois écrits (`findingsJson`, `backlogJson`, `runLog`).

## Tables MVP

### `SeoProject`
**Racine**. Un projet = un domaine + un repo + une cible business.

| Champ | Type | Notes |
|---|---|---|
| name | String | nom interne |
| domain | String | URL racine (sans protocole) |
| repoUrl | String? | URL GitHub OU chemin local |
| market | String | défaut "FR" |
| type | String | saas / local_seo / marketplace / blog / lead_gen |
| businessGoal | String | démos / leads / inscriptions / ventes / visibilité |
| integrationsEnc | Bytes? | JSON chiffré AES-256-GCM : credentials DataForSEO, refresh token Google, gscPropertyUrl |

Index : `@@index([domain])`.

### `Keyword`
Mots-clés du projet (seed + GSC + DataForSEO + Ads + IA).

| Champ | Type | Notes |
|---|---|---|
| query | String | la requête |
| cluster | String? | nom du cluster (manuel en MVP) |
| intent | String? | tofu / mofu / bofu / navigational |
| isMoneyKeyword | Boolean | tagué manuellement |
| source | String? | seed / gsc / dataforseo / ads / ai |
| volume, cpc, difficulty | Int?/Float?/Float? | Lot 1 (Google Ads + DataForSEO keywords) |
| priorityScore | Float? | calculé |
| associatedPageId | String? | FK informelle vers SeoPage |

Index : `@@index([projectId, cluster])`, `@@index([query])`.

### `SeoPage`
Pages **existantes** OU **recommandées** par le content gap.

| Champ | Type | Notes |
|---|---|---|
| url | String? | null si page recommandée pas encore créée |
| slug | String? | recommandé pour pages manquantes |
| pageType | String? | home / pillar / child / listing / bofu / tofu |
| status | String | existing / recommended / in_progress / done |
| title, description, h1, wordCount | divers | données crawler |
| indexable, canonical, hasJsonLd, hasFaq, hasCta | Boolean?/String? | flags d'audit |
| technicalScore, contentScore, geoScore, conversionScore | Float? | scores par page |

Index : `@@index([projectId, status])`.

### `SeoAudit`
Un run complet (immuable).

| Champ | Type | Notes |
|---|---|---|
| globalScore, technicalScore, … | Float? | scores agrégés |
| findingsJson | Json | findings bruts (source de vérité) |
| backlogJson | Json | backlog brut produit par Claude |
| runLog | Json? | trace des steps Inngest, durées, erreurs |
| status | String | pending / running / done / error / partial |
| startedAt, finishedAt | DateTime? | bornes du run |

Index : `@@index([projectId, createdAt])`.

### `Finding`
Findings dénormalisés (pour filtrer/joindre BacklogItem).

| Champ | Type | Notes |
|---|---|---|
| category | String | technical / content / architecture / conversion / geo |
| severity | String | critical / high / medium / low |
| title, description | String | texte humain |
| evidence | Json? | URL, snippet HTML, ligne de code |
| pageUrl, filePath | String? | localisation |
| rule | String | id de la règle (`TECH-noindex-...`) |

Index : `@@index([projectId, severity])`, `@@index([auditId])`.

### `Competitor`
Concurrents identifiés manuellement OU détectés depuis la SERP.

| Champ | Type | Notes |
|---|---|---|
| domain | String | nom de domaine |
| source | String? | manual / serp_auto |
| serpFrequency | Int? | nb d'apparitions top 10 |
| notesJson | Json? | annotations libres |

Contrainte : `@@unique([projectId, domain])`.

### `BacklogItem`
Tâches dérivées des findings, avec prompts Claude Code.

| Champ | Type | Notes |
|---|---|---|
| priority | String | P0 / P1 / P2 |
| effort | String | XS / S / M / L / XL |
| status | String | todo / in_progress / done / discarded |
| acceptanceCriteria | Json? | array de strings |
| claudePrompt | String? | prompt prêt à coller |
| sourceFindingId | String? | FK vers Finding (obligatoire en pratique) |
| filePathsTargeted | Json? | array de chemins |
| testsExpected | Json? | array de descriptifs |
| definitionOfDone | String? | texte |

Index : `@@index([projectId, priority])`, `@@index([projectId, status])`.

### `SerpResult` / `SerpPAA`
Stockage SERP DataForSEO. Permet le tracking dans le temps (`fetchedAt`).

**Idempotence MVP** : la step Inngest `serp` (S2-05) écrit en DELETE-then-INSERT par `(projectId, fetchedAt >= audit.startedAt)`. La concurrence Inngest `limit: 1 par projectId` garantit l'absence d'écriture concurrente sur la fenêtre. Pas de FK `auditId` : le SERP est volontairement trackable dans le temps indépendamment des audits.

### `GscQueryStat`
Stockage GSC : 1 ligne par (date, query, page). Alimenté par la step Inngest `import-gsc` (S2-03) sur une fenêtre de 90 jours glissants.

**Idempotence (S2-03)** : `replaceGscStats` (`lib/audits/persist-gsc.ts`) fait DELETE-then-INSERT par `projectId` + fenêtre de dates `[startDate, endDate]`. Rejouer la step (retry Inngest) ne crée pas de doublons. Les inserts sont découpés en chunks de 5 000 lignes ; cap dur `MAX_GSC_ROWS_PER_AUDIT` (défaut 100 000). Pas de FK `auditId` : les stats GSC sont trackables dans le temps indépendamment des audits (même choix que `SerpResult`).

## Tables reportées

- **Backlink** (Lot 2) — pas avant que les pages MVP soient solides.
- **JobRun** (Lot 1) — pour les jobs récurrents.
- **Alert** (Lot 2) — alertes baisse position.
- **LeadMagnet**, **ConversionStat** (Lot 2).

## Migrations

| Nom | Date | Description |
|---|---|---|
| — | — | Aucune migration au scaffold. Première migration `init` à créer en S0-03 via `pnpm prisma:migrate`. |

## Champs sensibles RGPD

- `SeoProject.integrationsEnc` : credentials API tierces. **Chiffré AES-256-GCM**. Jamais loggué.
- Aucun PII utilisateur final stocké (le SaaS est mono-user, pas de clients externes).

## Validation Zod

À implémenter dans `lib/validation/` au fil de l'eau. Chaque table critique doit avoir un schema Zod miroir pour valider les entrées API.
