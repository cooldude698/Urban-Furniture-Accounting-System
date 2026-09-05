import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbFilePath = path.join(dataDir, 'db.json');

export interface DBState {
  contacts: any[];
  products: any[];
  accounts: any[];
  journals: any[];
  analytic_accounts: any[];
  purchase_orders: any[];
  purchase_order_lines: any[];
  vendor_bills: any[];
  vendor_bill_lines: any[];
  stock_moves: any[];
  audit_log: any[];
  doc_sequences: any[];
}

const defaultAccounts = [
  { id: 1, code: '1001', name: 'Bank', type: 'bank', is_archived: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 2, code: '1002', name: 'Cash', type: 'cash', is_archived: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 3, code: '1003', name: 'Debtors', type: 'asset', is_archived: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 4, code: '2001', name: 'Creditors', type: 'liability', is_archived: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 5, code: '4001', name: 'Sales Income', type: 'income', is_archived: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 6, code: '5001', name: 'Purchase Expense', type: 'expense', is_archived: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 7, code: '5002', name: 'Other Expense', type: 'other_expense', is_archived: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 8, code: '3001', name: 'Capital', type: 'capital', is_archived: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

const defaultJournals = [
  { id: 1, name: 'Customer Invoices', type: 'sales', default_account_id: 5, is_archived: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 2, name: 'Vendor Bills', type: 'purchase', default_account_id: 6, is_archived: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 3, name: 'Bank Operations', type: 'bank', default_account_id: 1, is_archived: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 4, name: 'Cash Operations', type: 'cash', default_account_id: 2, is_archived: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

const defaultAnalytics = [
  { id: 1, name: 'Showroom Operations', type: 'expense', description: 'Storefront and showroom utilities & rent', is_archived: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 2, name: 'Online Sales Marketing', type: 'income', description: 'E-commerce and social campaigns', is_archived: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 3, name: 'Warehouse & Logistics', type: 'expense', description: 'Storage and freight handling', is_archived: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 4, name: 'Custom Interior Projects', type: 'income', description: 'Bespoke corporate architecture fitouts', is_archived: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

const defaultState: DBState = {
  contacts: [
    {
      id: 1,
      name: 'Modern Home Decor Ltd',
      type: 'vendor',
      email: 'sales@modernhomedecor.in',
      mobile: '+91 98765 43210',
      address: 'Plot 42, Industrial Area Phase 1',
      city: 'Chandigarh',
      state: 'Punjab',
      pincode: '160002',
      image_path: null,
      gstin: '03AABCM1234F1Z8',
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 2,
      name: 'Timber & Teak Supplies',
      type: 'vendor',
      email: 'orders@timberandteak.com',
      mobile: '+91 98111 22334',
      address: '88 Timber Market',
      city: 'Yamunanagar',
      state: 'Haryana',
      pincode: '135001',
      image_path: null,
      gstin: '06AAACT5678K1Z5',
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 3,
      name: 'Royal Living Interiors',
      type: 'customer',
      email: 'contact@royalliving.in',
      mobile: '+91 99887 76655',
      address: 'Shop 12, Galleria Mall',
      city: 'Gurugram',
      state: 'Haryana',
      pincode: '122002',
      image_path: null,
      gstin: '06AABCR9988P1Z1',
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  products: [
    {
      id: 1,
      sku: 'FURN-SOFA-001',
      name: 'Nordic 3-Seater Velvet Sofa',
      type: 'goods',
      category: 'Living Room',
      sales_price: '45000.00',
      cost_price: '28000.00',
      mrp: '52000.00',
      tax_rate: '18.00',
      stock_qty: 15,
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 2,
      sku: 'FURN-TABL-002',
      name: 'Solid Teak Dining Table (6-Seater)',
      type: 'goods',
      category: 'Dining',
      sales_price: '38000.00',
      cost_price: '22000.00',
      mrp: '44000.00',
      tax_rate: '18.00',
      stock_qty: 8,
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 3,
      sku: 'SERV-INST-003',
      name: 'On-Site Furniture Assembly & Polishing',
      type: 'service',
      category: 'Services',
      sales_price: '2500.00',
      cost_price: '1200.00',
      mrp: '3000.00',
      tax_rate: '18.00',
      stock_qty: 0,
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 4,
      sku: 'COMB-LIVR-004',
      name: 'Executive Living Room Package (Sofa + Coffee Table + Rug)',
      type: 'combo',
      category: 'Combos',
      sales_price: '65000.00',
      cost_price: '42000.00',
      mrp: '75000.00',
      tax_rate: '18.00',
      stock_qty: 5,
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  accounts: defaultAccounts,
  journals: defaultJournals,
  analytic_accounts: defaultAnalytics,
  purchase_orders: [],
  purchase_order_lines: [],
  vendor_bills: [],
  vendor_bill_lines: [],
  stock_moves: [],
  audit_log: [],
  doc_sequences: [],
};

class DatabaseEngine {
  private state: DBState;

  constructor() {
    this.state = this.load();
  }

  private load(): DBState {
    if (fs.existsSync(dbFilePath)) {
      try {
        const raw = fs.readFileSync(dbFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          ...defaultState,
          ...parsed,
          accounts: parsed.accounts && parsed.accounts.length > 0 ? parsed.accounts : defaultAccounts,
          journals: parsed.journals && parsed.journals.length > 0 ? parsed.journals : defaultJournals,
          analytic_accounts: parsed.analytic_accounts && parsed.analytic_accounts.length > 0 ? parsed.analytic_accounts : defaultAnalytics,
        };
      } catch {
        return defaultState;
      }
    }
    this.save(defaultState);
    return defaultState;
  }

  private save(state: DBState) {
    fs.writeFileSync(dbFilePath, JSON.stringify(state, null, 2), 'utf-8');
  }

  public getState(): DBState {
    return this.state;
  }

  public update(fn: (state: DBState) => void) {
    fn(this.state);
    this.save(this.state);
  }
}

export const localDB = new DatabaseEngine();
