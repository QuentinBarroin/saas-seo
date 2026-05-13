export type ScanOptions = {
  /** Chemin local racine du repo à scanner. La version git-clone viendra en Lot 1 (cf. backlog). */
  path: string;
  /** Globs à inclure (relatifs à path). Défaut : fichiers d'intérêt Next.js. */
  include?: string[];
  /** Globs à exclure. Défaut : node_modules, .next, .git, dist, build. */
  exclude?: string[];
  /** Plafond pour éviter d'OOM sur gros monorepos. Défaut : 2000. */
  maxFiles?: number;
};

export type RepoFile = {
  /** Chemin POSIX relatif à la racine du repo (slashes normalisés). */
  path: string;
  /** Contenu UTF-8 lu une fois, conservé en mémoire. */
  content: string;
  /** Taille en bytes du fichier source. */
  size: number;
};

export type AppRouterRoute = {
  /** Chemin URL inféré (ex: `/`, `/dashboard`, `/(app)/projects/new` → `/projects/new`). */
  route: string;
  /** Chemin POSIX du fichier `page.tsx`/`page.ts` relatif à la racine. */
  filePath: string;
  /** Group `(app)`, `(marketing)`, etc. — utile pour le scoring CODE-* "route privée vs marketing". */
  group: string | null;
};

export type ScanResult = {
  /** Chemin absolu de la racine scannée. */
  rootPath: string;
  /** Fichiers lus, après filtrage include/exclude et limite maxFiles. */
  files: RepoFile[];
  /** Présence de Next.js détectée via package.json (dep `next`) OU `next.config.*`. */
  isNextProject: boolean;
  /** Architecture détectée : app router, pages router, mixte, ou aucun. */
  router: 'app' | 'pages' | 'mixed' | 'none';
  /** Routes app router inférées depuis `app/**\/page.tsx`. */
  routes: AppRouterRoute[];
  /** Erreurs non bloquantes (fichiers illisibles, hors `maxFiles`, etc.). */
  warnings: string[];
};
