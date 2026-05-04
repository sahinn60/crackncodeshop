// Load env
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const outDir = path.join(__dirname, '..', 'laravel-project', 'database', 'export');

async function main() {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  console.log('Exporting data...');

  const settings = await prisma.settings.findFirst();
  fs.writeFileSync(path.join(outDir, 'settings.json'), JSON.stringify(settings, null, 2));
  console.log('✓ settings');

  const categories = await prisma.category.findMany();
  fs.writeFileSync(path.join(outDir, 'categories.json'), JSON.stringify(categories, null, 2));
  console.log('✓ categories:', categories.length);

  const products = await prisma.product.findMany();
  fs.writeFileSync(path.join(outDir, 'products.json'), JSON.stringify(products, null, 2));
  console.log('✓ products:', products.length);

  const reviews = await prisma.review.findMany();
  fs.writeFileSync(path.join(outDir, 'reviews.json'), JSON.stringify(reviews, null, 2));
  console.log('✓ reviews:', reviews.length);

  const coupons = await prisma.coupon.findMany();
  fs.writeFileSync(path.join(outDir, 'coupons.json'), JSON.stringify(coupons, null, 2));
  console.log('✓ coupons:', coupons.length);

  const flashSales = await prisma.flashSale.findMany({ include: { items: true } });
  fs.writeFileSync(path.join(outDir, 'flash_sales.json'), JSON.stringify(flashSales, null, 2));
  console.log('✓ flash_sales:', flashSales.length);

  const bundles = await prisma.bundle.findMany({ include: { items: true } });
  fs.writeFileSync(path.join(outDir, 'bundles.json'), JSON.stringify(bundles, null, 2));
  console.log('✓ bundles:', bundles.length);

  const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, permissions: true, credentialKey: true, password: true } });
  fs.writeFileSync(path.join(outDir, 'users.json'), JSON.stringify(users, null, 2));
  console.log('✓ users:', users.length);

  const orders = await prisma.order.findMany({ include: { items: true } });
  fs.writeFileSync(path.join(outDir, 'orders.json'), JSON.stringify(orders, null, 2));
  console.log('✓ orders:', orders.length);

  const upsellRules = await prisma.upsellRule.findMany();
  fs.writeFileSync(path.join(outDir, 'upsell_rules.json'), JSON.stringify(upsellRules, null, 2));
  console.log('✓ upsell_rules:', upsellRules.length);

  const landingPages = await prisma.landingPage.findMany();
  fs.writeFileSync(path.join(outDir, 'landing_pages.json'), JSON.stringify(landingPages, null, 2));
  console.log('✓ landing_pages:', landingPages.length);

  console.log('\n✅ All exported to:', outDir);
}

main().catch(console.error).finally(() => prisma.$disconnect());
