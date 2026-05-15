# Setup — Google OAuth pour Google Search Console

Procédure pour provisionner l'app Google Cloud OAuth qui alimente la connexion
GSC du SaaS (stream S2-01/02/03 : import des clics / impressions / position
90 jours).

Tant que `GOOGLE_OAUTH_CLIENT_ID` / `GOOGLE_OAUTH_CLIENT_SECRET` ne sont pas
renseignés, la carte « Google Search Console » de `/settings/integrations`
affiche « Non configuré » et la step d'audit `import-gsc` est sautée
proprement (l'audit reste valide, sans données GSC).

## 1. Projet Google Cloud

1. Ouvrir [console.cloud.google.com](https://console.cloud.google.com/).
2. Créer un projet (ex. `saas-audit-seo`) ou réutiliser un projet existant.

## 2. Activer l'API Search Console

1. **APIs & Services → Library**.
2. Chercher **Google Search Console API**, puis **Enable**.

## 3. Écran de consentement OAuth

1. **APIs & Services → OAuth consent screen**.
2. User type : **External**.
3. Renseigner le nom de l'app + l'email de support.
4. **Scopes** : ajouter `.../auth/webmasters.readonly` (lecture seule
   Search Console) — c'est le seul scope demandé par l'app.
5. **Test users** : ajouter le compte Google qui possède les propriétés GSC
   à auditer (ex. `quentin.barroin@gmail.com`).
6. Laisser l'app en **Testing** : pas besoin de la soumettre à la
   vérification Google tant que seuls des test users s'y connectent.

> En mode Testing, le refresh token expire au bout de 7 jours. Pour un usage
> durable, passer l'app en **In production** (la vérification Google n'est
> requise que pour les scopes sensibles ; `webmasters.readonly` y figure —
> prévoir la vérification, ou se reconnecter périodiquement via la carte GSC).

## 4. Identifiants OAuth

1. **APIs & Services → Credentials → Create credentials → OAuth client ID**.
2. Application type : **Web application**.
3. **Authorized redirect URIs** — ajouter l'URI EXACTE utilisée par l'app :
   - Dev local : `http://localhost:3434/api/integrations/google/callback`
   - Vercel / prod : `https://<domaine>/api/integrations/google/callback`
4. Créer → copier le **Client ID** et le **Client secret**.

## 5. Variables d'environnement

Dans `.env` (jamais commité) :

```bash
GOOGLE_OAUTH_CLIENT_ID="<client-id>.apps.googleusercontent.com"
GOOGLE_OAUTH_CLIENT_SECRET="<client-secret>"
# Doit correspondre EXACTEMENT à une Authorized redirect URI ci-dessus.
GOOGLE_OAUTH_REDIRECT_URI="http://localhost:3434/api/integrations/google/callback"
```

`GOOGLE_OAUTH_REDIRECT_URI` est optionnel : s'il est absent, l'app dérive
l'URI depuis l'origine de la requête. Le renseigner explicitement évite tout
décalage avec ce qui est enregistré côté Google.

Redémarrer le serveur après modification du `.env`.

## 6. Connecter un projet

1. Aller sur `/settings/integrations`, sélectionner le projet.
2. Carte **Google Search Console → « Connecter Google Search Console »**.
3. Choisir le compte Google, accepter le consentement (lecture seule).
4. De retour dans l'app, sélectionner la **propriété** GSC à auditer
   (ex. `sc-domain:exemple.com`) puis **Enregistrer la propriété**.

Le refresh token est stocké chiffré (AES-256-GCM) dans
`SeoProject.integrationsEnc` — jamais en clair, jamais en variable d'env.

## 7. Vérifier

Lancer un audit : la step `import-gsc` doit importer les lignes 90 jours
dans `GscQueryStat`. Le `runLog` de l'audit (`/audit-technique`) expose
`rowsImported`, `pagesFetched` et la fenêtre de dates.

## Dépannage

| Symptôme | Cause probable |
| --- | --- |
| `gsc=not_configured` au retour | `GOOGLE_OAUTH_CLIENT_ID` absent du `.env` |
| `redirect_uri_mismatch` chez Google | L'URI du `.env` ≠ Authorized redirect URI |
| `gsc=no_refresh_token` | Révoquer l'accès dans le compte Google, puis reconnecter |
| `gsc=denied` | Consentement refusé par l'utilisateur |
| Erreur Google `403 access_denied` (« app n'a pas terminé la validation ») | Le compte Google utilisé n'est pas dans les **Test users** de l'écran de consentement OAuth → l'ajouter (APIs & Services → OAuth consent screen / Audience → Test users) |
| « Aucune propriété accessible » | Le compte Google n'a accès à aucune propriété GSC |
| Step `import-gsc` → `auth_error` | Refresh token expiré/révoqué → reconnecter le compte |
