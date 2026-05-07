import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

declare global { var _prisma: PrismaClient | undefined }

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    // During build time, return a proxy that won't crash
    return new Proxy({} as PrismaClient, {
      get: () => () => Promise.resolve(null),
    });
  }

  const pool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    keepAlive: true,
    ssl: { rejectUnauthorized: false },
  });

  pool.on('error', (err) => {
    console.error('[DB] Pool error:', err.message);
  });

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter } as any);
}

export const prisma: PrismaClient = global._prisma ?? (global._prisma = createClient());
