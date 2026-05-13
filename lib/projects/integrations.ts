import { z } from 'zod';
import { db } from '@/lib/db';
import { decrypt, encrypt } from '@/lib/crypto';

/**
 * Schema des intégrations chiffrées par projet. Stocké en JSON chiffré
 * AES-256-GCM dans `SeoProject.integrationsEnc` (colonne Bytes).
 *
 * Conventions :
 *  - Tous les champs sont **optionnels** : un projet peut avoir 0 intégration.
 *  - Pas de field "vide" persisté ({} équivaut à integrationsEnc=null côté DB).
 *  - Ne JAMAIS logger un ProjectIntegrations sans masquage (secrets en clair).
 */
export const projectIntegrationsSchema = z.object({
  dataforseo: z
    .object({
      login: z.string().min(1, 'Login DataForSEO requis'),
      password: z.string().min(1, 'Password DataForSEO requis'),
    })
    .optional(),
  // gsc en S2-01 (refresh token + property url)
});

export type ProjectIntegrations = z.infer<typeof projectIntegrationsSchema>;

/* ─── Pure helpers (testables sans DB) ─────────────────────────────────── */

/** Sérialise + chiffre + encode en Buffer pour stockage en colonne Bytes. */
export function serializeIntegrations(integrations: ProjectIntegrations): Buffer {
  const validated = projectIntegrationsSchema.parse(integrations);
  const plaintext = JSON.stringify(validated);
  const cipherBase64 = encrypt(plaintext);
  return Buffer.from(cipherBase64, 'base64');
}

/**
 * Décode Buffer → base64 → décrypt → parse JSON → valide Zod.
 * Renvoie `{}` si payload invalide ou JSON corrompu (defensive — pas de throw).
 */
export function deserializeIntegrations(buf: Buffer): ProjectIntegrations {
  try {
    const cipherBase64 = buf.toString('base64');
    const plaintext = decrypt(cipherBase64);
    const parsed = projectIntegrationsSchema.safeParse(JSON.parse(plaintext));
    return parsed.success ? parsed.data : {};
  } catch {
    return {};
  }
}

/* ─── DB-bound (orchestration) ─────────────────────────────────────────── */

export async function getProjectIntegrations(projectId: string): Promise<ProjectIntegrations> {
  const project = await db.seoProject.findUnique({
    where: { id: projectId },
    select: { integrationsEnc: true },
  });
  if (!project?.integrationsEnc) return {};
  return deserializeIntegrations(Buffer.from(project.integrationsEnc));
}

/**
 * Remplace TOUT le bloc intégrations. Utile pour reset.
 * Pour ajouter/modifier une intégration spécifique, préférer setDataForSeoCredentials etc.
 */
export async function setProjectIntegrations(
  projectId: string,
  integrations: ProjectIntegrations
): Promise<void> {
  const isEmpty = Object.keys(integrations).length === 0;
  // Prisma `Bytes` attend Uint8Array<ArrayBuffer> strict ; Buffer<ArrayBufferLike> est compatible
  // au runtime mais TS est strict. Cast au boundary.
  // Prisma `Bytes` attend Uint8Array<ArrayBuffer> strict ; Buffer<ArrayBufferLike> est compatible
  // au runtime. Double cast au boundary pour satisfaire TS sans copie inutile.
  const blob = isEmpty
    ? null
    : (serializeIntegrations(integrations) as unknown as Uint8Array<ArrayBuffer>);
  await db.seoProject.update({
    where: { id: projectId },
    data: { integrationsEnc: blob },
  });
}

export async function setDataForSeoCredentials(
  projectId: string,
  creds: NonNullable<ProjectIntegrations['dataforseo']>
): Promise<void> {
  const current = await getProjectIntegrations(projectId);
  await setProjectIntegrations(projectId, { ...current, dataforseo: creds });
}

/**
 * Récupère les creds DataForSEO. Ordre de priorité :
 *  1. Stockage chiffré du projet (production)
 *  2. Variables d'env DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD (dev local)
 *  3. null si rien
 */
export async function getDataForSeoCredentials(
  projectId?: string
): Promise<NonNullable<ProjectIntegrations['dataforseo']> | null> {
  if (projectId) {
    const integrations = await getProjectIntegrations(projectId);
    if (integrations.dataforseo) return integrations.dataforseo;
  }
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  if (login && password) return { login, password };
  return null;
}
