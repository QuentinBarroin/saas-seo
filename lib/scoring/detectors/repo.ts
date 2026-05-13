import path from 'node:path';
import type { ScanResult } from '@/lib/repo-scan';
import { isMarketingRoute } from '@/lib/repo-scan/routes';
import {
  parseSourceFile,
  hasUseClientDirective,
  hasMetadataExport,
  countJsxTags,
  hasJsonLdInjection,
  hasUnoptimizedImagesInNextConfig,
} from '@/lib/repo-scan/ast';
import { buildFinding, type FindingDraft } from '../finding';

export type DetectorOptions = {
  privateRouteGroups?: string[];
};

export function detectFromRepo(scanResult: ScanResult, opts?: DetectorOptions): FindingDraft[] {
  const findings: FindingDraft[] = [];
  const privateGroups = opts?.privateRouteGroups ?? ['app', 'dashboard', 'auth'];

  const marketingRoutes = scanResult.routes.filter((r) => isMarketingRoute(r, privateGroups));

  findings.push(...detectSiteFiles(scanResult));

  findings.push(...detectNextConfig(scanResult));

  for (const route of marketingRoutes) {
    findings.push(...detectMarketingRoute(scanResult, route));
  }

  findings.push(...detectJsonLdPresence(scanResult));

  return findings;
}

function detectSiteFiles(scanResult: ScanResult): FindingDraft[] {
  const out: FindingDraft[] = [];

  const hasSitemapTs = scanResult.files.some(
    (f) =>
      /^app\/sitemap\.(ts|tsx|js|jsx)$/.test(f.path) ||
      /^pages\/sitemap\.xml\.(ts|tsx|js|jsx)$/.test(f.path)
  );
  if (!hasSitemapTs) {
    out.push(buildFinding('CODE-missing-sitemap-ts', { searchedIn: 'app/, pages/' }));
  }

  const hasRobotsTs = scanResult.files.some((f) => /^app\/robots\.(ts|tsx|js|jsx)$/.test(f.path));
  if (!hasRobotsTs) {
    out.push(buildFinding('CODE-missing-robots-ts', { searchedIn: 'app/' }));
  }

  return out;
}

function detectNextConfig(scanResult: ScanResult): FindingDraft[] {
  const out: FindingDraft[] = [];

  const nextConfigFile = scanResult.files.find((f) =>
    /^next\.config\.(ts|js|mjs)$/.test(f.path)
  );
  if (nextConfigFile) {
    const check = hasUnoptimizedImagesInNextConfig(nextConfigFile.content);
    if (check.match) {
      out.push(
        buildFinding('CODE-images-unoptimized', {
          filePath: nextConfigFile.path,
          line: check.line,
        })
      );
    }
  }

  return out;
}

function detectMarketingRoute(scanResult: ScanResult, route: typeof scanResult.routes[0]): FindingDraft[] {
  const out: FindingDraft[] = [];
  const file = scanResult.files.find((f) => f.path === route.filePath);
  if (!file) return out;

  const absolutePath = path.join(scanResult.rootPath, file.path);
  const source = parseSourceFile(absolutePath, file.content);

  const metaExport = hasMetadataExport(source);
  if (!metaExport.metadata && !metaExport.generateMetadata) {
    out.push(buildFinding('CODE-missing-metadata', { filePath: file.path }));
  }

  if (hasUseClientDirective(source)) {
    out.push(buildFinding('CODE-use-client-on-marketing-route', { filePath: file.path, line: 1 }));
  }

  const imgCount = countJsxTags(source, 'img');
  if (imgCount > 0) {
    out.push(buildFinding('CODE-img-instead-of-next-image', { filePath: file.path, count: imgCount }));
  }

  return out;
}

function detectJsonLdPresence(scanResult: ScanResult): FindingDraft[] {
  let hasAnyJsonLd = false;

  for (const file of scanResult.files) {
    if (!/\.(ts|tsx|js|jsx)$/.test(file.path)) continue;
    const absolutePath = path.join(scanResult.rootPath, file.path);
    const source = parseSourceFile(absolutePath, file.content);
    if (hasJsonLdInjection(source)) {
      hasAnyJsonLd = true;
      break;
    }
  }

  if (!hasAnyJsonLd) {
    return [buildFinding('CODE-missing-jsonld', { searchedIn: 'app/**/*.tsx' }, 'à vérifier')];
  }
  return [];
}
