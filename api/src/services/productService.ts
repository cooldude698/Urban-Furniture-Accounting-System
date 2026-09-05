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
    const sku = input.sku || this.generateSku(input.category || 'GEN', input.name);
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
        new Decimal(input.sales_price || 0).toFixed(2),
        new Decimal(input.cost_price || 0).toFixed(2),
        input.mrp ? new Decimal(input.mrp).toFixed(2) : null,
        new Decimal(input.tax_rate || 0).toFixed(2),
        new Decimal(input.stock_qty || 0).toFixed(2),
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
      values.push(input.category);
      fields.push(`category = $${values.length}`);
    }
    if (input.sales_price !== undefined) {
      values.push(new Decimal(input.sales_price).toFixed(2));
      fields.push(`sales_price = $${values.length}`);
    }
    if (input.cost_price !== undefined) {
      values.push(new Decimal(input.cost_price).toFixed(2));
      fields.push(`cost_price = $${values.length}`);
    }
    if (input.mrp !== undefined) {
      values.push(input.mrp ? new Decimal(input.mrp).toFixed(2) : null);
      fields.push(`mrp = $${values.length}`);
    }
    if (input.tax_rate !== undefined) {
      values.push(new Decimal(input.tax_rate).toFixed(2));
      fields.push(`tax_rate = $${values.length}`);
    }
    if (input.stock_qty !== undefined) {
      values.push(new Decimal(input.stock_qty).toFixed(2));
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

  static async getStockAlerts(): Promise<{ lowStock: ProductDTO[]; slowMovers: ProductDTO[] }> {
    const lowStockRes = await pool.query(
      `SELECT * FROM products 
       WHERE is_archived = false AND type = 'goods' AND stock_qty <= 5
       ORDER BY stock_qty ASC`
    );
    return {
      lowStock: lowStockRes.rows.map(this.mapRow),
      slowMovers: [],
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
