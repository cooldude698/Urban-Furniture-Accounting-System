import { localDB } from '../db/db.js';
import { CreateProductInput, UpdateProductInput, Product } from '../../../shared/schemas/product.schema.js';
import { Decimal } from 'decimal.js';

export class ProductService {
  static getAll(includeArchived = false, category?: string, type?: string): Product[] {
    const products = localDB.getState().products;
    return products.filter(p => {
      if (!includeArchived && p.is_archived) return false;
      if (category && category !== 'all' && p.category !== category) return false;
      if (type && type !== 'all' && p.type !== type) return false;
      return true;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }

  static getById(id: number): Product | null {
    const product = localDB.getState().products.find(p => p.id === id);
    return product || null;
  }

  static create(data: CreateProductInput): Product {
    const salesPrice = new Decimal(data.sales_price || '0').toFixed(2);
    const costPrice = new Decimal(data.cost_price || '0').toFixed(2);
    const mrp = new Decimal(data.mrp || '0').toFixed(2);
    const taxRate = new Decimal(data.tax_rate || '0').toFixed(2);

    let createdProduct: Product;
    localDB.update(state => {
      const nextId = state.products.length > 0 ? Math.max(...state.products.map(p => p.id || 0)) + 1 : 1;
      createdProduct = {
        id: nextId,
        sku: data.sku,
        name: data.name,
        type: data.type,
        category: data.category,
        sales_price: salesPrice,
        cost_price: costPrice,
        mrp: mrp,
        tax_rate: taxRate,
        stock_qty: 0,
        is_archived: Boolean(data.is_archived),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      state.products.push(createdProduct);

      state.audit_log.push({
        id: state.audit_log.length + 1,
        table_name: 'products',
        record_id: nextId,
        action: 'CREATE',
        new_data: JSON.stringify(createdProduct),
        timestamp: new Date().toISOString(),
      });
    });

    return createdProduct!;
  }

  static update(id: number, data: UpdateProductInput): Product | null {
    let updatedProduct: Product | null = null;
    localDB.update(state => {
      const idx = state.products.findIndex(p => p.id === id);
      if (idx === -1) return;

      const existing = state.products[idx];
      const salesPrice = data.sales_price !== undefined ? new Decimal(data.sales_price).toFixed(2) : existing.sales_price;
      const costPrice = data.cost_price !== undefined ? new Decimal(data.cost_price).toFixed(2) : existing.cost_price;
      const mrp = data.mrp !== undefined ? new Decimal(data.mrp).toFixed(2) : existing.mrp;
      const taxRate = data.tax_rate !== undefined ? new Decimal(data.tax_rate).toFixed(2) : existing.tax_rate;

      updatedProduct = {
        ...existing,
        ...data,
        sales_price: salesPrice,
        cost_price: costPrice,
        mrp: mrp,
        tax_rate: taxRate,
        updated_at: new Date().toISOString(),
      };
      state.products[idx] = updatedProduct;

      state.audit_log.push({
        id: state.audit_log.length + 1,
        table_name: 'products',
        record_id: id,
        action: 'UPDATE',
        old_data: JSON.stringify(existing),
        new_data: JSON.stringify(updatedProduct),
        timestamp: new Date().toISOString(),
      });
    });

    return updatedProduct;
  }

  static archive(id: number, isArchived = true): Product | null {
    let updatedProduct: Product | null = null;
    localDB.update(state => {
      const idx = state.products.findIndex(p => p.id === id);
      if (idx === -1) return;

      const existing = state.products[idx];
      updatedProduct = {
        ...existing,
        is_archived: isArchived,
        updated_at: new Date().toISOString(),
      };
      state.products[idx] = updatedProduct;

      state.audit_log.push({
        id: state.audit_log.length + 1,
        table_name: 'products',
        record_id: id,
        action: isArchived ? 'ARCHIVE' : 'UNARCHIVE',
        old_data: JSON.stringify(existing),
        new_data: JSON.stringify(updatedProduct),
        timestamp: new Date().toISOString(),
      });
    });

    return updatedProduct;
  }

  static generateSku(category: string, name: string): string {
    const cleanCat = (category || 'GEN')
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 4)
      .toUpperCase();

    const initials = (name || 'ITEM')
      .split(/\s+/)
      .filter(Boolean)
      .map(w => w[0].toUpperCase())
      .join('')
      .slice(0, 4) || 'ITM';

    const count = localDB.getState().products.length + 1;
    const seq = String(count).padStart(4, '0');

    return `${cleanCat}-${initials}-${seq}`;
  }

  static getStockAlerts(slowMoverDays = 30) {
    const products = localDB.getState().products.filter(p => !p.is_archived && p.type === 'goods');
    const stockMoves = localDB.getState().stock_moves || [];

    const lowStock = products.filter(p => (p.stock_qty || 0) <= (p.min_stock_threshold ?? 5));

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - slowMoverDays);
    const cutoffStr = cutoff.toISOString();

    const slowMovers = products.filter(p => {
      const recentMoves = stockMoves.filter(m => m.product_id === p.id && m.created_at && m.created_at >= cutoffStr);
      return recentMoves.length === 0;
    });

    return {
      lowStock,
      slowMovers,
    };
  }

  static checkPricingWarnings(productId: number, unitPrice: string, isSales = false): string | null {
    const product = this.getById(productId);
    if (!product) return null;

    const price = new Decimal(unitPrice || '0');
    const cost = new Decimal(product.cost_price || '0');
    const mrp = new Decimal(product.mrp || '0');

    // Below-cost check (for sales or purchase below nominal cost)
    if (price.lessThan(cost)) {
      return `Non-blocking warning: Unit price ₹${price.toFixed(2)} is below product cost price ₹${cost.toFixed(2)} for ${product.name}.`;
    }

    // MRP ceiling check
    if (mrp.greaterThan(0) && price.greaterThan(mrp)) {
      return `Non-blocking warning: Unit price ₹${price.toFixed(2)} exceeds MRP ceiling ₹${mrp.toFixed(2)} for ${product.name}.`;
    }

    return null;
  }
}
