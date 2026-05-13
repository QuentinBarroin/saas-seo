# FLOWS.md

Diagrammes pseudocodés des flux bout-en-bout. Détails complets dans la base Obsidian `04_architecture/flows.md` (9 flows).

## Flux à documenter quand ils existent

- ✅ **Création projet** (S0-07) — basique.
- ⬜ **Lancement audit** (S1-07) — workflow Inngest.
- ⬜ **OAuth Google + GSC** (S2-01/02).
- ⬜ **DataForSEO SERP** (S2-04/05).
- ⬜ **Génération backlog Claude** (S2-11).
- ⬜ **Export Markdown** (S2-12).

## Flow 1 — Création d'un projet

```
UI: form (domaine, repo, type, business goal, marché, concurrents, seeds)
  ↓
POST /api/projects
  ↓
Validation Zod (URLs, longueurs)
  ↓
INSERT SeoProject + Competitor[] + Keyword[] (source=seed)
  ↓
Redirect /dashboard (sélection du projet)
```

## Flow 2 — Lancement d'audit (cible Sprint 1-2)

```
UI: bouton "Lancer un audit" sur page projet
  ↓
POST /api/projects/{id}/audits
  ↓
INSERT SeoAudit(status=pending)
  ↓
inngest.send("audit/requested", { auditId, projectId })
  ↓
Réponse 202 (auditId)
  ↓
UI: poll GET /api/audits/{id} OU revalidatePath

----- côté Inngest -----

run-audit
  init                    UPDATE status=running, startedAt
  crawl                   Cheerio sur le domaine, snapshot pages
  repo-scan               ts-morph sur repo local
  import-gsc              GSC API → GscQueryStat
  serp                    DataForSEO → SerpResult, SerpPAA
  findings                Catalogue de règles → Finding[]
  competitors             Agrégation SerpResult.domain → Competitor
  content-gap             Architecture cible vs routes existantes → SeoPage[]
  score                   5 axes + global
  backlog                 Claude → BacklogItem[] (anti-hallu Zod)
  finalize                UPDATE status=done, finishedAt
```

États : `pending → running → done | error | partial`.

## Flow 3 — OAuth Google (Sprint 2)

```
UI: "Connect Google" sur /settings/integrations
  ↓
GET /api/integrations/google
  ↓
Redirect Google OAuth (scope webmasters.readonly)
  ↓
Callback /api/integrations/google/callback?code=...
  ↓
Échange code → refresh_token + access_token
  ↓
INSERT chiffré dans Project.integrationsEnc
  ↓
GET /api/integrations/gsc/properties → liste propriétés
  ↓
UI: sélection propriété
  ↓
POST /api/integrations/gsc/associate
```

## Flow 4 — Génération du backlog (Sprint 2)

```
INPUT : Finding[] de l'audit courant
  ↓
Group by category + severity
  ↓
Pour chaque groupe : appel Claude avec :
  - contexte projet (nom, type, business goal)
  - findings du groupe (avec ID, evidence)
  - stack du projet cible
  - convention de prompt (anti-hallu, tests, DoD)
  ↓
Réponse Claude : JSON BacklogItem[]
  ↓
Validation Zod
  ↓
Chaque item doit avoir un sourceFindingId existant → sinon rejeté
  ↓
INSERT BacklogItem[]
```

Anti-hallucination :
- Chaque BacklogItem référence un Finding existant.
- Si Claude génère un chemin de fichier inexistant → finding "backlog-invalid-path" + item rejeté.

## Flow 5 — Export Markdown du backlog (Sprint 2)

```
GET /api/backlog/{projectId}/export?format=md
  ↓
SELECT BacklogItem[] WHERE projectId
  ↓
Render Markdown (titre, sections par priorité, prompts inline copiables)
  ↓
Response: text/markdown + Content-Disposition: attachment; filename="backlog-<project>.md"
```
