import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  console.log('Seeding...');

  const existing = await db.seoProject.findFirst({
    where: { name: 'Shooting Pilot' },
    select: { id: true },
  });

  if (existing) {
    console.log(`Projet "Shooting Pilot" existe déjà (id=${existing.id}). Skip.`);
    return;
  }

  const project = await db.seoProject.create({
    data: {
      name: 'Shooting Pilot',
      domain: 'https://shootingpilot.com',
      repoUrl: null,
      type: 'saas',
      businessGoal: 'demos,leads',
      market: 'FR',
    },
  });

  console.log(`Projet créé : ${project.id} · ${project.name}`);

  // 3 concurrents manuels représentatifs (domaines fictifs)
  await db.competitor.createMany({
    data: [
      { projectId: project.id, domain: 'concurrent-photo.fr', source: 'manual' },
      { projectId: project.id, domain: 'shooting-pro.com', source: 'manual' },
      { projectId: project.id, domain: 'photoflow.io', source: 'manual' },
    ],
  });
  console.log('3 concurrents manuels insérés.');

  // ~15 seed keywords sans cluster (Quentin les taggera via /keywords)
  // Pattern réaliste pour un SaaS de gestion shootings
  const seeds = [
    'logiciel gestion shooting photo',
    'app planification séance photo',
    'outil photographe pro',
    'planning shooting',
    'planning photographe',
    'facturation photographe',
    'gestion clients photographe',
    'devis shooting photo',
    'workflow photographe',
    'logiciel photographe mariage',
    'logiciel photographe portrait',
    'application photographe professionnel',
    'crm photographe',
    'agenda photographe en ligne',
    'gestion shooting commercial',
  ];
  await db.keyword.createMany({
    data: seeds.map((query, i) => ({
      projectId: project.id,
      query,
      source: 'seed',
      isMoneyKeyword: i === 0, // le 1er est money pour démontrer le scoring
    })),
  });
  console.log(`${seeds.length} seed keywords insérés (1 money).`);

  console.log('Seed done.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
