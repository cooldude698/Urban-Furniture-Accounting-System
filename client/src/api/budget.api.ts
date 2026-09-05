import Decimal from 'decimal.js';
import api from '../lib/axios';

export interface BudgetLine {
  id?: number;
  budget_id?: number;
  analytic_account_id: number;
  analytic_account_name?: string;
  analytic_type: 'income' | 'expense';
  committed_amount: string;
  achieved_amount: string;
  achieved_pct: number;
  amount_to_achieve: string;
}

export interface Budget {
  id: number;
  name: string;
  period_start: string;
  period_end: string;
  responsible_user_id: number;
  responsible_name: string;
  status: 'draft' | 'confirmed' | 'revised' | 'cancelled';
  revised_of_id: number | null;
  revised_of_name?: string | null;
  revised_by_id: number | null;
  revised_by_name?: string | null;
  created_at: string;
  lines: BudgetLine[];
}

export interface CreateBudgetInput {
  name: string;
  period_start: string;
  period_end: string;
  responsible_user_id?: number;
  responsible_name?: string;
  lines: Array<{
    analytic_account_id: number;
    analytic_account_name?: string;
    analytic_type: 'income' | 'expense';
    committed_amount: string;
  }>;
}

export interface BudgetDocumentItem {
  id: number;
  type: 'invoice' | 'bill';
  number: string;
  date: string;
  partner: string;
  analytic_account_id: number;
  amount: string;
  status: string;
}

// Initial realistic seed budgets for offline demo
const INITIAL_BUDGETS: Budget[] = [
  {
    id: 1,
    name: 'FY2026 Showroom & Operations Budget',
    period_start: '2026-01-01',
    period_end: '2026-12-31',
    responsible_user_id: 1,
    responsible_name: 'Administrator',
    status: 'confirmed',
    revised_of_id: null,
    revised_by_id: 3,
    revised_by_name: 'Revised Budget',
    created_at: '2026-01-01T09:00:00Z',
    lines: [
      {
        id: 101,
        budget_id: 1,
        analytic_account_id: 1,
        analytic_account_name: 'Showroom Operations',
        analytic_type: 'expense',
        committed_amount: '150000.00',
        achieved_amount: '45000.00',
        achieved_pct: 30.0,
        amount_to_achieve: '105000.00',
      },
      {
        id: 102,
        budget_id: 1,
        analytic_account_id: 3,
        analytic_account_name: 'Warehouse & Logistics',
        analytic_type: 'expense',
        committed_amount: '120000.00',
        achieved_amount: '84000.00',
        achieved_pct: 70.0,
        amount_to_achieve: '36000.00',
      },
      {
        id: 103,
        budget_id: 1,
        analytic_account_id: 4,
        analytic_account_name: 'Custom Interior Projects',
        analytic_type: 'income',
        committed_amount: '500000.00',
        achieved_amount: '320000.00',
        achieved_pct: 64.0,
        amount_to_achieve: '180000.00',
      },
    ],
  },
  {
    id: 2,
    name: 'Q1 Marketing Campaign Budget',
    period_start: '2026-01-01',
    period_end: '2026-03-31',
    responsible_user_id: 1,
    responsible_name: 'Administrator',
    status: 'draft',
    revised_of_id: null,
    revised_by_id: null,
    created_at: '2026-01-15T10:30:00Z',
    lines: [
      {
        id: 201,
        budget_id: 2,
        analytic_account_id: 2,
        analytic_account_name: 'Online Sales Marketing',
        analytic_type: 'income',
        committed_amount: '200000.00',
        achieved_amount: '0.00',
        achieved_pct: 0.0,
        amount_to_achieve: '200000.00',
      },
    ],
  },
  {
    id: 3,
    name: 'January 2026',
    period_start: '2026-01-01',
    period_end: '2026-01-31',
    responsible_user_id: 1,
    responsible_name: 'Administrator',
    status: 'draft',
    revised_of_id: 1,
    revised_of_name: 'Original Budget',
    revised_by_id: null,
    created_at: '2026-01-20T10:00:00Z',
    lines: [
      {
        id: 301,
        budget_id: 3,
        analytic_account_id: 1,
        analytic_account_name: 'Furniture',
        analytic_type: 'expense',
        committed_amount: '200000',
        achieved_amount: '10000',
        achieved_pct: 5.0,
        amount_to_achieve: '190000',
      },
    ],
  },
];

const INITIAL_DOCS: BudgetDocumentItem[] = [
  {
    id: 1,
    type: 'bill',
    number: 'Bill/2026/0001',
    date: '2026-01-18',
    partner: 'Modern Home Decor Ltd',
    analytic_account_id: 1,
    amount: '28000.00',
    status: 'confirmed',
  },
  {
    id: 2,
    type: 'bill',
    number: 'Bill/2026/0002',
    date: '2026-02-05',
    partner: 'Timber & Teak Supplies',
    analytic_account_id: 1,
    amount: '17000.00',
    status: 'confirmed',
  },
  {
    id: 3,
    type: 'bill',
    number: 'Bill/2026/0003',
    date: '2026-02-12',
    partner: 'Logistics Fleet Corp',
    analytic_account_id: 3,
    amount: '84000.00',
    status: 'confirmed',
  },
  {
    id: 4,
    type: 'invoice',
    number: 'Inv/2026/0001',
    date: '2026-02-20',
    partner: 'Royal Living Interiors',
    analytic_account_id: 4,
    amount: '320000.00',
    status: 'confirmed',
  },
];

const STORAGE_KEY = 'uf_budgets_store_v2';

function loadLocalBudgets(): Budget[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  saveLocalBudgets(INITIAL_BUDGETS);
  return INITIAL_BUDGETS;
}

function saveLocalBudgets(budgets: Budget[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(budgets));
  } catch {
    // ignore
  }
}

export const BudgetApi = {
  getAll: async (): Promise<Budget[]> => {
    try {
      const res = await api.get<{ data: Budget[]; error: any }>('/api/budgets');
      if (res.data?.data && Array.isArray(res.data.data)) {
        return res.data.data;
      }
    } catch {
      // Offline fallback
    }
    return loadLocalBudgets();
  },

  getById: async (id: number): Promise<Budget | null> => {
    try {
      const res = await api.get<{ data: Budget; error: any }>(`/api/budgets/${id}`);
      if (res.data?.data) {
        return res.data.data;
      }
    } catch {
      // Offline fallback
    }
    const all = loadLocalBudgets();
    const item = all.find((b) => b.id === id) || null;
    if (item) {
      if (item.revised_of_id) {
        const parent = all.find((b) => b.id === item.revised_of_id);
        item.revised_of_name = parent ? parent.name : null;
      }
      if (item.revised_by_id) {
        const child = all.find((b) => b.id === item.revised_by_id);
        item.revised_by_name = child ? child.name : null;
      }
    }
    return item;
  },

  create: async (data: CreateBudgetInput): Promise<Budget> => {
    try {
      const res = await api.post<{ data: Budget; error: any }>('/api/budgets', data);
      if (res.data?.data) return res.data.data;
    } catch {
      // Offline fallback
    }

    const all = loadLocalBudgets();
    const nextId = all.length > 0 ? Math.max(...all.map((b) => b.id)) + 1 : 1;

    const lines: BudgetLine[] = data.lines.map((l, index) => {
      const comm = new Decimal(l.committed_amount || '0.00');
      const ach = new Decimal('0.00');
      const toAchieve = comm.minus(ach);
      return {
        id: nextId * 100 + index + 1,
        budget_id: nextId,
        analytic_account_id: l.analytic_account_id,
        analytic_account_name: l.analytic_account_name || 'Showroom Operations',
        analytic_type: l.analytic_type,
        committed_amount: comm.toFixed(2),
        achieved_amount: '0.00',
        achieved_pct: 0,
        amount_to_achieve: toAchieve.toFixed(2),
      };
    });

    const newBudget: Budget = {
      id: nextId,
      name: data.name,
      period_start: data.period_start,
      period_end: data.period_end,
      responsible_user_id: data.responsible_user_id || 1,
      responsible_name: data.responsible_name || 'Administrator',
      status: 'draft',
      revised_of_id: null,
      revised_by_id: null,
      created_at: new Date().toISOString(),
      lines,
    };

    all.push(newBudget);
    saveLocalBudgets(all);
    return newBudget;
  },

  confirm: async (id: number): Promise<Budget> => {
    try {
      const res = await api.post<{ data: Budget; error: any }>(`/api/budgets/${id}/confirm`);
      if (res.data?.data) return res.data.data;
    } catch {
      // Offline fallback
    }

    const all = loadLocalBudgets();
    const idx = all.findIndex((b) => b.id === id);
    if (idx === -1) throw new Error('Budget not found');

    all[idx].status = 'confirmed';
    saveLocalBudgets(all);
    return all[idx];
  },

  cancel: async (id: number): Promise<Budget> => {
    try {
      const res = await api.post<{ data: Budget; error: any }>(`/api/budgets/${id}/cancel`);
      if (res.data?.data) return res.data.data;
    } catch {
      // Offline fallback
    }

    const all = loadLocalBudgets();
    const idx = all.findIndex((b) => b.id === id);
    if (idx === -1) throw new Error('Budget not found');

    all[idx].status = 'cancelled';
    saveLocalBudgets(all);
    return all[idx];
  },

  /**
   * Revise flow: creates a new budget, original moves to Revised.
   * Links BOTH ways — original page links to the revision, revision links back.
   * New budget name = original name + " Revised".
   */
  revise: async (id: number): Promise<{ original: Budget; revised: Budget }> => {
    try {
      const res = await api.post<{ data: { original: Budget; revised: Budget }; error: any }>(
        `/api/budgets/${id}/revise`
      );
      if (res.data?.data) return res.data.data;
    } catch {
      // Offline fallback
    }

    const all = loadLocalBudgets();
    const idx = all.findIndex((b) => b.id === id);
    if (idx === -1) throw new Error('Budget not found');

    const original = all[idx];
    if (original.status !== 'confirmed') {
      throw new Error('Only confirmed budgets can be revised.');
    }

    const nextId = Math.max(...all.map((b) => b.id)) + 1;
    const newName = `${original.name} Revised`;

    // Mark original as revised
    original.status = 'revised';
    original.revised_by_id = nextId;
    original.revised_by_name = newName;

    // Create revised copy
    const newLines: BudgetLine[] = original.lines.map((l, lIdx) => ({
      ...l,
      id: nextId * 100 + lIdx + 1,
      budget_id: nextId,
    }));

    const revisedBudget: Budget = {
      id: nextId,
      name: newName,
      period_start: original.period_start,
      period_end: original.period_end,
      responsible_user_id: original.responsible_user_id,
      responsible_name: original.responsible_name,
      status: 'confirmed',
      revised_of_id: original.id,
      revised_of_name: original.name,
      revised_by_id: null,
      created_at: new Date().toISOString(),
      lines: newLines,
    };

    all.push(revisedBudget);
    saveLocalBudgets(all);

    return { original, revised: revisedBudget };
  },

  /**
   * Achieved Amount drill-down documents:
   * GET invoices/bills matching the analytic account in the budget period
   */
  getAchievedDocuments: async (analyticAccountId: number): Promise<BudgetDocumentItem[]> => {
    try {
      const res = await api.get<{ data: BudgetDocumentItem[]; error: any }>(
        `/api/reports/budget/${analyticAccountId}/documents`
      );
      if (res.data?.data) return res.data.data;
    } catch {
      // Offline fallback
    }

    return INITIAL_DOCS.filter((d) => d.analytic_account_id === analyticAccountId);
  },
};
