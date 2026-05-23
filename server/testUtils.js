import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { seedDatabase } from './seedData.js';
import { setupDatabase } from './setupDatabase.js';

export async function createTestDatabase() {
  const dir = mkdtempSync(join(tmpdir(), 'winlist-test-'));
  const databaseUrl = `file:${join(dir, 'test.db')}`;
  process.env.DATABASE_URL = databaseUrl;

  const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  await setupDatabase(prisma);
  return {
    dir,
    uploadDir: join(dir, 'uploads'),
    prisma,
    async cleanup() {
      await prisma.$disconnect();
      rmSync(dir, { recursive: true, force: true });
    }
  };
}

export async function resetTestDatabase(prisma) {
  await seedDatabase(prisma);
}
