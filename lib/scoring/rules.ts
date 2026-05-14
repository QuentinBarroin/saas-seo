// Catalogue de règles SEO/GEO — spec versionnée (S1-01).
// Source : agent SEO-Data (base Obsidian 05_agents/agent-seo-data.md)
//        + backlog-source.md (Phase 2, 2bis, 7).
// Consommé par lib/scoring/detectors/{crawler,repo}.ts en Sprint 1 (S1-03, S1-05, S1-06).

export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type RuleCategory = 'technical' | 'content' | 'architecture' | 'conversion' | 'geo';
export type Detector = 'crawler' | 'repo-scan';

export interface Rule {
  id: string;
  category: RuleCategory;
  severity: Severity;
  title: string;
  description: string;
  detector: Detector;
  /** Description lisible de la condition de détection (pas un DSL exécutable). */
  condition: string;
  /** Template d'evidence : placeholders `{url}`, `{filePath}`, `{line}`, etc. */
  evidenceTemplate: string;
  /** Template de recommandation actionnable, consommé par BACKLOG-* en Sprint 2. */
  recommendationTemplate: string;
}

/**
 * Pondération sévérité → impact sur le score d'un axe (0-100).
 * critical: -25, high: -10, medium: -3, low: -1 (capé 0).
 * Source : agent-seo-data.md §Pondération du scoring (MVP).
 */
export const SEVERITY_WEIGHTS: Record<Severity, number> = {
  critical: -25,
  high: -10,
  medium: -3,
  low: -1,
};

/**
 * Pondération des axes dans le score global (somme = 100).
 * Source : agent-seo-data.md.
 */
export const CATEGORY_WEIGHTS: Record<RuleCategory, number> = {
  technical: 35,
  content: 25,
  architecture: 20,
  conversion: 10,
  geo: 10,
};

export const rules: Rule[] = [
  // ─── TECH-* (crawler, HTML rendu) ──────────────────────────────────────────
  {
    id: 'TECH-broken-status',
    category: 'technical',
    severity: 'critical',
    title: 'Page renvoie un code non-200',
    description:
      "Une page interne renvoie un statut HTTP autre que 200 (4xx/5xx) — elle ne sera pas indexée et casse l'expérience utilisateur.",
    detector: 'crawler',
    condition: 'page.statusCode !== 200 && page.statusCode !== 301 && page.statusCode !== 308',
    evidenceTemplate: 'URL: {url} · Status: {statusCode}',
    recommendationTemplate:
      "Restaurer la page (200 OK) ou la rediriger (301) vers une cible pertinente. Si la page n'existe plus, ajouter une redirection 301 vers la page la plus proche thématiquement.",
  },
  {
    id: 'TECH-missing-canonical',
    category: 'technical',
    severity: 'medium',
    title: 'Canonical absente',
    description:
      'La balise `<link rel="canonical">` est absente — Google peut choisir une autre URL comme version canonique.',
    detector: 'crawler',
    condition: 'page.head does not contain <link rel="canonical">',
    evidenceTemplate: 'URL: {url}',
    recommendationTemplate:
      'Ajouter `<link rel="canonical" href="{url}" />` dans le `<head>`. En Next.js : utiliser `export const metadata = { alternates: { canonical: "{url}" } }`.',
  },
  {
    id: 'TECH-missing-title',
    category: 'content',
    severity: 'high',
    title: 'Title absent ou vide',
    description: 'La balise `<title>` est absente ou vide — la SERP affichera une valeur dérivée par Google.',
    detector: 'crawler',
    condition: 'page.head.title is missing or empty',
    evidenceTemplate: 'URL: {url}',
    recommendationTemplate:
      'Définir un title de 50-60 caractères incluant le keyword principal. En Next.js : `export const metadata = { title: "..." }`.',
  },
  {
    id: 'TECH-missing-description',
    category: 'content',
    severity: 'medium',
    title: 'Meta description absente',
    description:
      '`<meta name="description">` absente — Google génère un snippet à partir du contenu, souvent moins efficace.',
    detector: 'crawler',
    condition: 'page.head does not contain <meta name="description">',
    evidenceTemplate: 'URL: {url}',
    recommendationTemplate:
      'Ajouter une description de 140-160 caractères orientée action (verbe + bénéfice + différenciateur). En Next.js : `metadata: { description: "..." }`.',
  },
  {
    id: 'TECH-missing-h1',
    category: 'content',
    severity: 'medium',
    title: 'H1 absent ou multiple',
    description: 'La page n\'a aucun `<h1>` ou en a plusieurs — affaiblit la hiérarchie sémantique pour Google.',
    detector: 'crawler',
    condition: 'page.body H1 count !== 1',
    evidenceTemplate: 'URL: {url} · H1 count: {h1Count}',
    recommendationTemplate:
      'Garder un seul `<h1>` par page, alignée sur le keyword principal. Les autres titres en `<h2>`/`<h3>`.',
  },
  {
    id: 'TECH-noindex-on-public-page',
    category: 'technical',
    severity: 'critical',
    title: 'Page publique en noindex',
    description:
      'Une page marketing/publique a `<meta name="robots" content="noindex">` actif — elle ne peut pas ranker.',
    detector: 'crawler',
    condition: 'page.indexable === false && page.url is in (marketing routes)',
    evidenceTemplate: 'URL: {url} · Source du noindex: {source}',
    recommendationTemplate:
      'Retirer le `noindex` (balise meta ou header `X-Robots-Tag`). Vérifier que `next.config.ts` n\'ajoute pas un header global. Si la page est volontairement privée, la passer derrière l\'auth.',
  },
  {
    id: 'TECH-private-page-indexable',
    category: 'technical',
    severity: 'critical',
    title: 'Page sensible ou tokenisée indexable',
    description:
      'Une page contenant un token, un slug client, ou un contenu privé est accessible sans auth ni `noindex` — risque de fuite + pollution de l\'index.',
    detector: 'crawler',
    condition: 'page.url matches /token|share|invite|admin|/\\w{20,}/ && page.indexable === true',
    evidenceTemplate: 'URL: {url} · Pattern détecté: {pattern}',
    recommendationTemplate:
      'Ajouter `<meta name="robots" content="noindex,nofollow">` OU bloquer dans `robots.txt` OU passer la page derrière l\'auth. Vérifier qu\'aucun lien interne ne pointe vers ces URLs depuis une page indexable.',
  },
  {
    id: 'TECH-missing-sitemap',
    category: 'technical',
    severity: 'high',
    title: 'sitemap.xml absent ou inaccessible',
    description: 'Aucun `/sitemap.xml` accessible (404 ou absent) — Google découvre les pages plus lentement.',
    detector: 'crawler',
    condition: 'fetch(domain + "/sitemap.xml").status !== 200',
    evidenceTemplate: 'URL: {url}/sitemap.xml · Status: {statusCode}',
    recommendationTemplate:
      'Générer un sitemap dynamique via `app/sitemap.ts` (Next.js 15). Lister toutes les routes marketing publiques. Référencer dans `robots.txt` via `Sitemap: {url}/sitemap.xml`.',
  },
  {
    id: 'TECH-missing-robots',
    category: 'technical',
    severity: 'medium',
    title: 'robots.txt absent',
    description:
      "`/robots.txt` est absent — Google applique un comportement par défaut, mais pas de contrôle explicite sur l'indexation.",
    detector: 'crawler',
    condition: 'fetch(domain + "/robots.txt").status !== 200',
    evidenceTemplate: 'URL: {url}/robots.txt · Status: {statusCode}',
    recommendationTemplate:
      'Créer `app/robots.ts` (Next.js 15) avec `User-agent: *`, `Allow: /` (ou `Disallow:` ciblé), et `Sitemap: {url}/sitemap.xml`.',
  },

  // ─── CODE-* (repo-scan, AST Next.js) ─────────────────────────────────────
  {
    id: 'CODE-missing-sitemap-ts',
    category: 'technical',
    severity: 'high',
    title: 'app/sitemap.ts absent',
    description:
      "Le repo Next.js n'a pas de fichier `app/sitemap.ts` (ou `pages/sitemap.xml.ts`) — le sitemap n'est pas généré dynamiquement.",
    detector: 'repo-scan',
    condition: 'glob("app/sitemap.{ts,tsx}") and glob("pages/sitemap.xml.{ts,tsx}") both empty',
    evidenceTemplate: 'Recherche dans: app/, pages/',
    recommendationTemplate:
      'Créer `app/sitemap.ts` exportant un default async qui retourne un `MetadataRoute.Sitemap`. Lister les routes marketing dynamiquement (Prisma `SeoPage.findMany` quand connecté, sinon en dur).',
  },
  {
    id: 'CODE-missing-robots-ts',
    category: 'technical',
    severity: 'medium',
    title: 'app/robots.ts absent',
    description: "Le repo n'a pas de `app/robots.ts` — le contrôle d'indexation est figé dans un fichier statique.",
    detector: 'repo-scan',
    condition: 'glob("app/robots.{ts,tsx}") empty',
    evidenceTemplate: 'Recherche dans: app/',
    recommendationTemplate:
      'Créer `app/robots.ts` exportant un default qui retourne un `MetadataRoute.Robots` (rules + sitemap).',
  },
  {
    id: 'CODE-missing-metadata',
    category: 'content',
    severity: 'high',
    title: 'metadata absente sur une route marketing',
    description:
      "Une page marketing (`app/**/page.tsx`) n'exporte ni `metadata` ni `generateMetadata` — title/description pas maîtrisés.",
    detector: 'repo-scan',
    condition:
      'page.tsx in marketing group does not export `metadata` const nor `generateMetadata` function',
    evidenceTemplate: 'Fichier: {filePath}',
    recommendationTemplate:
      "Ajouter `export const metadata: Metadata = { title: '…', description: '…', alternates: { canonical: '…' } }` ou `generateMetadata` si dynamique.",
  },
  {
    id: 'CODE-use-client-on-marketing-route',
    category: 'technical',
    severity: 'high',
    title: '`use client` directive sur une route marketing',
    description:
      "Une page marketing déclare `'use client'` au niveau racine — perte du SSR/RSC, donc HTML rendu vide pour Googlebot.",
    detector: 'repo-scan',
    condition: 'first non-comment line of page.tsx is "use client" AND route is in marketing group',
    evidenceTemplate: 'Fichier: {filePath} · Ligne 1: "use client"',
    recommendationTemplate:
      'Retirer la directive `\'use client\'` du fichier `page.tsx`. Déplacer l\'interactivité dans un composant client enfant (`./components/interactive-bit.tsx` avec `\'use client\'` dedans).',
  },
  {
    id: 'CODE-images-unoptimized',
    category: 'technical',
    severity: 'high',
    title: '`images.unoptimized: true` dans next.config',
    description: 'Désactive l\'optimisation d\'images Next.js — impact perf (Core Web Vitals) et SEO.',
    detector: 'repo-scan',
    condition: 'next.config.{ts,js,mjs} contains property `images.unoptimized: true`',
    evidenceTemplate: 'Fichier: {filePath} · Ligne: {line}',
    recommendationTemplate:
      "Retirer `images: { unoptimized: true }`. Si on héberge sur Vercel, l'optimisation est gratuite. Sinon configurer un `loader` (Cloudinary, imgix) ou conserver mais limiter aux assets non-critiques.",
  },
  {
    id: 'CODE-img-instead-of-next-image',
    category: 'technical',
    severity: 'medium',
    title: 'Usage de `<img>` brut au lieu de `next/image`',
    description:
      "Au moins une page marketing utilise `<img src=...>` au lieu de `<Image />` de `next/image` — perte lazy-loading + LCP non optimisé.",
    detector: 'repo-scan',
    condition: 'page.tsx in marketing group contains JSX `<img />` (not aliased to Next.js Image)',
    evidenceTemplate: 'Fichier: {filePath} · Ligne: {line}',
    recommendationTemplate:
      "Remplacer `<img>` par `import Image from 'next/image'` et `<Image src={...} width={...} height={...} alt='...' priority?={isAboveTheFold} />`. Spécifier `priority` sur le LCP.",
  },
  {
    id: 'CODE-missing-jsonld',
    category: 'geo',
    severity: 'medium',
    title: 'Aucun JSON-LD détecté dans le repo',
    description:
      "Aucune route marketing n'injecte de `<script type=\"application/ld+json\">` — perte sur les rich results + citations LLM.",
    detector: 'repo-scan',
    condition: 'no file in app/ contains JSON-LD injection (script tag with type="application/ld+json")',
    evidenceTemplate: 'Recherche dans: app/**/*.tsx',
    recommendationTemplate:
      'Ajouter un composant `<JsonLd type="Organization" data={...} />` dans `app/layout.tsx` (pour le site) + un par page pilier (`SoftwareApplication`, `Article`, `FAQPage`).',
  },

  // ─── CONV-* (conversion — détection CTA, tunnels) ────────────────────────
  {
    id: 'CONV-missing-cta',
    category: 'conversion',
    severity: 'medium',
    title: 'Aucun CTA détecté sur la page',
    description:
      "La page n'a aucun appel à l'action visible (lien vers contact/démo/inscription, bouton primaire, mailto/tel). Le visiteur n'a pas de chemin de conversion clair.",
    detector: 'crawler',
    condition: 'page.ctaSignals total === 0 && page indexable et statusCode 200 et non-sensitive URL',
    evidenceTemplate: 'URL: {url}',
    recommendationTemplate:
      "Ajouter un CTA primaire above-the-fold : bouton ou lien vers /contact, /demo, /inscription, /devis (selon le businessGoal du projet). Libellé orienté action ('Démarrer', 'Réserver une démo', 'Demander un devis'). Style visible (bouton coloré + position prominente).",
  },

  // ─── GEO-* (crawler, HTML rendu — détection JSON-LD côté output) ─────────
  {
    id: 'GEO-missing-organization-jsonld',
    category: 'geo',
    severity: 'medium',
    title: 'JSON-LD Organization absent',
    description:
      "La page d'accueil (ou une page autorité) n'inclut pas de JSON-LD `@type: Organization` — affaiblit la compréhension de l'entité par les LLM et Google KG.",
    detector: 'crawler',
    condition:
      'home page HTML does not contain <script type="application/ld+json"> with @type = "Organization"',
    evidenceTemplate: 'URL: {url}',
    recommendationTemplate:
      "Injecter un JSON-LD Organization sur `/` (au minimum) : `name`, `url`, `logo`, `sameAs` (réseaux sociaux), `contactPoint`. Référence : https://schema.org/Organization.",
  },
  {
    id: 'GEO-missing-softwareapplication-jsonld',
    category: 'geo',
    severity: 'medium',
    title: 'JSON-LD SoftwareApplication absent (projet SaaS)',
    description:
      "Pour un projet de type SaaS, la page produit ou home n'inclut pas de JSON-LD `@type: SoftwareApplication` — perte de rich results (rating, prix) et de citations LLM.",
    detector: 'crawler',
    condition:
      'project.type === "saas" && no marketing page contains JSON-LD with @type = "SoftwareApplication"',
    evidenceTemplate: 'URL: {url}',
    recommendationTemplate:
      "Ajouter un JSON-LD SoftwareApplication sur la home ou la page produit principale : `name`, `applicationCategory`, `operatingSystem`, `offers.price`, `aggregateRating`. Référence : https://schema.org/SoftwareApplication.",
  },
];

export function getRule(id: string): Rule | undefined {
  return rules.find((r) => r.id === id);
}

export function rulesByDetector(detector: Detector): Rule[] {
  return rules.filter((r) => r.detector === detector);
}

export function rulesByCategory(category: RuleCategory): Rule[] {
  return rules.filter((r) => r.category === category);
}
