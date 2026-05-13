import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  console.log('Seeding...');
  // Aucune donnée seed au scaffold initial. Le seed sera utilisé en Sprint 1
  // pour créer un projet "Shooting Pilot" de référence pour les tests E2E.
  console.log('Seed done (no-op).');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
