import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

declare global {
  var _prisma: PrismaClient | undefined;
}

function createClient(): PrismaClient {
  const url = process.env.DATABASE_URL;

  if (!url) {
    console.warn('[Prisma] DATABASE_URL not set');
    return new Proxy({} as PrismaClient, {
      get: (_t, prop) => {
        if (prop === '$connect' || prop === '$disconnect') return () => Promise.resolve();
        return new Proxy(() => Promise.resolve(null), {
          get: () => () => Promise.resolve(null),
          apply: () => Promise.resolve(null),
        });
      },
    });
  }

  // Use driver adapter for pg
  const { PrismaPg } = require('@prisma/adapter-pg');
  const pool = new Pool({
    connectionString: url,
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    ssl: { rejectUnauthorized: false },
  });

  pool.on('error', (err: Error) => {
    console.error('[DB] Pool error:', err.message);
  });

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter } as any);
}

export const prisma: PrismaClient =
  globalThis._prisma ?? (globalThis._prisma = createClient());
