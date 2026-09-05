import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { pool } from '../src/db/pool';

interface ImageMapping {
  match: string[]; // keywords to match in product name
  category: string;
  slug: string;
  url: string;
  modelUrl?: string;
}

const mappings: ImageMapping[] = [
  // ── BEDS ──
  {
    match: ['Cirrus Mattress', 'Nimbus Memory Mattress'],
    category: 'Beds',
    slug: 'cirrus-mattress',
    url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80',
  },
  {
    match: ['Drift Storage Bed'],
    category: 'Beds',
    slug: 'drift-storage-bed',
    url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80',
    modelUrl: '/Models/Bed Single by Quaternius - ianC28eMOF.glb',
  },
  {
    match: ['Grand Upholstered Queen Bed Frame', 'Wexford Upholstered Bed'],
    category: 'Beds',
    slug: 'upholstered-queen-bed',
    url: 'https://images.unsplash.com/photo-1540518614846-7ede433c4ef0?auto=format&fit=crop&w=800&q=80',
    modelUrl: '/Models/Bed Double by Quaternius - BuRay4fVFr.glb',
  },
  {
    match: ['Halcyon Platform Bed', 'Solstice Bed Frame'],
    category: 'Beds',
    slug: 'halcyon-platform-bed',
    url: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80',
    modelUrl: '/Models/Bed Double by Kenney - wcmbCZ63mg.glb',
  },
  {
    match: ['Urban Teak Single Bed with Storage'],
    category: 'Beds',
    slug: 'urban-teak-single-bed',
    url: 'https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&w=800&q=80',
    modelUrl: '/Models/Bed Single by Quaternius - ianC28eMOF.glb',
  },

  // ── SEATING ──
  {
    match: ['Aspen Lounge Sofa', 'Royal Velvet Lounge Sofa'],
    category: 'Seating',
    slug: 'aspen-lounge-sofa',
    url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
    modelUrl: '/Models/Couch Large by Quaternius - 6MoOyPtetL.glb',
  },
  {
    match: ['Atlas Office Chair', 'Ergonomic Executive Office Chair'],
    category: 'Seating',
    slug: 'atlas-office-chair',
    url: 'https://images.unsplash.com/photo-1580481077195-c3a821a78f4b?auto=format&fit=crop&w=800&q=80',
    modelUrl: '/Models/Office Chair by Quaternius - UfKvrZBK6C.glb',
  },
  {
    match: ['Bramble Accent Chair', 'Kestrel Armchair', 'Tamsin Slipper Chair'],
    category: 'Seating',
    slug: 'bramble-accent-chair',
    url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80',
    modelUrl: '/Models/Chair by Quaternius - iMNqRzPwwe.glb',
  },
  {
    match: ['Cove Loveseat'],
    category: 'Seating',
    slug: 'cove-loveseat',
    url: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=800&q=80',
    modelUrl: '/Models/Couch Medium by Quaternius - mWgQ94zhDZ.glb',
  },
  {
    match: ['Ellis Wingback'],
    category: 'Seating',
    slug: 'ellis-wingback',
    url: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=800&q=80',
    modelUrl: '/Models/Chair by Quaternius - iMNqRzPwwe.glb',
  },
  {
    match: ['Grove Ottoman'],
    category: 'Seating',
    slug: 'grove-ottoman',
    url: 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=800&q=80',
  },
  {
    match: ['Meridian Sectional', 'Verona Chesterfield'],
    category: 'Seating',
    slug: 'meridian-sectional',
    url: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&w=800&q=80',
    modelUrl: '/Models/Couch Large by Quaternius - 6MoOyPtetL.glb',
  },
  {
    match: ['Nordic Recliner'],
    category: 'Seating',
    slug: 'nordic-recliner',
    url: 'https://images.unsplash.com/photo-1506898667547-42e22a46e125?auto=format&fit=crop&w=800&q=80',
  },
  {
    match: ['Ridgeway Bench'],
    category: 'Seating',
    slug: 'ridgeway-bench',
    url: 'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=800&q=80',
  },

  // ── TABLES ──
  {
    match: ['Bexley Bar Table'],
    category: 'Tables',
    slug: 'bexley-bar-table',
    url: 'https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?auto=format&fit=crop&w=800&q=80',
  },
  {
    match: ['Fenwick Extending Table', 'Harrow Dining Table', 'Nordic Solid Oak Dining Table', 'Thatcher Farmhouse Table'],
    category: 'Tables',
    slug: 'dining-table-oak',
    url: 'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&w=800&q=80',
    modelUrl: '/Models/Desk by CreativeTrio - YJyJam67hJ.glb',
  },
  {
    match: ['Juniper Coffee Table', 'Modern Minimalist Coffee Table'],
    category: 'Tables',
    slug: 'juniper-coffee-table',
    url: 'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?auto=format&fit=crop&w=800&q=80',
    modelUrl: '/Models/Table Round Small by Quaternius - oEArSZykyi.glb',
  },
  {
    match: ['Linden Nesting Tables', 'Pell Nest Stool'],
    category: 'Tables',
    slug: 'linden-nesting-tables',
    url: 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=800&q=80',
  },
  {
    match: ['Marlow Console'],
    category: 'Tables',
    slug: 'marlow-console',
    url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
  },
  {
    match: ['Oakridge Writing Desk'],
    category: 'Tables',
    slug: 'oakridge-writing-desk',
    url: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800&q=80',
    modelUrl: '/Models/Desk by Quaternius - V86Go2rlnq.glb',
  },
  {
    match: ['Sable Side Table', 'Wren Bedside Table'],
    category: 'Tables',
    slug: 'sable-side-table',
    url: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=800&q=80',
    modelUrl: '/Models/Night Stand by Quaternius - 9LI73c5uFA.glb',
  },

  // ── STORAGE ──
  {
    match: ['Alder TV Unit'],
    category: 'Storage',
    slug: 'alder-tv-unit',
    url: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=800&q=80',
  },
  {
    match: ['Ashford Wardrobe', 'Contemporary 3'],
    category: 'Storage',
    slug: 'ashford-wardrobe',
    url: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80',
    modelUrl: '/Models/Drawer by Quaternius - G1H0wnCHQf.glb',
  },
  {
    match: ['Calder Bookcase', 'Industrial 5', 'Thornbury Display Unit'],
    category: 'Storage',
    slug: 'calder-bookcase',
    url: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=800&q=80',
    modelUrl: '/Models/Bookshelf by CreativeTrio - 30Iealxb0p.glb',
  },
  {
    match: ['Hollis Sideboard', 'Merrick Sideboard Tall'],
    category: 'Storage',
    slug: 'hollis-sideboard',
    url: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=800&q=80',
  },
  {
    match: ['Pike Chest of Drawers'],
    category: 'Storage',
    slug: 'pike-chest-drawers',
    url: 'https://images.unsplash.com/photo-1544457070-4cd773b4d71e?auto=format&fit=crop&w=800&q=80',
    modelUrl: '/Models/Drawer by Quaternius - G1H0wnCHQf.glb',
  },
  {
    match: ['Quill Filing Cabinet', 'Rowan Shoe Cabinet'],
    category: 'Storage',
    slug: 'quill-filing-cabinet',
    url: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=800&q=80',
  },

  // ── LIGHTING ──
  {
    match: ['Beacon Pendant Light'],
    category: 'Lighting',
    slug: 'beacon-pendant-light',
    url: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=800&q=80',
    modelUrl: '/Models/Ceiling Light by Quaternius - sRNcgQFbLB.glb',
  },
  {
    match: ['Corbel Wall Sconce'],
    category: 'Lighting',
    slug: 'corbel-wall-sconce',
    url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80',
  },
  {
    match: ['Ember Table Lamp'],
    category: 'Lighting',
    slug: 'ember-table-lamp',
    url: 'https://images.unsplash.com/photo-1540932239986-30128078f3c5?auto=format&fit=crop&w=800&q=80',
  },
  {
    match: ['Halo Arc Lamp', 'Lumen Floor Lamp'],
    category: 'Lighting',
    slug: 'halo-arc-lamp',
    url: 'https://images.unsplash.com/photo-1517991104123-1d56a6e81ed9?auto=format&fit=crop&w=800&q=80',
    modelUrl: '/Models/Standing lamp by jeremy - 7AqWZQIaCQf.glb',
  },

  // ── DECOR ──
  {
    match: ['Brook Throw Blanket'],
    category: 'Decor',
    slug: 'brook-throw-blanket',
    url: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80',
  },
  {
    match: ['Cairn Planter'],
    category: 'Decor',
    slug: 'cairn-planter',
    url: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=800&q=80',
  },
  {
    match: ['Fen Cushion Set'],
    category: 'Decor',
    slug: 'fen-cushion-set',
    url: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80',
  },
  {
    match: ['Loom Area Rug'],
    category: 'Decor',
    slug: 'loom-area-rug',
    url: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=800&q=80',
  },
  {
    match: ['Tessel Wall Mirror'],
    category: 'Decor',
    slug: 'tessel-wall-mirror',
    url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
  },
  {
    match: ['Vale Table Runner'],
    category: 'Decor',
    slug: 'vale-table-runner',
    url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80',
  },
];

function downloadFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(destPath) && fs.statSync(destPath).size > 1000) {
      // Already downloaded
      return resolve();
    }

    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      // Handle redirect
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
      }

      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download ${url}: status ${res.statusCode}`));
      }

      const fileStream = fs.createWriteStream(destPath);
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
      fileStream.on('error', (err) => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
    });

    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error(`Timeout downloading ${url}`));
    });
  });
}

async function run() {
  console.log('🚀 Starting Furniture Catalog Image & Model Enrichment...');

  const outputDir = path.resolve(__dirname, '../../client/public/images/products');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 1. Download unique images locally
  console.log('📥 Downloading high-resolution furniture imagery locally...');
  for (const m of mappings) {
    const filename = `${m.slug}.jpg`;
    const dest = path.join(outputDir, filename);
    try {
      await downloadFile(m.url, dest);
      console.log(`  ✓ Saved ${filename}`);
    } catch (err: any) {
      console.warn(`  ⚠️ Failed to download ${m.slug}:`, err.message);
    }
  }

  // 2. Fetch all products and assign images & models
  const prodRes = await pool.query('SELECT id, name, category, image_url, model_url FROM products ORDER BY id ASC');
  const products = prodRes.rows;
  console.log(`\n📦 Assigning images to ${products.length} products in Postgres...`);

  let updatedCount = 0;

  for (const p of products) {
    // Find matching mapping
    let matched: ImageMapping | undefined = mappings.find((m) =>
      m.match.some((kw) => p.name.toLowerCase().includes(kw.toLowerCase()))
    );

    // Fallback to category match if no specific keyword matched
    if (!matched) {
      matched = mappings.find((m) => m.category.toLowerCase() === (p.category || '').toLowerCase());
    }

    if (matched) {
      const localImagePath = `/images/products/${matched.slug}.jpg`;
      const fallbackUrl = matched.url;
      // We set local image path, but can also use fallback
      const finalImage = fs.existsSync(path.join(outputDir, `${matched.slug}.jpg`))
        ? localImagePath
        : fallbackUrl;

      const finalModel = p.model_url || matched.modelUrl || null;

      await pool.query(
        `UPDATE products 
         SET image_url = $1, 
             model_url = COALESCE(model_url, $2),
             updated_at = now()
         WHERE id = $3`,
        [finalImage, finalModel, p.id]
      );
      updatedCount++;
    }
  }

  console.log(`\n✅ Successfully enriched ${updatedCount} products with high-resolution imagery and 3D models!`);
  await pool.end();
  process.exit(0);
}

run().catch((err) => {
  console.error('Fatal error during enrichment:', err);
  process.exit(1);
});
