# API_SPEC.md

## Comportements communs

- Toutes les routes sont des **Next.js Route Handlers** dans `app/api/*/route.ts`.
- Validation Zod sur path params, query, body.
- Format d'erreur uniforme : `{ error: { code, message, details? } }`.
- Auth via cookie Supabase HttpOnly, vérifié par `middleware.ts` (`supabase.auth.getUser()`). Mono-user.
- CORS désactivé pour les routes API (le SaaS est mono-tenant interne).
- Rate limit : pas en MVP (mono-user, pas de risque). À ajouter en Lot 1+.
- Pagination max serveur : 100 lignes par défaut (paramètre `limit`).

## Endpoints (scaffold)

| Méthode | Path | Auth | Rate limit | Statuts |
|---|---|---|---|---|
| GET | `/api/health` | public | — | 200 |
| GET/POST/PUT | `/api/inngest` | signed (Inngest) | — | 200 / 401 |

## Endpoints planifiés (Sprint 0 → Sprint 2)

| Méthode | Path | Auth | Rôle | Sprint |
|---|---|---|---|---|
| POST | `/api/projects` | user | Créer un projet | S0-07 |
| GET | `/api/projects` | user | Lister projets | S0-07 |
| GET | `/api/projects/[id]` | user | Détails projet | S0-07 |
| PATCH | `/api/projects/[id]` | user | Modifier projet | S0-07 |
| POST | `/api/projects/[id]/audits` | user | Lancer un audit (déclenche Inngest) | S1-07 |
| GET | `/api/audits/[id]` | user | Récupérer un audit | S1-07 |
| GET | `/api/integrations/google` | user | Démarrer OAuth Google (state anti-CSRF) | S2-01 |
| GET | `/api/integrations/google/callback` | user | Callback OAuth — stocke le refresh token chiffré | S2-01 |
| N/A | `/api/integrations/gsc/*` | N/A | S2-02 : la liste des propriétés est chargée côté Server Component (`lib/gsc/list-properties.ts`) ; l'association et la déconnexion passent par des Server Actions (`app/(app)/settings/integrations/actions.ts`) — cohérent avec le pattern des formulaires du repo | S2-02 |
| POST | `/api/integrations/dataforseo` | user | Sauver creds DataForSEO | S2-04 |
| N/A | `/api/keywords` | N/A | S2-07 utilise des Server Actions (`app/(app)/keywords/actions.ts`) plutôt qu'un endpoint HTTP — cohérent avec le pattern des autres formulaires du repo (voir `app/login/actions.ts`, `app/(app)/settings/integrations/actions.ts`) | S2-07 |
| GET | `/api/backlog/[projectId]/export?format=md` | user | Export backlog Markdown | S2-12 |

## Format de réponse standard

### Succès

```json
{ "data": ... }
```

### Erreur

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [{ "path": ["domain"], "issue": "Invalid URL" }]
  }
}
```

Codes d'erreur prévus :

| Code | Statut HTTP | Quand |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Zod parse fail |
| `UNAUTHORIZED` | 401 | Session Supabase absente |
| `FORBIDDEN` | 403 | Resource appartient à un autre user (théorique) |
| `NOT_FOUND` | 404 | id inexistant |
| `CONFLICT` | 409 | domaine déjà existant |
| `INTEGRATION_ERROR` | 502 | service externe en échec |
| `INTERNAL` | 500 | erreur non gérée |

## Checklist pour ajouter un endpoint

1. Documenter dans ce fichier (méthode, path, auth, rôle, sprint).
2. Créer le schema Zod dans `lib/validation/<entity>.ts`.
3. Créer le handler dans `app/api/<path>/route.ts` — ne contient QUE : parse Zod + appel `lib/` + sérialisation réponse.
4. Si lecture/écriture DB : passer par `@/lib/db`, pas d'import direct `@prisma/client`.
5. Ajouter un test Vitest dans `tests/api/<entity>.test.ts` qui mocke la DB et vérifie les codes d'erreur.
6. Vérifier `pnpm typecheck` et `pnpm test`.
