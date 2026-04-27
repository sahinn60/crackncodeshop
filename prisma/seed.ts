// Load env first before any other require
require('dotenv').config();

import bcrypt from 'bcryptjs';

async function main() {
  // Import prisma AFTER env is loaded
  const { prisma } = await import('../lib/prisma');

  const adminPassword = await bcrypt.hash('Cr@ckNc0de#Adm1n$2026!', 12);
  await prisma.user.upsert({
    where: { email: 'admin@crackncode.shop' },
    update: { password: adminPassword },
    create: { name: 'Admin', email: 'admin@crackncode.shop', password: adminPassword, role: 'ADMIN' },
  });

  await prisma.settings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: { id: 'singleton', siteName: 'Crackncode' },
  });

  const products = [
    { title: 'Pro UI Kit 2.0', description: 'A comprehensive UI kit for building modern SaaS applications. Includes 500+ components.', price: 49.00, imageUrl: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800', category: 'Design Assets', features: JSON.stringify(['500+ Components', 'Auto-layout V4', 'Dark & Light modes', 'Free updates for life']), lastUpdated: 'April 2026', format: 'Figma, React, Tailwind' },
    { title: 'SaaS Starter Kit', description: 'Next.js boilerplate with authentication and database setup ready to go.', price: 149.00, imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800', category: 'Templates', features: JSON.stringify(['Next.js 15', 'Auth included', 'Prisma ORM', 'Stripe payments']), lastUpdated: 'April 2026', format: 'Next.js, TypeScript' },
    { title: 'Data Vis Dashboard', description: 'Beautiful data visualization templates using Recharts and Tailwind CSS.', price: 39.00, imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800', category: 'Templates', features: JSON.stringify(['10+ Chart types', 'Dark mode', 'Responsive', 'CSV export']), lastUpdated: 'March 2026', format: 'React, Recharts' },
    { title: 'Icon Bundle Vol. 1', description: '1000+ custom vector icons for your apps and websites.', price: 29.00, imageUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800', category: 'Design Assets', features: JSON.stringify(['1000+ icons', 'SVG & PNG', 'Multiple sizes', 'Commercial license']), lastUpdated: 'February 2026', format: 'SVG, PNG, Figma' },
    { title: 'E-commerce Theme', description: 'High-conversion Shopify theme with modern design and fast performance.', price: 79.00, imageUrl: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800', category: 'Themes', features: JSON.stringify(['Mobile first', 'SEO optimized', 'Fast loading', '1-click install']), lastUpdated: 'April 2026', format: 'Shopify Liquid' },
    { title: 'Landing Page Builder', description: 'Drag and drop landing page components for maximum conversions.', price: 89.00, imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800', category: 'Templates', features: JSON.stringify(['50+ sections', 'A/B testing ready', 'Analytics built-in', 'No-code friendly']), lastUpdated: 'March 2026', format: 'HTML, CSS, JS' },
    { title: 'Social Media Pack', description: 'Instagram and Twitter template pack for consistent branding.', price: 19.00, imageUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800', category: 'Design Assets', features: JSON.stringify(['200+ templates', 'Story formats', 'Post formats', 'Editable in Canva']), lastUpdated: 'January 2026', format: 'Canva, Figma' },
    { title: 'Admin Dashboard Pro', description: 'React admin dashboard with dark mode and comprehensive analytics.', price: 59.00, imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800', category: 'Templates', features: JSON.stringify(['Dark/Light mode', 'Role-based access', 'Charts & tables', 'TypeScript']), lastUpdated: 'April 2026', format: 'React, TypeScript' },
  ];

  for (const product of products) {
    const id = product.title.toLowerCase().replace(/\s+/g, '-');
    await prisma.product.upsert({
      where: { id },
      update: {},
      create: { id, ...product, rating: 4.8 },
    });
  }

  console.log('✅ Database seeded successfully!');
  console.log('👤 Admin: admin@crackncode.shop / Cr@ckNc0de#Adm1n$2026!');
  console.log('🔑 JWT Secret updated in .env');

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
