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

export const BudgetApi = {
  getAll: async (): Promise<Budget[]> => {
    const res = await api.get<{ data: Budget[]; error: any }>('/api/budgets');
    if (res.data?.error) throw new Error(res.data.error.message || 'Failed to fetch budgets');
    return res.data?.data || [];
  },

  getById: async (id: number): Promise<Budget | null> => {
    const res = await api.get<{ data: Budget; error: any }>(`/api/budgets/${id}`);
    if (res.data?.error) throw new Error(res.data.error.message || 'Failed to fetch budget');
    return res.data?.data || null;
  },

  create: async (data: CreateBudgetInput): Promise<Budget> => {
    const res = await api.post<{ data: Budget; error: any }>('/api/budgets', data);
    if (res.data?.error) throw new Error(res.data.error.message || 'Failed to create budget');
    return res.data.data;
  },

  update: async (id: number, data: Partial<CreateBudgetInput>): Promise<Budget> => {
    const res = await api.put<{ data: Budget; error: any }>(`/api/budgets/${id}`, data);
    if (res.data?.error) throw new Error(res.data.error.message || 'Failed to update budget');
    return res.data.data;
  },

  confirm: async (id: number): Promise<Budget> => {
    const res = await api.post<{ data: Budget; error: any }>(`/api/budgets/${id}/confirm`);
    if (res.data?.error) throw new Error(res.data.error.message || 'Failed to confirm budget');
    return res.data.data;
  },

  cancel: async (id: number): Promise<Budget> => {
    const res = await api.post<{ data: Budget; error: any }>(`/api/budgets/${id}/cancel`);
    if (res.data?.error) throw new Error(res.data.error.message || 'Failed to cancel budget');
    return res.data.data;
  },

  /**
   * Revise flow: creates a new budget, original moves to Revised in PostgreSQL.
   */
  revise: async (id: number): Promise<{ original: Budget; revised: Budget }> => {
    const res = await api.post<{ data: { original: Budget; revised: Budget }; error: any }>(
      `/api/budgets/${id}/revise`
    );
    if (res.data?.error) throw new Error(res.data.error.message || 'Failed to revise budget');
    return res.data.data;
  },

  /**
   * Achieved Amount drill-down documents:
   * GET invoices/bills matching the analytic account in the budget period
   */
  getAchievedDocuments: async (analyticAccountId: number, lineId?: number): Promise<BudgetDocumentItem[]> => {
    try {
      const targetId = lineId || analyticAccountId;
      const res = await api.get<{ data: any; error: any }>(
        `/api/reports/budget/${targetId}/documents`
      );
      if (res.data?.data) {
        const rawDocs = Array.isArray(res.data.data)
          ? res.data.data
          : res.data.data.documents || [];
        return rawDocs.map((d: any) => ({
          id: d.document_id || d.id,
          type: (d.document_type === 'customer_invoice' ? 'invoice' : 'bill') as 'invoice' | 'bill',
          number: d.number,
          date: d.date instanceof Date ? d.date.toISOString().split('T')[0] : String(d.date),
          partner: d.partner_name || d.partner || '—',
          analytic_account_id: analyticAccountId,
          amount: d.line_amount || d.amount || '0.00',
          status: 'confirmed',
        }));
      }
    } catch {
      // return empty if none
    }
    return [];
  },
};
