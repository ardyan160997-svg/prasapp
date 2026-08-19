import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const configuredDatabaseUrl = process.env.DATABASE_URL;
const databaseUrl = configuredDatabaseUrl?.startsWith('file:') || configuredDatabaseUrl?.startsWith('libsql:')
  ? configuredDatabaseUrl
  : 'file:./dev.db';
const adapter = new PrismaLibSql({ url: databaseUrl });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;