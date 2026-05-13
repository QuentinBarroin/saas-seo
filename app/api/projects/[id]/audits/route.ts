import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ProjectNotFoundError, triggerAudit } from '@/lib/audits/trigger';

const paramsSchema = z.object({ id: z.string().cuid('Invalid project id') });

/**
 * POST /api/projects/[id]/audits — déclenche un audit pour le projet.
 * Réponse 202 Accepted : l'audit est créé en `pending` et le worker
 * Inngest prend le relais en arrière-plan.
 */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: 'unauthorized', message: 'Auth requise' } },
      { status: 401 }
    );
  }

  const params = await ctx.params;
  const parsed = paramsSchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: 'bad_request',
          message: parsed.error.issues[0]?.message ?? 'Invalid params',
        },
      },
      { status: 400 }
    );
  }

  try {
    const result = await triggerAudit({ projectId: parsed.data.id });
    return NextResponse.json(result, { status: 202 });
  } catch (err) {
    if (err instanceof ProjectNotFoundError) {
      return NextResponse.json(
        { error: { code: 'not_found', message: err.message } },
        { status: 404 }
      );
    }
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: { code: 'internal_error', message } },
      { status: 500 }
    );
  }
}
