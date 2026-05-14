import { db } from '@/lib/db';

export async function deleteProject(id: string): Promise<void> {
  await db.seoProject.delete({
    where: { id },
  });
}
