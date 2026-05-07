import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

declare global { var _prisma: PrismaClient | undefined }

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.warn('[Prisma] DATABASE_URL not set - returning dummy client');
    return new Proxy({} as PrismaClient, {
      get: (_target, prop) => {
        if (prop === '$connect' || prop === '$disconnect') return () => Promise.resolve();
        // Return a chainable proxy for any model access
        return new Proxy(() => Promise.resolve(null), {
          get: () => () => Promise.resolve(null),
          apply: () => Promise.resolve(null),
        });
      },
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

// Don't cache during build - always create fresh at runtime
const isBuilding = process.env.NEXT_PHASE === 'phase-production-build';

export const prisma: PrismaClient = isBuilding
  ? createClient()
  : (global._prisma ?? (global._prisma = createClient()));
