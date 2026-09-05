import { pool } from '../src/db/pool';

interface SignatureProduct {
  id: number;
  name: string;
  category: string;
  image_url: string;
  model_url?: string;
  sales_price: string;
  mrp: string;
}

const SIGNATURE_PRODUCTS: SignatureProduct[] = [
  // Beds
  {
    id: 244,
    name: 'Solstice Japanese Platform Bed Frame',
    category: 'Beds',
    image_url: '/images/products/halcyon-platform-bed.jpg',
    model_url: '/Models/Bed Double by Kenney - wcmbCZ63mg.glb',
    sales_price: '48500.00',
    mrp: '54000.00'
  },
  {
    id: 256,
    name: 'Wexford Tailored Upholstered Bed',
    category: 'Beds',
    image_url: '/images/products/upholstered-queen-bed.jpg',
    model_url: '/Models/Bed Double by Quaternius - BuRay4fVFr.glb',
    sales_price: '42000.00',
    mrp: '49500.00'
  },
  {
    id: 262,
    name: 'Drift Minimalist Storage Platform Bed',
    category: 'Beds',
    image_url: '/images/products/drift-storage-bed.jpg',
    model_url: '/Models/Bed Single by Quaternius - ianC28eMOF.glb',
    sales_price: '34500.00',
    mrp: '39000.00'
  },
  {
    id: 321,
    name: 'Urban Solid Teak Bed with Drawer Storage',
    category: 'Beds',
    image_url: '/images/products/urban-teak-single-bed.jpg',
    model_url: '/Models/Bed Single by Quaternius - ianC28eMOF.glb',
    sales_price: '28000.00',
    mrp: '32500.00'
  },
  {
    id: 268,
    name: 'Cirrus Natural Latex Ergonomic Cloud Mattress',
    category: 'Beds',
    image_url: '/images/products/cirrus-mattress.jpg',
    sales_price: '38900.00',
    mrp: '44500.00'
  },

  // Seating
  {
    id: 10,
    name: 'Meridian Modular 4-Piece Sectional Sofa',
    category: 'Seating',
    image_url: '/images/products/meridian-sectional.jpg',
    model_url: '/Models/Couch Large by Quaternius - 6MoOyPtetL.glb',
    sales_price: '78000.00',
    mrp: '89000.00'
  },
  {
    id: 1,
    name: 'Aspen Belgian Linen Lounge Sofa',
    category: 'Seating',
    image_url: '/images/products/aspen-lounge-sofa.jpg',
    model_url: '/Models/Couch Small by Quaternius - X9msj0gtb5.glb',
    sales_price: '54000.00',
    mrp: '62000.00'
  },
  {
    id: 58,
    name: 'Cove Curvilinear 2-Seater Loveseat',
    category: 'Seating',
    image_url: '/images/products/cove-loveseat.jpg',
    model_url: '/Models/Couch Medium by Quaternius - mWgQ94zhDZ.glb',
    sales_price: '36000.00',
    mrp: '41500.00'
  },
  {
    id: 19,
    name: 'Bramble Textured Bouclé Accent Armchair',
    category: 'Seating',
    image_url: '/images/products/bramble-accent-chair.jpg',
    model_url: '/Models/Chair by Quaternius - iMNqRzPwwe.glb',
    sales_price: '24500.00',
    mrp: '29000.00'
  },
  {
    id: 67,
    name: 'Ellis Sculptural Wingback Lounge Chair',
    category: 'Seating',
    image_url: '/images/products/ellis-wingback.jpg',
    model_url: '/Models/Chair by Poly by Google - 13AL0KYItKD.glb',
    sales_price: '27500.00',
    mrp: '33000.00'
  },
  {
    id: 31,
    name: 'Nordic Ergonomic Leather Recliner',
    category: 'Seating',
    image_url: '/images/products/nordic-recliner.jpg',
    model_url: '/Models/Couch Small by Quaternius - ZOPP3KzNIk.glb',
    sales_price: '31000.00',
    mrp: '36000.00'
  },
  {
    id: 46,
    name: 'Atlas High-Back Lumbar Executive Chair',
    category: 'Seating',
    image_url: '/images/products/atlas-office-chair.jpg',
    model_url: '/Models/Office Chair by Quaternius - UfKvrZBK6C.glb',
    sales_price: '22500.00',
    mrp: '26000.00'
  },
  {
    id: 52,
    name: 'Ridgeway Solid Oak Hallway & Dining Bench',
    category: 'Seating',
    image_url: '/images/products/ridgeway-bench.jpg',
    sales_price: '16500.00',
    mrp: '19000.00'
  },
  {
    id: 79,
    name: 'Grove Fluted Velvet Cylinder Ottoman',
    category: 'Seating',
    image_url: '/images/products/grove-ottoman.jpg',
    model_url: '/Models/Office Chair by CMHT Oculus - dCEsSsJJ1Md.glb',
    sales_price: '8500.00',
    mrp: '10500.00'
  },

  // Tables
  {
    id: 85,
    name: 'Harrow 8-Seater Solid French Oak Dining Table',
    category: 'Tables',
    image_url: '/images/products/dining-table-oak.jpg',
    model_url: '/Models/Desk by CreativeTrio - YJyJam67hJ.glb',
    sales_price: '62000.00',
    mrp: '71000.00'
  },
  {
    id: 103,
    name: 'Juniper Organic Solid Teak Coffee Table',
    category: 'Tables',
    image_url: '/images/products/juniper-coffee-table.jpg',
    model_url: '/Models/Table Round Small by Quaternius - oEArSZykyi.glb',
    sales_price: '18500.00',
    mrp: '22000.00'
  },
  {
    id: 115,
    name: 'Oakridge Architectural Dual-Drawer Writing Desk',
    category: 'Tables',
    image_url: '/images/products/oakridge-writing-desk.jpg',
    model_url: '/Models/Desk by Quaternius - V86Go2rlnq.glb',
    sales_price: '32000.00',
    mrp: '37500.00'
  },
  {
    id: 121,
    name: 'Sable Minimalist Walnut Nightstand',
    category: 'Tables',
    image_url: '/images/products/sable-side-table.jpg',
    model_url: '/Models/Night Stand by Quaternius - 9LI73c5uFA.glb',
    sales_price: '9800.00',
    mrp: '12000.00'
  },
  {
    id: 136,
    name: 'Linden Dual Round Nesting Coffee Tables',
    category: 'Tables',
    image_url: '/images/products/linden-nesting-tables.jpg',
    sales_price: '15500.00',
    mrp: '18000.00'
  },
  {
    id: 142,
    name: 'Bexley Teak High-Top Bar Table',
    category: 'Tables',
    image_url: '/images/products/bexley-bar-table.jpg',
    model_url: '/Models/Desk by dook - EtJlOllzbf.glb',
    sales_price: '26000.00',
    mrp: '30500.00'
  },
  {
    id: 109,
    name: 'Marlow Slim Entryway Fluted Console Table',
    category: 'Tables',
    image_url: '/images/products/marlow-console.jpg',
    sales_price: '21000.00',
    mrp: '24500.00'
  },

  // Storage
  {
    id: 181,
    name: 'Hollis 4-Door Fluted Credenza Sideboard',
    category: 'Storage',
    image_url: '/images/products/hollis-sideboard.jpg',
    model_url: '/Models/Shelf Small by Quaternius - TfdgUV2RYe.glb',
    sales_price: '46000.00',
    mrp: '53000.00'
  },
  {
    id: 172,
    name: 'Calder Floor-to-Ceiling Solid Wood Bookcase',
    category: 'Storage',
    image_url: '/images/products/calder-bookcase.jpg',
    model_url: '/Models/Bookshelf by CreativeTrio - 30Iealxb0p.glb',
    sales_price: '38000.00',
    mrp: '44000.00'
  },
  {
    id: 226,
    name: 'Alder Low-Profile Slatted TV Media Unit',
    category: 'Storage',
    image_url: '/images/products/alder-tv-unit.jpg',
    model_url: '/Models/Shelf by Nick Slough - Wtd7rX7DGl.glb',
    sales_price: '29500.00',
    mrp: '34500.00'
  },
  {
    id: 163,
    name: 'Ashford 3-Door Solid Walnut Wardrobe',
    category: 'Storage',
    image_url: '/images/products/ashford-wardrobe.jpg',
    model_url: '/Models/Drawer by Quaternius - G1H0wnCHQf.glb',
    sales_price: '58000.00',
    mrp: '67000.00'
  },
  {
    id: 190,
    name: 'Pike 5-Tier Graduated Chest of Drawers',
    category: 'Storage',
    image_url: '/images/products/pike-chest-drawers.jpg',
    model_url: '/Models/Drawer by Quaternius - G1H0wnCHQf.glb',
    sales_price: '33000.00',
    mrp: '38000.00'
  },
  {
    id: 199,
    name: 'Rowan Fluted Ventilated Shoe & Utility Cabinet',
    category: 'Storage',
    image_url: '/images/products/quill-filing-cabinet.jpg',
    model_url: '/Models/Bookcase with Books by Quaternius - tACDGJ4CGW.glb',
    sales_price: '22000.00',
    mrp: '26000.00'
  },

  // Lighting
  {
    id: 280,
    name: 'Lumen Counterbalanced Brass Arc Floor Lamp',
    category: 'Lighting',
    image_url: '/images/products/halo-arc-lamp.jpg',
    model_url: '/Models/Standing lamp by jeremy - 7AqWZQIaCQf.glb',
    sales_price: '16800.00',
    mrp: '19500.00'
  },
  {
    id: 283,
    name: 'Beacon Spun Brass Minimalist Pendant Light',
    category: 'Lighting',
    image_url: '/images/products/beacon-pendant-light.jpg',
    model_url: '/Models/Ceiling Light by Quaternius - sRNcgQFbLB.glb',
    sales_price: '8900.00',
    mrp: '11000.00'
  },
  {
    id: 286,
    name: 'Ember Ceramic & Opal Glass Accent Table Lamp',
    category: 'Lighting',
    image_url: '/images/products/ember-table-lamp.jpg',
    sales_price: '6400.00',
    mrp: '7800.00'
  },
  {
    id: 292,
    name: 'Corbel Architectural Brushed Brass Wall Sconce',
    category: 'Lighting',
    image_url: '/images/products/corbel-wall-sconce.jpg',
    sales_price: '5200.00',
    mrp: '6500.00'
  },

  // Decor
  {
    id: 295,
    name: 'Loom Hand-Tufted New Zealand Wool Area Rug (8x10)',
    category: 'Decor',
    image_url: '/images/products/loom-area-rug.jpg',
    sales_price: '24000.00',
    mrp: '28500.00'
  },
  {
    id: 298,
    name: 'Tessel Brass Geometric Full-Length Wall Mirror',
    category: 'Decor',
    image_url: '/images/products/tessel-wall-mirror.jpg',
    sales_price: '14500.00',
    mrp: '17500.00'
  },
  {
    id: 307,
    name: 'Cairn Architectural Handcrafted Terracotta Planter',
    category: 'Decor',
    image_url: '/images/products/cairn-planter.jpg',
    sales_price: '4200.00',
    mrp: '5200.00'
  },
  {
    id: 304,
    name: 'Brook Handwoven Organic Wool Throw Blanket',
    category: 'Decor',
    image_url: '/images/products/brook-throw-blanket.jpg',
    sales_price: '5800.00',
    mrp: '7200.00'
  },
  {
    id: 301,
    name: 'Fen Stonewashed Belgian Linen Cushion Duo',
    category: 'Decor',
    image_url: '/images/products/fen-cushion-set.jpg',
    sales_price: '3400.00',
    mrp: '4200.00'
  },
  {
    id: 310,
    name: 'Vale Hand-Loomed Natural Linen Table Runner',
    category: 'Decor',
    image_url: '/images/products/vale-table-runner.jpg',
    sales_price: '2600.00',
    mrp: '3200.00'
  },
];

async function curateCatalogue() {
  console.log(`Starting catalogue curation...`);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const signatureIds = SIGNATURE_PRODUCTS.map(p => p.id);

    // 1. Archive all products EXCEPT the curated signature products
    const archiveRes = await client.query(`
      UPDATE products 
      SET is_archived = true
      WHERE id NOT IN (${signatureIds.join(',')})
    `);
    console.log(`Archived ${archiveRes.rowCount} repetitive / duplicate products.`);

    // 2. Unarchive and enrich every signature product with its unique photo, name, category, and 3D model
    for (const prod of SIGNATURE_PRODUCTS) {
      await client.query(`
        UPDATE products
        SET 
          name = $1,
          category = $2,
          image_url = $3,
          model_url = $4,
          sales_price = $5,
          mrp = $6,
          is_archived = false
        WHERE id = $7
      `, [
        prod.name,
        prod.category,
        prod.image_url,
        prod.model_url || null,
        prod.sales_price,
        prod.mrp,
        prod.id
      ]);
    }
    console.log(`Enriched and unarchived all ${SIGNATURE_PRODUCTS.length} curated signature products.`);

    // 3. Delete completely unreferenced products that are archived (if 0 FK references)
    const delRes = await client.query(`
      DELETE FROM products
      WHERE is_archived = true
        AND id NOT IN (
          SELECT product_id FROM customer_invoice_lines
          UNION SELECT product_id FROM sales_order_lines
          UNION SELECT product_id FROM vendor_bill_lines
          UNION SELECT product_id FROM purchase_order_lines
          UNION SELECT product_id FROM stock_moves
        )
    `);
    console.log(`Hard-deleted ${delRes.rowCount} unreferenced duplicate records.`);

    await client.query('COMMIT');

    // Verification check
    const activeRes = await client.query(`
      SELECT count(*) as active_count, count(distinct image_url) as distinct_images
      FROM products
      WHERE is_archived = false AND type = 'goods'
    `);
    console.log(`\nVerified active catalogue:`, activeRes.rows[0]);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error during curation:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

curateCatalogue();
