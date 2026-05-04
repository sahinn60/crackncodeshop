const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'laravel-project', 'database', 'export');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_o3Y4djAkvQZX@ep-cool-thunder-an3jghcm-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log('Connected to Neon DB');

  const tables = [
    { name: 'Settings', file: 'settings.json' },
    { name: 'Category', file: 'categories.json' },
    { name: 'Product', file: 'products.json' },
    { name: 'Review', file: 'reviews.json' },
    { name: 'Coupon', file: 'coupons.json' },
    { name: 'FlashSale', file: 'flash_sales.json' },
    { name: 'FlashSaleItem', file: 'flash_sale_items.json' },
    { name: 'Bundle', file: 'bundles.json' },
    { name: 'BundleItem', file: 'bundle_items.json' },
    { name: 'User', file: 'users.json' },
    { name: 'Order', file: 'orders.json' },
    { name: 'OrderItem', file: 'order_items.json' },
    { name: 'UpsellRule', file: 'upsell_rules.json' },
    { name: 'LandingPage', file: 'landing_pages.json' },
  ];

  for (const t of tables) {
    try {
      const res = await client.query(`SELECT * FROM "${t.name}"`);
      fs.writeFileSync(path.join(outDir, t.file), JSON.stringify(res.rows, null, 2));
      console.log(`✓ ${t.name}: ${res.rows.length} rows`);
    } catch (e) {
      console.log(`✗ ${t.name}: ${e.message}`);
    }
  }

  await client.end();
  console.log('\n✅ Export done! Files in:', outDir);
}

main().catch(e => { console.error(e); process.exit(1); });
