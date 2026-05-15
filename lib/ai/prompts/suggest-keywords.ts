import { z } from 'zod';

/** Contexte projet transmis à Claude pour amorcer une liste de seed keywords. */
export type SuggestKeywordsPromptInput = {
  name: string;
  domain: string;
  type: string;
  businessGoal: string;
  market: string;
};

export const SUGGEST_KEYWORDS_SYSTEM_PROMPT = `Tu es un expert SEO. À partir du contexte métier d'un projet web, tu proposes une liste de "seed keywords" — les mots-clés d'amorçage qui serviront de base à un audit SEO (clustering, content gap, suivi SERP).

RÈGLES STRICTES :
1. Propose entre 15 et 20 mots-clés, pas plus.
2. Des requêtes RÉALISTES, telles que de vraies personnes les tapent dans Google — pas des slogans, pas du jargon interne.
3. Ancrés sur le métier réel du projet (son type, son objectif business). N'invente AUCUN nom de marque, produit ou service qui ne découle pas du contexte fourni.
4. Dans la langue du marché indiqué (ex. market "FR" → mots-clés en français).
5. Mélange les intentions : informationnel (ex. "comment ..."), commercial/transactionnel (ex. "cabinet ...", "agence ..."), et quelques requêtes de longue traîne.
6. Tout en minuscules, sans ponctuation superflue, pas de doublon.
7. Tu ne produis PAS de prose, PAS de markdown — uniquement du JSON conforme au schema.

FORMAT DE SORTIE (JSON strict) :
{
  "keywords": ["mot-clé 1", "mot-clé 2", ...]
}`;

export function buildSuggestUserPrompt(input: SuggestKeywordsPromptInput): string {
  return `Projet : ${input.name}
Domaine : ${input.domain}
Type : ${input.type}
Objectif business : ${input.businessGoal}
Marché : ${input.market}

Propose la liste de seed keywords au format JSON conforme au schema. Le système prompt te donne les règles complètes.`;
}

export const suggestResponseSchema = z.object({
  keywords: z.array(z.string()).min(1),
});

export type SuggestResponse = z.infer<typeof suggestResponseSchema>;
