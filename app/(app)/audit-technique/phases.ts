/** Libellés FR des phases d'un audit (clés = `AuditPhase` de lib/audits/persist). */
export const PHASE_LABEL: Record<string, string> = {
  init: 'Initialisation',
  crawl: 'Crawl',
  'repo-scan': 'Scan repo',
  'findings-crawler': 'Détecteurs crawler',
  'findings-repo': 'Détecteurs repo',
  'findings-geo': 'Détecteurs GEO',
  'findings-conversion': 'Détecteurs conversion',
  'findings-architecture': 'Détecteurs architecture',
  'import-gsc': 'Import GSC',
  serp: 'SERP',
  'competitors-detection': 'Détection concurrents',
  'content-gap': 'Content gap',
  'persist-findings': 'Persistance findings',
  score: 'Scoring',
  'backlog-generation': 'Génération backlog',
  finalize: 'Finalisation',
};

/** Libellé d'une phase, avec repli sur l'identifiant brut si inconnu. */
export function phaseLabel(phase: string): string {
  return PHASE_LABEL[phase] ?? phase;
}
