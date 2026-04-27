const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const id = 'admin-dashboard-pro';
  const [orders, downloads, reviews] = await Promise.all([
    prisma.orderItem.count({ where: { productId: id } }),
    prisma.downloadToken.count({ where: { productId: id } }),
    prisma.review.count({ where: { productId: id } }),
  ]);
  console.log(`OrderItems: ${orders}, DownloadTokens: ${downloads}, Reviews: ${reviews}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
