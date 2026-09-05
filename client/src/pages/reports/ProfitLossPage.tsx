import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Decimal from 'decimal.js';
import { ReportsApi, ProfitLossReport } from '../../api/reports.api';
import Money from '../../components/ui/Money';
import LedgerDrilldownModal from './LedgerDrilldownModal';
import {
  Printer,
  CalendarRange,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';

export default function ProfitLossPage() {
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [fromDate, setFromDate] = useState<string>('2026-01-01');
  const [toDate, setToDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedDrillAccount, setSelectedDrillAccount] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const handleYearChange = (yr: string) => {
    setSelectedYear(yr);
    if (yr !== 'custom') {
      setFromDate(`${yr}-01-01`);
      setToDate(`${yr}-12-31`);
    }
  };

  const {
    data: report,
    isLoading,
    refetch,
  } = useQuery<ProfitLossReport>({
    queryKey: ['profit-loss', fromDate, toDate],
    queryFn: () => ReportsApi.getProfitAndLoss(fromDate, toDate),
  });

  const handlePrint = () => {
    ReportsApi.downloadPdf('profit-loss', { from: fromDate, to: toDate });
  };

  const isNetProfitPositive = report
    ? new Decimal(report.netProfit || '0').greaterThanOrEqualTo(0)
    : true;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: 1000, margin: '0 auto' }}>
      {/* ── Header ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(208, 174, 146, 0.4)',
          paddingBottom: 'var(--space-4)',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
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
            Profit & Loss Statement
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
            Income, expenses, and net profitability over a selected date range
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              fontSize: 13,
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              color: 'var(--brown-700)',
              background: 'transparent',
              border: '1px solid var(--brown-300)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={15} />
            <span>Back</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              fontSize: 13,
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              color: 'var(--brown-900)',
              background: 'var(--surface)',
              border: '1px solid var(--brown-300)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <Printer size={15} />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* ── Controls: Year & Date Range Picker ── */}
      <div
        style={{
          background: 'var(--cream)',
          border: '1px solid rgba(208, 174, 146, 0.4)',
          borderRadius: 'var(--radius-md)',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CalendarRange size={18} style={{ color: 'var(--brown-700)' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--brown-900)', fontFamily: 'var(--font-body)' }}>
              Year:
            </span>
            <select
              value={selectedYear}
              onChange={(e) => handleYearChange(e.target.value)}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                fontWeight: 600,
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--brown-300)',
                background: 'var(--surface)',
                color: 'var(--brown-900)',
                cursor: 'pointer',
              }}
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label htmlFor="plFromDate" style={{ fontSize: 12, color: 'var(--brown-700)', fontFamily: 'var(--font-body)' }}>
              From:
            </label>
            <input
              id="plFromDate"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--brown-300)',
                background: 'var(--surface)',
                color: 'var(--brown-900)',
                cursor: 'pointer',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label htmlFor="plToDate" style={{ fontSize: 12, color: 'var(--brown-700)', fontFamily: 'var(--font-body)' }}>
              To:
            </label>
            <input
              id="plToDate"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--brown-300)',
                background: 'var(--surface)',
                color: 'var(--brown-900)',
                cursor: 'pointer',
              }}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'transparent',
            border: 'none',
            fontSize: 12,
            color: 'var(--brown-700)',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          <RefreshCw size={12} />
          <span>Update Report</span>
        </button>
      </div>

      {/* ── Net Profit Summary Banner ── */}
      {report && (
        <div
          style={{
            background: isNetProfitPositive ? 'var(--posted-bg)' : 'var(--danger-bg)',
            border: `1px solid ${isNetProfitPositive ? 'var(--posted)' : 'var(--danger)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isNetProfitPositive ? (
              <TrendingUp size={24} style={{ color: 'var(--posted)' }} />
            ) : (
              <TrendingDown size={24} style={{ color: 'var(--danger)' }} />
            )}
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--brown-700)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Net Profit (Income − Expenses)
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: 26,
                  color: isNetProfitPositive ? 'var(--posted)' : 'var(--danger)',
                  marginTop: 2,
                }}
              >
                <Money value={report.netProfit} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 24, fontSize: 13, fontFamily: 'var(--font-body)' }}>
            <div>
              <span style={{ color: 'var(--brown-700)', display: 'block', fontSize: 11, textTransform: 'uppercase' }}>Total Income</span>
              <strong style={{ color: 'var(--brown-900)' }}><Money value={report.totalIncome} /></strong>
            </div>
            <div>
              <span style={{ color: 'var(--brown-700)', display: 'block', fontSize: 11, textTransform: 'uppercase' }}>Total Expenses</span>
              <strong style={{ color: 'var(--brown-900)' }}><Money value={report.totalExpenses} /></strong>
            </div>
          </div>
        </div>
      )}

      {/* ── Income & Expense Tables ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        {/* SECTION 1: Operating Income */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid rgba(208, 174, 146, 0.4)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-sm)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '14px 20px',
              background: 'var(--brown-100)',
              borderBottom: '1px solid var(--brown-300)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 16,
                color: 'var(--brown-900)',
                margin: 0,
              }}
            >
              Operating Income
            </h2>
            <span style={{ fontSize: 12, color: 'var(--brown-700)', fontFamily: 'var(--font-body)' }}>
              Click amounts to inspect ledger
            </span>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ height: 32, borderBottom: '1px solid rgba(208, 174, 146, 0.2)', background: 'rgba(249, 242, 228, 0.5)' }}>
                <th style={{ padding: '0 20px', fontSize: 11, fontWeight: 600, color: 'var(--brown-700)', textTransform: 'uppercase' }}>
                  Account
                </th>
                <th style={{ padding: '0 20px', fontSize: 11, fontWeight: 600, color: 'var(--brown-700)', textTransform: 'uppercase', textAlign: 'right' }}>
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {report?.income && report.income.length > 0 ? (
                report.income.map((item) => (
                  <tr
                    key={item.accountId}
                    style={{
                      height: 44,
                      borderBottom: '1px solid rgba(208, 174, 146, 0.2)',
                    }}
                  >
                    <td style={{ padding: '0 20px', fontSize: 13, fontWeight: 500, color: 'var(--brown-900)' }}>
                      {item.accountName}
                    </td>
                    <td style={{ padding: '0 20px', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedDrillAccount({ id: item.accountId, name: item.accountName })}
                        title="Click to drill down into ledger entries"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          color: 'var(--brown-900)',
                          fontWeight: 600,
                        }}
                      >
                        <Money value={item.total} />
                        <ExternalLink size={11} style={{ color: 'var(--brown-700)' }} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} style={{ padding: 20, textAlign: 'center', color: 'var(--brown-700)', fontSize: 13 }}>
                    No operating income recorded in this period.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr style={{ background: 'var(--brown-100)', height: 44, fontWeight: 700, borderTop: '2px solid var(--brown-300)' }}>
                <td style={{ padding: '0 20px', fontSize: 13, textTransform: 'uppercase', color: 'var(--brown-900)' }}>
                  Total Income
                </td>
                <td style={{ padding: '0 20px', textAlign: 'right', fontSize: 15 }}>
                  <Money value={report?.totalIncome || '0.00'} />
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* SECTION 2: Operating Expenses */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid rgba(208, 174, 146, 0.4)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-sm)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '14px 20px',
              background: 'var(--brown-100)',
              borderBottom: '1px solid var(--brown-300)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 16,
                color: 'var(--brown-900)',
                margin: 0,
              }}
            >
              Operating Expenses
            </h2>
            <span style={{ fontSize: 12, color: 'var(--brown-700)', fontFamily: 'var(--font-body)' }}>
              Click amounts to inspect ledger
            </span>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ height: 32, borderBottom: '1px solid rgba(208, 174, 146, 0.2)', background: 'rgba(249, 242, 228, 0.5)' }}>
                <th style={{ padding: '0 20px', fontSize: 11, fontWeight: 600, color: 'var(--brown-700)', textTransform: 'uppercase' }}>
                  Account
                </th>
                <th style={{ padding: '0 20px', fontSize: 11, fontWeight: 600, color: 'var(--brown-700)', textTransform: 'uppercase', textAlign: 'right' }}>
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {report?.expenses && report.expenses.length > 0 ? (
                report.expenses.map((item) => (
                  <tr
                    key={item.accountId}
                    style={{
                      height: 44,
                      borderBottom: '1px solid rgba(208, 174, 146, 0.2)',
                    }}
                  >
                    <td style={{ padding: '0 20px', fontSize: 13, fontWeight: 500, color: 'var(--brown-900)' }}>
                      {item.accountName}
                    </td>
                    <td style={{ padding: '0 20px', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedDrillAccount({ id: item.accountId, name: item.accountName })}
                        title="Click to drill down into ledger entries"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          color: 'var(--brown-900)',
                          fontWeight: 600,
                        }}
                      >
                        <Money value={item.total} />
                        <ExternalLink size={11} style={{ color: 'var(--brown-700)' }} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} style={{ padding: 20, textAlign: 'center', color: 'var(--brown-700)', fontSize: 13 }}>
                    No operating expenses recorded in this period.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr style={{ background: 'var(--brown-100)', height: 44, fontWeight: 700, borderTop: '2px solid var(--brown-300)' }}>
                <td style={{ padding: '0 20px', fontSize: 13, textTransform: 'uppercase', color: 'var(--brown-900)' }}>
                  Total Expenses
                </td>
                <td style={{ padding: '0 20px', textAlign: 'right', fontSize: 15 }}>
                  <Money value={report?.totalExpenses || '0.00'} />
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ── 4-Level Drill-Down Modal ── */}
      {selectedDrillAccount && (
        <LedgerDrilldownModal
          accountId={selectedDrillAccount.id}
          accountName={selectedDrillAccount.name}
          from={fromDate}
          to={toDate}
          onClose={() => setSelectedDrillAccount(null)}
        />
      )}
    </div>
  );
}
