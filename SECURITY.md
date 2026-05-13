# SECURITY.md

## Modèle de menace (MVP)

- **Utilisateurs** : 1 (Quentin). Pas de surface multi-user.
- **Risques** :
  1. Fuite de credentials API tierces (DataForSEO, refresh token Google) — élevé.
  2. Indexation accidentelle du SaaS par Google → exposition de routes internes — moyen.
  3. SSRF par crawl d'URLs malveillantes — moyen.
  4. Injection SQL — bas (Prisma + Zod).
  5. XSS — bas (Server Components + React 19).

## Auth

- **Supabase Auth** email/password.
- Mono-user en MVP.
- Refresh tokens stockés en HttpOnly cookie via `@supabase/ssr`.
- Middleware Next.js protège `app/(app)/*` (à wirer S0-04).

## RLS Supabase

- Activé sur toutes les tables dès le scaffold initial.
- En mono-user, policy par défaut : `auth.uid() IS NOT NULL` suffit.
- Quand on passera multi-user (post Lot 2), policies par `user_id` à ajouter.

## Secrets

- **Aucun `.env` committé**. `.gitignore` couvre `.env`, `.env.local`, `.env.*.local`.
- **`.env.example`** est la source de vérité de la liste des variables.
- **Vercel** : variables d'env injectées via dashboard.
- **CI GitHub Actions** : secrets via repo settings.

## Credentials API tierces

- Chiffrées **AES-256-GCM** via `lib/crypto.ts` avant stockage dans `SeoProject.integrationsEnc` (type `Bytes`).
- Clé `ENCRYPTION_KEY` : 32 bytes hex, stockée en env var, **jamais loggée**.
- Round-trip testé dans `tests/crypto.test.ts`.

## Headers de sécurité (à ajouter en S0-06)

Configurables dans `next.config.ts` via `headers()` :

- `Content-Security-Policy` strict (`default-src 'self'`, `script-src 'self' 'nonce-…'`).
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`.
- `X-Content-Type-Options: nosniff`.
- `X-Frame-Options: DENY`.
- `Referrer-Policy: strict-origin-when-cross-origin`.
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`.

## Crawler — anti-SSRF

- Whitelist : seuls les domaines publics HTTP/HTTPS sont crawlables.
- Refus explicite : `localhost`, `127.0.0.1`, `169.254.*`, `10.*`, `172.16-31.*`, `192.168.*`, `*.local`.
- User-Agent identifiable : `SeoAuditBot/0.1 (contact@novera)`.
- Respect par défaut de `robots.txt` (paramètre override pour audits de sites internes).

## CORS

- Désactivé pour `/api/*` (mono-tenant). Toutes les requêtes viennent du même domaine.

## Audit log (Lot 1+)

- En Lot 1, ajouter une table `AuditLog` qui trace : connexion, changement de credentials, lancement d'audit, modification de projet.

## Pratiques de code

- **Pas de `eval`**, **pas de `new Function`**.
- **Pas de fetching d'URLs utilisateur sans sanitization** (cf. anti-SSRF).
- **Pas de logs de secrets** : avant tout `console.error(...)`, vérifier que les objets passés ne contiennent pas de creds.
- **Tests crypto** obligatoires (round-trip + mauvaise clé + payload corrompu).

## Le SaaS lui-même

- N'est pas indexable :
  - `app/layout.tsx` : `robots: { index: false, follow: false }`.
  - `public/robots.txt` : `Disallow: /`.
- N'est pas publié comme produit externe (interne Novera uniquement).
- Pas d'inscription publique.
