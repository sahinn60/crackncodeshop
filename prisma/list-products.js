const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const products = await prisma.product.findMany({ select: { id: true, title: true } });
  console.log('Products in DB:', products.length);
  products.forEach(p => console.log(`  ${p.id} — ${p.title}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
