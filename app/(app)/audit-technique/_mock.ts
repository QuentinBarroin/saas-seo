import { type FindingDraft } from '@/lib/scoring/finding';

/**
 * Mock data pour S1-08 (skeleton page /audit-technique).
 * 15 findings couvrant les 4 sévérités et 5 catégories.
 * Remplacé par la DB en S1-07 (Inngest job persistance).
 */
export const MOCK_FINDINGS: FindingDraft[] = [
  {
    ruleId: 'TECH-noindex-on-public-page',
    category: 'technical',
    severity: 'critical',
    title: 'Page publique en noindex',
    description:
      'Une page marketing/publique a `<meta name="robots" content="noindex">` actif — elle ne peut pas ranker.',
    evidence: {
      url: 'https://shooting-pilot.com/pricing',
      source: 'meta tag',
    },
    recommendation:
      'Retirer le `noindex` (balise meta ou header `X-Robots-Tag`). Vérifier que `next.config.ts` n\'ajoute pas un header global. Si la page est volontairement privée, la passer derrière l\'auth.',
    confidence: 'certain',
  },
  {
    ruleId: 'TECH-broken-status',
    category: 'technical',
    severity: 'critical',
    title: 'Page renvoie un code non-200',
    description:
      "Une page interne renvoie un statut HTTP autre que 200 (4xx/5xx) — elle ne sera pas indexée et casse l'expérience utilisateur.",
    evidence: {
      url: 'https://shooting-pilot.com/en/blog/post-123',
      statusCode: 404,
    },
    recommendation:
      "Restaurer la page (200 OK) ou la rediriger (301) vers une cible pertinente. Si la page n'existe plus, ajouter une redirection 301 vers la page la plus proche thématiquement.",
    confidence: 'certain',
  },
  {
    ruleId: 'TECH-private-page-indexable',
    category: 'technical',
    severity: 'critical',
    title: 'Page sensible ou tokenisée indexable',
    description:
      'Une page contenant un token, un slug client, ou un contenu privé est accessible sans auth ni `noindex` — risque de fuite + pollution de l\'index.',
    evidence: {
      url: 'https://shooting-pilot.com/share/abc123xyz789token',
      pattern: '/share/[token]',
    },
    recommendation:
      'Ajouter `<meta name="robots" content="noindex,nofollow">` OU bloquer dans `robots.txt` OU passer la page derrière l\'auth. Vérifier qu\'aucun lien interne ne pointe vers ces URLs depuis une page indexable.',
    confidence: 'certain',
  },
  {
    ruleId: 'TECH-missing-title',
    category: 'content',
    severity: 'high',
    title: 'Title absent ou vide',
    description:
      'La balise `<title>` est absente ou vide — la SERP affichera une valeur dérivée par Google.',
    evidence: {
      url: 'https://shooting-pilot.com/contact',
    },
    recommendation:
      'Définir un title de 50-60 caractères incluant le keyword principal. En Next.js : `export const metadata = { title: "..." }`.',
    confidence: 'certain',
  },
  {
    ruleId: 'TECH-missing-sitemap',
    category: 'technical',
    severity: 'high',
    title: 'sitemap.xml absent ou inaccessible',
    description:
      'Aucun `/sitemap.xml` accessible (404 ou absent) — Google découvre les pages plus lentement.',
    evidence: {
      url: 'https://shooting-pilot.com/sitemap.xml',
      statusCode: 404,
    },
    recommendation:
      'Générer un sitemap dynamique via `app/sitemap.ts` (Next.js 15). Lister toutes les routes marketing publiques. Référencer dans `robots.txt` via `Sitemap: https://shooting-pilot.com/sitemap.xml`.',
    confidence: 'certain',
  },
  {
    ruleId: 'CODE-missing-metadata',
    category: 'content',
    severity: 'high',
    title: 'metadata absente sur une route marketing',
    description:
      "Une page marketing (`app/**/page.tsx`) n'exporte ni `metadata` ni `generateMetadata` — title/description pas maîtrisés.",
    evidence: {
      filePath: 'app/(marketing)/features/page.tsx',
    },
    recommendation:
      "Ajouter `export const metadata: Metadata = { title: '…', description: '…', alternates: { canonical: '…' } }` ou `generateMetadata` si dynamique.",
    confidence: 'certain',
  },
  {
    ruleId: 'CODE-images-unoptimized',
    category: 'technical',
    severity: 'high',
    title: '`images.unoptimized: true` dans next.config',
    description:
      'Désactive l\'optimisation d\'images Next.js — impact perf (Core Web Vitals) et SEO.',
    evidence: {
      filePath: 'next.config.ts',
      line: 23,
    },
    recommendation:
      "Retirer `images: { unoptimized: true }`. Si on héberge sur Vercel, l'optimisation est gratuite. Sinon configurer un `loader` (Cloudinary, imgix) ou conserver mais limiter aux assets non-critiques.",
    confidence: 'certain',
  },
  {
    ruleId: 'CODE-use-client-on-marketing-route',
    category: 'technical',
    severity: 'high',
    title: '`use client` directive sur une route marketing',
    description:
      "Une page marketing déclare `'use client'` au niveau racine — perte du SSR/RSC, donc HTML rendu vide pour Googlebot.",
    evidence: {
      filePath: 'app/(marketing)/pricing/page.tsx',
      line: 1,
    },
    recommendation:
      'Retirer la directive `\'use client\'` du fichier `page.tsx`. Déplacer l\'interactivité dans un composant client enfant (`./components/interactive-bit.tsx` avec `\'use client\'` dedans).',
    confidence: 'certain',
  },
  {
    ruleId: 'TECH-missing-description',
    category: 'content',
    severity: 'medium',
    title: 'Meta description absente',
    description:
      '`<meta name="description">` absente — Google génère un snippet à partir du contenu, souvent moins efficace.',
    evidence: {
      url: 'https://shooting-pilot.com/about',
    },
    recommendation:
      'Ajouter une description de 140-160 caractères orientée action (verbe + bénéfice + différenciateur). En Next.js : `metadata: { description: "..." }`.',
    confidence: 'certain',
  },
  {
    ruleId: 'TECH-missing-h1',
    category: 'content',
    severity: 'medium',
    title: 'H1 absent ou multiple',
    description:
      'La page n\'a aucun `<h1>` ou en a plusieurs — affaiblit la hiérarchie sémantique pour Google.',
    evidence: {
      url: 'https://shooting-pilot.com/blog/article-xyz',
      h1Count: 2,
    },
    recommendation:
      'Garder un seul `<h1>` par page, alignée sur le keyword principal. Les autres titres en `<h2>`/`<h3>`.',
    confidence: 'certain',
  },
  {
    ruleId: 'TECH-missing-canonical',
    category: 'technical',
    severity: 'medium',
    title: 'Canonical absente',
    description:
      'La balise `<link rel="canonical">` est absente — Google peut choisir une autre URL comme version canonique.',
    evidence: {
      url: 'https://shooting-pilot.com/en/faq',
    },
    recommendation:
      'Ajouter `<link rel="canonical" href="https://shooting-pilot.com/en/faq" />` dans le `<head>`. En Next.js : utiliser `export const metadata = { alternates: { canonical: "https://shooting-pilot.com/en/faq" } }`.',
    confidence: 'certain',
  },
  {
    ruleId: 'CODE-img-instead-of-next-image',
    category: 'technical',
    severity: 'medium',
    title: 'Usage de `<img>` brut au lieu de `next/image`',
    description:
      "Au moins une page marketing utilise `<img src=...>` au lieu de `<Image />` de `next/image` — perte lazy-loading + LCP non optimisé.",
    evidence: {
      filePath: 'app/(marketing)/home/hero.tsx',
      line: 42,
    },
    recommendation:
      "Remplacer `<img>` par `import Image from 'next/image'` et `<Image src={...} width={...} height={...} alt='...' priority?={isAboveTheFold} />`. Spécifier `priority` sur le LCP.",
    confidence: 'certain',
  },
  {
    ruleId: 'GEO-missing-organization-jsonld',
    category: 'geo',
    severity: 'medium',
    title: 'JSON-LD Organization absent',
    description:
      "La page d'accueil (ou une page autorité) n'inclut pas de JSON-LD `@type: Organization` — affaiblit la compréhension de l'entité par les LLM et Google KG.",
    evidence: {
      url: 'https://shooting-pilot.com',
    },
    recommendation:
      "Injecter un JSON-LD Organization sur `/` (au minimum) : `name`, `url`, `logo`, `sameAs` (réseaux sociaux), `contactPoint`. Référence : https://schema.org/Organization.",
    confidence: 'certain',
  },
  {
    ruleId: 'GEO-missing-softwareapplication-jsonld',
    category: 'geo',
    severity: 'medium',
    title: 'JSON-LD SoftwareApplication absent (projet SaaS)',
    description:
      "Pour un projet de type SaaS, la page produit ou home n'inclut pas de JSON-LD `@type: SoftwareApplication` — perte de rich results (rating, prix) et de citations LLM.",
    evidence: {
      url: 'https://shooting-pilot.com',
    },
    recommendation:
      "Ajouter un JSON-LD SoftwareApplication sur la home ou la page produit principale : `name`, `applicationCategory`, `operatingSystem`, `offers.price`, `aggregateRating`. Référence : https://schema.org/SoftwareApplication.",
    confidence: 'certain',
  },
  {
    ruleId: 'TECH-missing-robots',
    category: 'technical',
    severity: 'low',
    title: 'robots.txt absent',
    description:
      "`/robots.txt` est absent — Google applique un comportement par défaut, mais pas de contrôle explicite sur l'indexation.",
    evidence: {
      url: 'https://shooting-pilot.com/robots.txt',
      statusCode: 404,
    },
    recommendation:
      'Créer `app/robots.ts` (Next.js 15) avec `User-agent: *`, `Allow: /` (ou `Disallow:` ciblé), et `Sitemap: https://shooting-pilot.com/sitemap.xml`.',
    confidence: 'certain',
  },
];
