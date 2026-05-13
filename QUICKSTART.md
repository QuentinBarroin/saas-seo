# Quickstart — saas-audit-seo

## Pré-requis

- Node.js ≥ 20 (testé sur 22.x).
- pnpm ≥ 8 (testé sur 10.x).
- Docker Desktop (uniquement si tu veux un Postgres local au lieu d'utiliser Supabase distant).

## 1. Installer les dépendances

```bash
pnpm install
```

## 2. Configurer les variables d'environnement

```bash
cp .env.example .env.local
```

Remplir ensuite :

- `DATABASE_URL` + `DIRECT_URL` (Supabase project settings → Database → Connection string).
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- `ENCRYPTION_KEY` (32 bytes hex) :
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- `ANTHROPIC_API_KEY`.
- `GOOGLE_OAUTH_*` (créer une App OAuth dans Google Cloud Console — type Web).
- `INNGEST_EVENT_KEY` + `INNGEST_SIGNING_KEY` (Inngest dashboard).

## 3. Base de données

### Option A — Supabase distant (recommandé)

Aucune action locale. Les migrations Prisma s'appliquent sur Supabase :

```bash
pnpm prisma:migrate
```

### Option B — Postgres local via Docker

```bash
pnpm db:up                 # démarre Postgres 16 sur le port 5434
# Mettre DATABASE_URL=postgresql://saas_audit_seo:saas_audit_seo_dev_password@localhost:5434/saas_audit_seo
pnpm prisma:migrate
```

## 4. Lancer en dev

```bash
pnpm dev
```

L'app tourne sur http://localhost:3000.

## 5. Lancer Inngest en local (jobs background)

Dans un autre terminal :

```bash
pnpm dlx inngest-cli@latest dev
```

L'interface Inngest dev tourne sur http://localhost:8288.

## 6. Vérifs qualité

```bash
pnpm lint
pnpm typecheck
pnpm test
```

## 7. Lancer un audit

> À venir en Sprint 1. Pour l'instant, le scaffold ne contient pas encore le pipeline d'audit.

## Notes Windows

- pnpm sur Windows : si tu rencontres une erreur `EPERM` sur `node_modules`, lancer le terminal en admin une fois pour casser les locks.
- Docker Desktop doit tourner en mode WSL2 (réglages par défaut).

## Troubleshooting

| Symptôme | Cause probable | Fix |
|---|---|---|
| `Error: P1001 Can't reach database server` | DATABASE_URL pointe sur Supabase mais pas de réseau | Utiliser DIRECT_URL ou vérifier credentials |
| `pnpm install` lent | Premier install, beaucoup de deps | Normal, ~1-2 min |
| `next dev` n'ouvre pas le port | Conflit avec un autre projet sur :3000 | `pnpm dev -p 3001` |
