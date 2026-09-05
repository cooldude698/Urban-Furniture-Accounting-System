import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { BudgetApi, Budget } from '../../api/budget.api';
import ListView, { ListColumn } from '../../components/ui/ListView';
import { Plus, Filter } from 'lucide-react';

export default function BudgetListPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: budgets = [], isLoading } = useQuery<Budget[]>({
    queryKey: ['budgets'],
    queryFn: BudgetApi.getAll,
  });

  const tableData = budgets
    .map((b) => ({
      ...b,
      period: `${b.period_start} → ${b.period_end}`,
      responsible: b.responsible_name || 'Administrator',
    }))
    .filter((b) => (statusFilter === 'all' ? true : b.status === statusFilter));

  const columns: ListColumn<any>[] = [
    { label: 'Budget Name', key: 'name', width: '35%' },
    { label: 'Period', key: 'period', width: '25%' },
    { label: 'Responsible', key: 'responsible', width: '25%' },
    { label: 'Status', key: 'status', type: 'badge', width: '15%' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: 1440, margin: '0 auto' }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(208, 174, 146, 0.4)', paddingBottom: 'var(--space-4)' }}>
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 28,
              lineHeight: '34px',
              color: 'var(--brown-900)',
              margin: 0,
            }}
          >
            Analytical Budgets
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              color: 'var(--brown-700)',
              marginTop: 4,
              margin: 0,
            }}
          >
            Manage financial commitments, periods, and track live achieved milestones
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/account/budgets/new')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            fontSize: 13,
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            color: 'var(--cream)',
            background: 'var(--brown-900)',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
            transition: 'opacity 150ms ease-out',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.9';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
        >
          <Plus size={15} />
          <span>New Budget</span>
        </button>
      </div>

      {/* ── List View with Filter Slot ── */}
      <ListView
        columns={columns}
        data={tableData}
        loading={isLoading}
        searchable
        rowKey="id"
        onRowClick={(row) => navigate(`/account/budgets/${row.id}`)}
        emptyText="No analytical budgets found. Create one using the 'New Budget' button above."
        filterSlot={
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={14} style={{ color: 'var(--brown-700)' }} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                padding: '5px 10px',
                border: '1px solid var(--brown-300)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--cream)',
                color: 'var(--brown-900)',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="confirmed">Confirmed</option>
              <option value="revised">Revised</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        }
      />
    </div>
  );
}
