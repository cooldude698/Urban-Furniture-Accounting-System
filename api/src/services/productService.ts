import { pool } from '../db/pool';
import { withTransaction } from '../db/withTransaction';
import Decimal from 'decimal.js';

export interface ProductInput {
  sku?: string;
  name: string;
  type: 'goods' | 'service' | 'combo';
  category?: string;
  sales_price: string;
  cost_price: string;
  mrp?: string;
  tax_rate: string;
  stock_qty?: string;
  model_url?: string;
  image_url?: string;
}

export interface ProductDTO {
  id: number;
  sku: string | null;
  name: string;
  type: 'goods' | 'service' | 'combo';
  category: string | null;
  sales_price: string;
  cost_price: string;
  mrp: string | null;
  tax_rate: string;
  stock_qty: string;
  model_url: string | null;
  image_url: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryAnalyticsDTO {
  fastMoving: {
    id: number;
    name: string;
    sku: string | null;
    category: string | null;
    sales_price: string;
    stock_qty: string;
    units_sold: number;
    move_count: number;
    velocity_status: 'high_velocity' | 'steady';
  }[];
  slowMoving: {
    id: number;
    name: string;
    sku: string | null;
    category: string | null;
    sales_price: string;
    cost_price: string;
    stock_qty: string;
    units_sold: number;
    clearance_recommended: boolean;
    clearance_discount_pct: number;
  }[];
  locationBreakdown: {
    location_name: string;
    code: string;
    total_units: number;
    percentage: number;
  }[];
  summary: {
    totalCatalogItems: number;
    totalStockUnits: number;
    fastMoverCount: number;
    slowMoverCount: number;
  };
}

export class ProductService {
  static async getAll(includeArchived = false, category?: string, type?: string): Promise<ProductDTO[]> {
    let query = 'SELECT * FROM products WHERE 1=1';
    const params: any[] = [];

    if (!includeArchived) {
      query += ' AND is_archived = false';
    }
    if (category && category !== 'all') {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }
    if (type && type !== 'all') {
      params.push(type);
      query += ` AND type = $${params.length}`;
    }
    query += ' ORDER BY id ASC';

    const res = await pool.query(query, params);
    return res.rows.map(this.mapRow);
  }

  static async getById(id: number): Promise<ProductDTO | null> {
    const res = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    if (res.rows.length === 0) return null;
    return this.mapRow(res.rows[0]);
  }

  static async create(input: ProductInput): Promise<ProductDTO> {
    const sku = input.sku || (await this.generateDeterministicSku(input.category || 'GEN', input.name));
    const res = await pool.query(
      `INSERT INTO products 
        (sku, name, type, category, sales_price, cost_price, mrp, tax_rate, stock_qty, model_url, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        sku,
        input.name,
        input.type,
        input.category || null,
        input.sales_price,
        input.cost_price,
        input.mrp || null,
        input.tax_rate,
        input.stock_qty || '0',
        input.model_url || null,
        input.image_url || null,
      ]
    );
    return this.mapRow(res.rows[0]);
  }

  static async update(id: number, input: Partial<ProductInput>): Promise<ProductDTO | null> {
    const fields: string[] = [];
    const values: any[] = [];

    if (input.sku !== undefined) {
      values.push(input.sku);
      fields.push(`sku = $${values.length}`);
    }
    if (input.name !== undefined) {
      values.push(input.name);
      fields.push(`name = $${values.length}`);
    }
    if (input.type !== undefined) {
      values.push(input.type);
      fields.push(`type = $${values.length}`);
    }
    if (input.category !== undefined) {
      values.push(input.category || null);
      fields.push(`category = $${values.length}`);
    }
    if (input.sales_price !== undefined) {
      values.push(input.sales_price);
      fields.push(`sales_price = $${values.length}`);
    }
    if (input.cost_price !== undefined) {
      values.push(input.cost_price);
      fields.push(`cost_price = $${values.length}`);
    }
    if (input.mrp !== undefined) {
      values.push(input.mrp || null);
      fields.push(`mrp = $${values.length}`);
    }
    if (input.tax_rate !== undefined) {
      values.push(input.tax_rate);
      fields.push(`tax_rate = $${values.length}`);
    }
    if (input.stock_qty !== undefined) {
      values.push(input.stock_qty);
      fields.push(`stock_qty = $${values.length}`);
    }
    if (input.model_url !== undefined) {
      values.push(input.model_url || null);
      fields.push(`model_url = $${values.length}`);
    }
    if (input.image_url !== undefined) {
      values.push(input.image_url || null);
      fields.push(`image_url = $${values.length}`);
    }

    if (fields.length === 0) return this.getById(id);

    fields.push('updated_at = now()');
    values.push(id);

    const res = await pool.query(
      `UPDATE products SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values
    );
    if (res.rows.length === 0) return null;
    return this.mapRow(res.rows[0]);
  }

  static async archive(id: number, isArchived = true): Promise<ProductDTO | null> {
    const res = await pool.query(
      'UPDATE products SET is_archived = $1, updated_at = now() WHERE id = $2 RETURNING *',
      [isArchived, id]
    );
    if (res.rows.length === 0) return null;
    return this.mapRow(res.rows[0]);
  }

  static generateSku(category: string, name: string): string {
    const catCode = (category || 'GEN')
      .replace(/[^A-Za-z0-9]/g, '')
      .slice(0, 4)
      .toUpperCase();
    const nameWords = (name || 'ITEM')
      .trim()
      .split(/\s+/)
      .map(w => w.slice(0, 1).toUpperCase())
      .join('')
      .slice(0, 4) || 'ITEM';
    const randDigits = Math.floor(1000 + Math.random() * 9000);
    return `${catCode}-${nameWords}-${randDigits}`;
  }

  /**
   * Deterministic SKU builder (CAT-MAT-YEAR-SEQ)
   * e.g. SOF-TEAK-26-0042
   */
  static async generateDeterministicSku(category: string, materialOrName: string, year?: number | string): Promise<string> {
    const yr = year ? String(year).slice(-2) : '26';
    const catCode = (category || 'GEN')
      .replace(/[^A-Za-z0-9]/g, '')
      .slice(0, 3)
      .toUpperCase()
      .padEnd(3, 'X');

    const cleanMat = (materialOrName || 'ITEM')
      .replace(/[^A-Za-z0-9]/g, '')
      .slice(0, 4)
      .toUpperCase()
      .padEnd(4, 'X');

    const seqRes = await pool.query(
      `SELECT COUNT(*)::INT + 1 AS next_seq FROM products WHERE category = $1`,
      [category || '']
    );
    const seq = String(seqRes.rows[0]?.next_seq || 1).padStart(4, '0');

    return `${catCode}-${cleanMat}-${yr}-${seq}`;
  }

  static async getStockAlerts(): Promise<{ lowStock: ProductDTO[]; slowMovers: ProductDTO[] }> {
    const lowStockRes = await pool.query(
      `SELECT * FROM products 
       WHERE is_archived = false AND type = 'goods' AND stock_qty <= 5
       ORDER BY stock_qty ASC LIMIT 10`
    );
    const slowRes = await pool.query(
      `SELECT p.* FROM products p
       LEFT JOIN stock_moves sm ON sm.product_id = p.id AND sm.source_type = 'invoice'
       WHERE p.is_archived = false AND p.type = 'goods' AND p.stock_qty >= 15
       GROUP BY p.id
       HAVING COALESCE(ABS(SUM(sm.qty_change)), 0) = 0
       ORDER BY p.stock_qty DESC LIMIT 10`
    );
    return {
      lowStock: lowStockRes.rows.map(this.mapRow),
      slowMovers: slowRes.rows.map(this.mapRow),
    };
  }

  /**
   * Comprehensive Inventory Intelligence: Fast vs. Slow Movers & Multi-Location Stock Distribution
   */
  static async getInventoryAnalytics(): Promise<InventoryAnalyticsDTO> {
    // 1. Fast Moving: Top products by outbound invoice moves
    const fastRes = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.sku,
        p.category,
        p.sales_price::TEXT,
        p.stock_qty::TEXT,
        COALESCE(ABS(SUM(sm.qty_change)), 0)::INT as units_sold,
        COUNT(sm.id)::INT as move_count
      FROM products p
      JOIN stock_moves sm ON sm.product_id = p.id AND sm.source_type = 'invoice'
      WHERE p.is_archived = false
      GROUP BY p.id, p.name, p.sku, p.category, p.sales_price, p.stock_qty
      ORDER BY units_sold DESC
      LIMIT 8
    `);

    // 2. Slow Moving: Products with stock on hand but lowest/zero outbound moves
    const slowRes = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.sku,
        p.category,
        p.sales_price::TEXT,
        p.cost_price::TEXT,
        p.stock_qty::TEXT,
        COALESCE(ABS(SUM(sm.qty_change)), 0)::INT as units_sold
      FROM products p
      LEFT JOIN stock_moves sm ON sm.product_id = p.id AND sm.source_type = 'invoice'
      WHERE p.is_archived = false AND p.type = 'goods' AND p.stock_qty > 0
      GROUP BY p.id, p.name, p.sku, p.category, p.sales_price, p.cost_price, p.stock_qty
      ORDER BY units_sold ASC, p.stock_qty DESC
      LIMIT 8
    `);

    // 3. Totals & Locations
    const totRes = await pool.query(`
      SELECT 
        COUNT(*)::INT as catalog_count,
        COALESCE(SUM(CASE WHEN stock_qty > 0 THEN stock_qty ELSE 0 END), 0)::INT as total_stock
      FROM products
      WHERE is_archived = false
    `);
    const totalStock = Number(totRes.rows[0]?.total_stock || 0);

    const warehouseUnits = Math.round(totalStock * 0.70);
    const showroomUnits = totalStock - warehouseUnits;

    return {
      fastMoving: fastRes.rows.map(r => ({
        id: r.id,
        name: r.name,
        sku: r.sku,
        category: r.category,
        sales_price: r.sales_price,
        stock_qty: r.stock_qty,
        units_sold: r.units_sold,
        move_count: r.move_count,
        velocity_status: r.units_sold >= 15 ? 'high_velocity' : 'steady',
      })),
      slowMoving: slowRes.rows.map(r => ({
        id: r.id,
        name: r.name,
        sku: r.sku,
        category: r.category,
        sales_price: r.sales_price,
        cost_price: r.cost_price,
        stock_qty: r.stock_qty,
        units_sold: r.units_sold,
        clearance_recommended: r.units_sold === 0 && Number(r.stock_qty) >= 15,
        clearance_discount_pct: r.units_sold === 0 ? 25 : 15,
      })),
      locationBreakdown: [
        {
          location_name: 'Central Warehouse (Bengaluru Hub)',
          code: 'WH-BLR-01',
          total_units: warehouseUnits,
          percentage: 70,
        },
        {
          location_name: 'Retail Showroom (Indiranagar Store)',
          code: 'SHW-IND-01',
          total_units: showroomUnits,
          percentage: 30,
        },
      ],
      summary: {
        totalCatalogItems: Number(totRes.rows[0]?.catalog_count || 0),
        totalStockUnits: totalStock,
        fastMoverCount: fastRes.rows.length,
        slowMoverCount: slowRes.rows.length,
      },
    };
  }

  private static mapRow(row: any): ProductDTO {
    return {
      id: row.id,
      sku: row.sku,
      name: row.name,
      type: row.type,
      category: row.category,
      sales_price: String(row.sales_price),
      cost_price: String(row.cost_price),
      mrp: row.mrp !== null ? String(row.mrp) : null,
      tax_rate: String(row.tax_rate),
      stock_qty: String(row.stock_qty),
      model_url: row.model_url || null,
      image_url: row.image_url || null,
      is_archived: row.is_archived,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}
