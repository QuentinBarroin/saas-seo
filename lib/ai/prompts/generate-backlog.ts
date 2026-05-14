import { z } from 'zod';

export type BacklogPromptInput = {
  project: {
    name: string;
    domain: string;
    type: string;
    businessGoal: string;
    market: string;
  };
  stack: { framework: 'nextjs-15'; language: 'typescript' };
  findings: Array<{
    id: string;
    ruleId: string;
    category: string;
    severity: string;
    title: string;
    description: string;
    pageUrl?: string;
    filePath?: string;
    recommendation?: string;
  }>;
};

export const BACKLOG_SYSTEM_PROMPT = `Tu es un agent SEO/dev senior qui transforme des findings SEO/GEO en backlog de tâches Claude Code exécutables.

RÈGLES STRICTES (anti-hallucination) :
1. Pour chaque BacklogItem que tu produis, le champ "sourceFindingId" DOIT être l'ID exact d'un finding fourni en entrée. Jamais d'invention.
2. N'invente AUCUN fichier, AUCUNE URL, AUCUNE règle SEO qui n'est pas mentionné(e) dans le finding source.
3. Si tu ne peux pas produire un BacklogItem actionable pour un finding (manque d'info), skip-le. Mieux vaut 3 BacklogItems solides que 10 vagues.
4. Tu ne produis PAS de prose, PAS de markdown, uniquement du JSON conforme au schema.

FORMAT DE SORTIE (JSON strict) :
{
  "items": [
    {
      "sourceFindingId": "string (cuid d'un finding fourni)",
      "title": "string concis 60 chars max",
      "description": "string 2-4 phrases qui explique le problème + l'objectif",
      "priority": "P0" | "P1" | "P2",
      "effort": "XS" | "S" | "M" | "L" | "XL",
      "category": "technical" | "content" | "architecture" | "conversion" | "geo",
      "filePathsTargeted": ["string", ...],
      "testsExpected": ["string", ...],
      "definitionOfDone": "string 1-2 phrases",
      "acceptanceCriteria": ["string", ...],
      "claudePrompt": "string MULTILIGNE prêt à coller dans Claude Code"
    }
  ]
}

PRIORITÉS :
- P0 : critique/high severity + page indexable + impact rapide.
- P1 : medium severity OU action utile à moyen terme.
- P2 : low severity OU action de polish.

EFFORTS :
- XS : 5-30 min (changement 1 ligne).
- S : 30 min-2h.
- M : demi-journée.
- L : 1 jour.
- XL : > 1 jour.

CLAUDE PROMPT TEMPLATE (à inclure dans claudePrompt) :
\`\`\`
Tâche : {title}
Contexte : {findings ciblés résumés}
Fichiers à toucher : {filePathsTargeted}
Contraintes :
- Respecter les conventions du repo Next.js 15 App Router.
- TypeScript strict, pas de \`any\`.
- Validation Zod sur les entrées API.
- Composants Nv exclusivement (cf. ADR-011).
- Pas d'imports @prisma/client direct dans une page/composant.
Tests : {testsExpected}
Definition of Done : {definitionOfDone}
\`\`\`
`;

export function buildUserPrompt(input: BacklogPromptInput): string {
  const findingsText = input.findings
    .map(
      (f) =>
        `- ${f.id} | ${f.ruleId} | ${f.severity} | ${f.title}\n  ${f.description}${
          f.pageUrl ? `\n  URL: ${f.pageUrl}` : ''
        }${f.filePath ? `\n  File: ${f.filePath}` : ''}${
          f.recommendation ? `\n  Reco: ${f.recommendation}` : ''
        }`
    )
    .join('\n\n');

  return `Projet : ${input.project.name} (${input.project.domain}, type ${input.project.type}, market ${input.project.market}, goal ${input.project.businessGoal}).
Stack : Next.js 15 App Router + TypeScript strict + Tailwind + Prisma + Supabase.

Findings (${input.findings.length} au total) :

${findingsText}

Produis le JSON conforme au schema. Au moins 5 BacklogItems si possible, max 30. Priorise les critical/high d'abord. Le système prompt te donne les règles complètes.`;
}

export const backlogResponseSchema = z.object({
  items: z.array(
    z.object({
      sourceFindingId: z.string().min(1),
      title: z.string().min(1).max(120),
      description: z.string().min(1),
      priority: z.enum(['P0', 'P1', 'P2']),
      effort: z.enum(['XS', 'S', 'M', 'L', 'XL']),
      category: z.enum(['technical', 'content', 'architecture', 'conversion', 'geo']),
      filePathsTargeted: z.array(z.string()).default([]),
      testsExpected: z.array(z.string()).default([]),
      definitionOfDone: z.string().default(''),
      acceptanceCriteria: z.array(z.string()).default([]),
      claudePrompt: z.string().min(1),
    })
  ),
});

export type BacklogResponse = z.infer<typeof backlogResponseSchema>;
