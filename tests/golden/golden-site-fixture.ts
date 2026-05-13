import type { FetchResponse, Fetcher } from '@/lib/crawler/types';

/**
 * Site synthétique pour le golden audit (S1-12).
 *
 * 6 pages HTML déterministes avec des bugs SEO délibérés couvrant les
 * détecteurs MVP. Pas de live site (instable) — fetcher mocké en mémoire
 * pour que le snapshot reste stable entre runs.
 *
 * Bugs attendus (10 findings au total) :
 *  - /                        → TECH-missing-canonical, GEO-missing-org/-saas
 *  - /pricing                 → TECH-missing-h1 (content)
 *  - /admin                   → TECH-private-page-indexable
 *  - /r/<24-alphanum>         → TECH-private-page-indexable (regex token)
 *  - /noindex-marketing       → TECH-noindex-on-public-page
 *  - /broken                  → TECH-broken-status (404, court-circuite)
 *  - /sitemap.xml             → TECH-missing-sitemap (404, site-level)
 *  - /robots.txt              → TECH-missing-robots (404, site-level)
 */

export const GOLDEN_ORIGIN = 'https://golden.example.com';
const TOKEN_PATH = '/r/abcdefghijklmnopqrstuvwx'; // 24 alphanum no-dash → matche regex token

const HTML_CONTENT_TYPE = { 'content-type': 'text/html; charset=utf-8' };

const HOME_HTML = `<!DOCTYPE html>
<html lang="fr"><head>
  <title>Golden Example</title>
  <meta name="description" content="Page d'accueil du golden fixture.">
</head><body>
  <h1>Bienvenue</h1>
  <a href="/pricing">Pricing</a>
  <a href="/admin">Admin</a>
  <a href="${TOKEN_PATH}">Lien partagé</a>
  <a href="/noindex-marketing">Marketing privé</a>
  <a href="/broken">Lien cassé</a>
</body></html>`;

const PRICING_HTML = `<!DOCTYPE html>
<html lang="fr"><head>
  <title>Tarifs — Golden Example</title>
  <meta name="description" content="Nos plans tarifaires.">
  <link rel="canonical" href="${GOLDEN_ORIGIN}/pricing">
</head><body>
  <p>Aucun h1 ici — déclenche TECH-missing-h1.</p>
  <a href="/">Retour accueil</a>
</body></html>`;

const ADMIN_HTML = `<!DOCTYPE html>
<html lang="fr"><head>
  <title>Espace admin</title>
  <meta name="description" content="Panel d'administration.">
  <link rel="canonical" href="${GOLDEN_ORIGIN}/admin">
</head><body>
  <h1>Admin</h1>
  <a href="/">Retour</a>
</body></html>`;

const TOKEN_HTML = `<!DOCTYPE html>
<html lang="fr"><head>
  <title>Ressource partagée</title>
  <meta name="description" content="Contenu via lien tokenisé.">
  <link rel="canonical" href="${GOLDEN_ORIGIN}${TOKEN_PATH}">
</head><body>
  <h1>Lien partagé</h1>
  <a href="/">Retour</a>
</body></html>`;

const NOINDEX_HTML = `<!DOCTYPE html>
<html lang="fr"><head>
  <title>Page marketing en noindex</title>
  <meta name="description" content="Cette page est volontairement en noindex.">
  <meta name="robots" content="noindex, follow">
  <link rel="canonical" href="${GOLDEN_ORIGIN}/noindex-marketing">
</head><body>
  <h1>Marketing</h1>
  <a href="/">Retour</a>
</body></html>`;

type Route = { status: number; body: string; headers: Record<string, string> };

const ROUTES: Record<string, Route> = {
  [`${GOLDEN_ORIGIN}/`]: { status: 200, body: HOME_HTML, headers: HTML_CONTENT_TYPE },
  [`${GOLDEN_ORIGIN}/pricing`]: { status: 200, body: PRICING_HTML, headers: HTML_CONTENT_TYPE },
  [`${GOLDEN_ORIGIN}/admin`]: { status: 200, body: ADMIN_HTML, headers: HTML_CONTENT_TYPE },
  [`${GOLDEN_ORIGIN}${TOKEN_PATH}`]: {
    status: 200,
    body: TOKEN_HTML,
    headers: HTML_CONTENT_TYPE,
  },
  [`${GOLDEN_ORIGIN}/noindex-marketing`]: {
    status: 200,
    body: NOINDEX_HTML,
    headers: HTML_CONTENT_TYPE,
  },
  [`${GOLDEN_ORIGIN}/broken`]: { status: 404, body: '', headers: HTML_CONTENT_TYPE },
};

export const goldenFetcher: Fetcher = async (url): Promise<FetchResponse> => {
  const route = ROUTES[url];
  if (route) {
    return { status: route.status, body: route.body, headers: route.headers, finalUrl: url };
  }
  // /sitemap.xml, /robots.txt, et toute URL inconnue → 404 (déclenche les
  // findings site-level dans le golden).
  return { status: 404, body: '', headers: HTML_CONTENT_TYPE, finalUrl: url };
};
