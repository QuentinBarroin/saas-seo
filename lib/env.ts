import { z } from 'zod';

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    DATABASE_URL: z.string().url(),
    DIRECT_URL: z.string().url().optional(),
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    // Supabase a migré de `anon` (JWT eyJ...) vers `publishable` (sb_publishable_...) en 2025.
    // On accepte les deux ; le nouveau prime si les deux sont définis.
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
    INNGEST_EVENT_KEY: z.string().min(1).optional(),
    INNGEST_SIGNING_KEY: z.string().min(1).optional(),
    ENCRYPTION_KEY: z
      .string()
      .regex(/^[0-9a-fA-F]{64}$/, 'ENCRYPTION_KEY doit faire 32 bytes en hex (64 caractères)')
      .optional(),
    ANTHROPIC_API_KEY: z.string().min(1).optional(),
    GOOGLE_OAUTH_CLIENT_ID: z.string().min(1).optional(),
    GOOGLE_OAUTH_CLIENT_SECRET: z.string().min(1).optional(),
    GOOGLE_OAUTH_REDIRECT_URI: z.string().url().optional(),
    MAX_KEYWORDS_PER_AUDIT: z.coerce.number().int().positive().default(50),
    MAX_DATAFORSEO_USD_PER_AUDIT: z.coerce.number().positive().default(0.5),
    MAX_ANTHROPIC_USD_PER_AUDIT: z.coerce.number().positive().default(0.5),
  })
  .refine(
    (data) =>
      Boolean(data.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? data.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    {
      message:
        'Au moins une de NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ou NEXT_PUBLIC_SUPABASE_ANON_KEY doit être définie',
      path: ['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'],
    }
  );

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid environment variables:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}

/**
 * Retourne la clé publique Supabase à utiliser côté browser/server.
 * Priorité : PUBLISHABLE_KEY (nouveau naming Supabase) > ANON_KEY (legacy).
 *
 * NB : utilisable côté client uniquement parce que la clé est dans `NEXT_PUBLIC_*`.
 * Côté server components, on lit aussi `process.env` directement pour éviter d'importer getEnv()
 * (qui valide tout le bloc — overkill pour un simple lookup).
 */
export function resolveSupabasePublicKey(): string {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error(
      'Aucune clé publique Supabase définie : set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ou NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }
  return key;
}
