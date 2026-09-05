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
}
