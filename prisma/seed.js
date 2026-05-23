import { PrismaClient } from '@prisma/client';
import { seedDatabase } from '../server/seedData.js';
import { setupDatabase } from '../server/setupDatabase.js';

const prisma = new PrismaClient();

try {
  await setupDatabase(prisma);
  await seedDatabase(prisma);
  console.log('Seeded DoDoNow users, friendships, and tasks.');
} finally {
  await prisma.$disconnect();
}
