import { createApp } from './app.js';
import { getPrisma } from './prisma.js';
import { seedDatabase } from './seedData.js';
import { setupDatabase } from './setupDatabase.js';

const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || '127.0.0.1';
const prisma = getPrisma();

await setupDatabase(prisma);
if ((await prisma.user.count()) === 0) {
  await seedDatabase(prisma);
}

const app = await createApp({ prisma });

try {
  await app.listen({ port, host });
  app.log.info(`WINlist API listening at http://${host}:${port}`);
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
