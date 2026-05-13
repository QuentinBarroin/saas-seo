import { Project, SyntaxKind, type SourceFile } from 'ts-morph';

/**
 * Helper d'AST partagé entre tous les détecteurs CODE-* (S1-05).
 *
 * Convention : on **n'instancie pas un Project ts-morph par défaut** ici (coûteux + dépend du tsconfig).
 * On parse fichier par fichier in-memory via `createSourceFile`, ce qui suffit pour les heuristiques
 * de S1-05 (use client, exports metadata/generateMetadata, JSX img, JSON-LD scripts).
 */

let cachedProject: Project | null = null;

function getProject(): Project {
  if (cachedProject) return cachedProject;
  cachedProject = new Project({ useInMemoryFileSystem: true, skipFileDependencyResolution: true });
  return cachedProject;
}

export function parseSourceFile(filePath: string, content: string): SourceFile {
  const project = getProject();
  const existing = project.getSourceFile(filePath);
  if (existing) {
    existing.replaceWithText(content);
    return existing;
  }
  return project.createSourceFile(filePath, content, { overwrite: true });
}

/** Détecte la directive `'use client'` ou `"use client"` en première position du fichier. */
export function hasUseClientDirective(source: SourceFile): boolean {
  const statements = source.getStatements();
  if (statements.length === 0) return false;
  const first = statements[0]!;
  if (!first.isKind(SyntaxKind.ExpressionStatement)) return false;
  const expr = first.getExpression();
  if (!expr.isKind(SyntaxKind.StringLiteral)) return false;
  return expr.getLiteralText() === 'use client';
}

/**
 * Détecte la présence d'un export `metadata` const OU `generateMetadata` function.
 * Couvre les patterns Next.js 13+ pour la metadata API.
 */
export function hasMetadataExport(source: SourceFile): {
  metadata: boolean;
  generateMetadata: boolean;
} {
  let metadata = false;
  let generateMetadata = false;

  for (const stmt of source.getVariableStatements()) {
    if (!stmt.hasExportKeyword()) continue;
    for (const decl of stmt.getDeclarations()) {
      if (decl.getName() === 'metadata') metadata = true;
    }
  }

  for (const fn of source.getFunctions()) {
    if (!fn.hasExportKeyword()) continue;
    if (fn.getName() === 'generateMetadata') generateMetadata = true;
  }

  return { metadata, generateMetadata };
}

/** Compte les occurrences de balises JSX matchant `tagName` dans le source. */
export function countJsxTags(source: SourceFile, tagName: string): number {
  let count = 0;
  source.forEachDescendant((node) => {
    if (
      node.isKind(SyntaxKind.JsxOpeningElement) ||
      node.isKind(SyntaxKind.JsxSelfClosingElement)
    ) {
      const name = node.getTagNameNode().getText();
      if (name === tagName) count++;
    }
  });
  return count;
}

/**
 * Détecte la présence d'un `<script type="application/ld+json">` (JSON-LD inline).
 * Détecte aussi le pattern Next.js `<Script ... type="application/ld+json">` (next/script).
 */
export function hasJsonLdInjection(source: SourceFile): boolean {
  let found = false;
  source.forEachDescendant((node) => {
    if (found) return;
    if (
      !node.isKind(SyntaxKind.JsxOpeningElement) &&
      !node.isKind(SyntaxKind.JsxSelfClosingElement)
    )
      return;
    const tag = node.getTagNameNode().getText();
    if (tag !== 'script' && tag !== 'Script') return;

    for (const attr of node.getAttributes()) {
      if (!attr.isKind(SyntaxKind.JsxAttribute)) continue;
      const name = attr.getNameNode().getText();
      if (name !== 'type') continue;
      const init = attr.getInitializer();
      if (!init) continue;
      if (init.isKind(SyntaxKind.StringLiteral)) {
        if (init.getLiteralText().toLowerCase() === 'application/ld+json') {
          found = true;
        }
      } else if (init.isKind(SyntaxKind.JsxExpression)) {
        const expr = init.getExpression();
        if (expr?.isKind(SyntaxKind.StringLiteral)) {
          if (expr.getLiteralText().toLowerCase() === 'application/ld+json') {
            found = true;
          }
        }
      }
    }
  });
  return found;
}

/**
 * Détection grossière (regex) sur le texte d'un `next.config.{ts,js,mjs}` :
 * cherche `images: { ... unoptimized: true ... }`. Suffit pour CODE-images-unoptimized.
 * Une analyse AST serait plus robuste mais on évite l'overhead pour ce cas simple.
 */
export function hasUnoptimizedImagesInNextConfig(content: string): { match: boolean; line: number | null } {
  const re = /images\s*:\s*\{[^}]*\bunoptimized\s*:\s*true/m;
  const m = re.exec(content);
  if (!m) return { match: false, line: null };
  const before = content.slice(0, m.index);
  const line = before.split('\n').length;
  return { match: true, line };
}
