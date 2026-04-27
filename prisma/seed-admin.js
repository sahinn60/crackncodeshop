const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = 'admin@crackncode.shop';
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('Admin user already exists:', existing.email, '| role:', existing.role);
    return;
  }

  const password = await bcrypt.hash('Admin@123', 12);
  const admin = await prisma.user.create({
    data: {
      name: 'Admin',
      email,
      password,
      role: 'ADMIN',
    },
  });
  console.log('Admin user created!');
  console.log('Email:', admin.email);
  console.log('Password: Admin@123');
}

main().catch(console.error).finally(() => prisma.$disconnect());
