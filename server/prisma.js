import { PrismaClient } from '@prisma/client';

let prisma;

export function getPrisma() {
  process.env.DATABASE_URL ||= 'file:./dev.db';
  if (!prisma) prisma = new PrismaClient();
  return prisma;
}
