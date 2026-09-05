import { pool } from '../src/db/pool';

interface SeedProduct {
  sku: string;
  name: string;
  type: 'goods';
  category: 'Seating' | 'Tables' | 'Storage' | 'Beds';
  sales_price: string;
  cost_price: string;
  mrp: string;
  tax_rate: string;
  stock_qty: string;
  model_url: string;
  image_url: string;
}

const sampleProducts: SeedProduct[] = [
  // 1. Seating: Office Chair
  {
    sku: 'SEAT-OFF-001',
    name: 'Ergonomic Executive Office Chair',
    type: 'goods',
    category: 'Seating',
    sales_price: '8500.00',
    cost_price: '5200.00',
    mrp: '9999.00',
    tax_rate: '18.00',
    stock_qty: '25.00',
    model_url: '/models/Office Chair by Quaternius - UfKvrZBK6C.glb',
    image_url: 'https://images.unsplash.com/photo-1580481077195-c3a821a78f4b?auto=format&fit=crop&w=600&q=80',
  },
  // 2. Seating: Lounge Sofa
  {
    sku: 'SEAT-SOF-002',
    name: 'Royal Velvet Lounge Sofa — 3 Seater',
    type: 'goods',
    category: 'Seating',
    sales_price: '45000.00',
    cost_price: '28000.00',
    mrp: '52000.00',
    tax_rate: '18.00',
    stock_qty: '12.00',
    model_url: '/models/Couch Large by Quaternius - 6MoOyPtetL.glb',
    image_url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80',
  },
  // 3. Tables: Dining Table
  {
    sku: 'TABL-DIN-001',
    name: 'Nordic Solid Oak Dining Table',
    type: 'goods',
    category: 'Tables',
    sales_price: '24500.00',
    cost_price: '15000.00',
    mrp: '28999.00',
    tax_rate: '18.00',
    stock_qty: '18.00',
    model_url: '/models/Desk by dook - EtJlOllzbf.glb',
    image_url: 'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&w=600&q=80',
  },
  // 4. Tables: Coffee Table
  {
    sku: 'TABL-COF-002',
    name: 'Modern Minimalist Coffee Table',
    type: 'goods',
    category: 'Tables',
    sales_price: '7200.00',
    cost_price: '4100.00',
    mrp: '8900.00',
    tax_rate: '18.00',
    stock_qty: '30.00',
    model_url: '/models/Table Round Small by Quaternius - oEArSZykyi.glb',
    image_url: 'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?auto=format&fit=crop&w=600&q=80',
  },
  // 5. Storage: Wardrobe
  {
    sku: 'STOR-WAR-001',
    name: 'Contemporary 3-Door Wardrobe',
    type: 'goods',
    category: 'Storage',
    sales_price: '32000.00',
    cost_price: '21000.00',
    mrp: '38500.00',
    tax_rate: '18.00',
    stock_qty: '10.00',
    model_url: '/models/Drawer by Quaternius - G1H0wnCHQf.glb',
    image_url: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=600&q=80',
  },
  // 6. Storage: Bookshelf
  {
    sku: 'STOR-BOK-002',
    name: 'Industrial 5-Tier Bookshelf',
    type: 'goods',
    category: 'Storage',
    sales_price: '11500.00',
    cost_price: '7000.00',
    mrp: '13999.00',
    tax_rate: '18.00',
    stock_qty: '22.00',
    model_url: '/models/Bookcase with Books by Quaternius - tACDGJ4CGW.glb',
    image_url: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=600&q=80',
  },
  // 7. Beds: Single Bed
  {
    sku: 'BEDS-SNG-001',
    name: 'Urban Teak Single Bed with Storage',
    type: 'goods',
    category: 'Beds',
    sales_price: '16500.00',
    cost_price: '10500.00',
    mrp: '19999.00',
    tax_rate: '18.00',
    stock_qty: '15.00',
    model_url: '/models/Bed Single by Quaternius - ianC28eMOF.glb',
    image_url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=80',
  },
  // 8. Beds: Queen Bed
  {
    sku: 'BEDS-QUN-002',
    name: 'Grand Upholstered Queen Bed Frame',
    type: 'goods',
    category: 'Beds',
    sales_price: '38000.00',
    cost_price: '24000.00',
    mrp: '44500.00',
    tax_rate: '18.00',
    stock_qty: '8.00',
    model_url: '/models/Bed Double by Quaternius - BuRay4fVFr.glb',
    image_url: 'https://images.unsplash.com/photo-1540518614846-7ede433c4ef0?auto=format&fit=crop&w=600&q=80',
  },
];

async function seed() {
  console.log('Seeding 8 catalogue models into products table...');

  try {
    for (const p of sampleProducts) {
      const res = await pool.query(
        `INSERT INTO products 
          (sku, name, type, category, sales_price, cost_price, mrp, tax_rate, stock_qty, model_url, image_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (sku) DO UPDATE SET
           name = EXCLUDED.name,
           type = EXCLUDED.type,
           category = EXCLUDED.category,
           sales_price = EXCLUDED.sales_price,
           cost_price = EXCLUDED.cost_price,
           mrp = EXCLUDED.mrp,
           tax_rate = EXCLUDED.tax_rate,
           stock_qty = EXCLUDED.stock_qty,
           model_url = EXCLUDED.model_url,
           image_url = EXCLUDED.image_url,
           updated_at = now()
         RETURNING id, sku, name, category, sales_price, model_url, image_url`,
        [
          p.sku,
          p.name,
          p.type,
          p.category,
          p.sales_price,
          p.cost_price,
          p.mrp,
          p.tax_rate,
          p.stock_qty,
          p.model_url,
          p.image_url,
        ]
      );

      const row = res.rows[0];
      console.log(`✓ Upserted [${row.category}] ${row.name} (SKU: ${row.sku}, ID: ${row.id})`);
    }

    console.log('\nAll 8 catalogue models seeded successfully!');
    process.exit(0);
  } catch (err: any) {
    console.error('Failed to seed catalogue models:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
