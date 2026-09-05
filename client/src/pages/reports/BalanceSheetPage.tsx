import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ReportsApi, BalanceSheetReport } from '../../api/reports.api';
import Money from '../../components/ui/Money';
import LedgerDrilldownModal from './LedgerDrilldownModal';
import {
  Printer,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';

export default function BalanceSheetPage() {
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [asOfDate, setAsOfDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedDrillAccount, setSelectedDrillAccount] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const handleYearChange = (yr: string) => {
    setSelectedYear(yr);
    if (yr !== 'custom') {
      setAsOfDate(`${yr}-12-31`);
    }
  };

  const {
    data: report,
    isLoading,
    refetch,
  } = useQuery<BalanceSheetReport>({
    queryKey: ['balance-sheet', asOfDate],
    queryFn: () => ReportsApi.getBalanceSheet(asOfDate),
  });

  const handlePrint = () => {
    ReportsApi.downloadPdf('balance-sheet', { asOf: asOfDate });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: 1200, margin: '0 auto' }}>
      {/* ── Page Header ── */}
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
            Balance Sheet
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
            Cumulative statement of financial position up to a single date
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
          {/* Print / PDF Button */}
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

      {/* ── Controls: Year & Single As-Of Date Picker ── */}
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
            <Calendar size={18} style={{ color: 'var(--brown-700)' }} />
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
              <option value="2026">2026 (Dec 31, 2026)</option>
              <option value="2025">2025 (Dec 31, 2025)</option>
              <option value="2024">2024 (Dec 31, 2024)</option>
              <option value="custom">Custom Date</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label
              htmlFor="asOfDatePicker"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--brown-900)',
              }}
            >
              As of Date:
            </label>
            <input
              id="asOfDatePicker"
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--brown-300)',
                background: 'var(--surface)',
                color: 'var(--brown-900)',
                cursor: 'pointer',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
            <span>Recalculate</span>
          </button>
        </div>
      </div>

      {/* ── Balance Status Banner ── */}
      {report && (
        <div
          style={{
            background: report.isBalanced ? 'var(--posted-bg)' : 'var(--danger-bg)',
            border: `1px solid ${report.isBalanced ? 'var(--posted)' : 'var(--danger)'}`,
            borderRadius: 'var(--radius-sm)',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {report.isBalanced ? (
            <>
              <CheckCircle2 size={16} style={{ color: 'var(--posted)' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--posted)', fontFamily: 'var(--font-body)' }}>
                Balanced Statement: Assets (<Money value={report.totalAssets} />) = Liabilities + Capital (<Money value={report.totalEquity} />)
              </span>
            </>
          ) : (
            <>
              <AlertCircle size={16} style={{ color: 'var(--danger)' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--danger)', fontFamily: 'var(--font-body)' }}>
                Out of Balance Warning: Total Assets (<Money value={report.totalAssets} />) does not equal Liabilities + Capital (<Money value={report.totalEquity} />)
              </span>
            </>
          )}
        </div>
      )}

      {/* ── Two-Column Balance Sheet (Assets vs Liabilities + Capital) ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))',
          gap: 'var(--space-6)',
          alignItems: 'start',
        }}
      >
        {/* LEFT COLUMN: Assets */}
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
              Assets
            </h2>
            <span style={{ fontSize: 12, color: 'var(--brown-700)', fontFamily: 'var(--font-body)' }}>
              Click any amount to drill down
            </span>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ height: 32, borderBottom: '1px solid rgba(208, 174, 146, 0.2)', background: 'rgba(249, 242, 228, 0.5)' }}>
                <th style={{ padding: '0 20px', fontSize: 11, fontWeight: 600, color: 'var(--brown-700)', textTransform: 'uppercase' }}>
                  Account
                </th>
                <th style={{ padding: '0 20px', fontSize: 11, fontWeight: 600, color: 'var(--brown-700)', textTransform: 'uppercase', textAlign: 'right' }}>
                  Balance
                </th>
              </tr>
            </thead>
            <tbody>
              {report?.assets && report.assets.length > 0 ? (
                report.assets.map((item) => (
                  <tr
                    key={item.accountId}
                    style={{
                      height: 44,
                      borderBottom: '1px solid rgba(208, 174, 146, 0.2)',
                      transition: 'background 120ms ease-out',
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
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = 'var(--brown-700)';
                          e.currentTarget.style.textDecoration = 'underline';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--brown-900)';
                          e.currentTarget.style.textDecoration = 'none';
                        }}
                      >
                        <Money value={item.balance} />
                        <ExternalLink size={11} style={{ color: 'var(--brown-700)' }} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} style={{ padding: 24, textAlign: 'center', color: 'var(--brown-700)', fontSize: 13 }}>
                    No asset balances recorded.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr style={{ background: 'var(--brown-100)', height: 48, fontWeight: 700, borderTop: '2px solid var(--brown-300)' }}>
                <td style={{ padding: '0 20px', fontSize: 13, textTransform: 'uppercase', color: 'var(--brown-900)' }}>
                  Total Assets
                </td>
                <td style={{ padding: '0 20px', textAlign: 'right', fontSize: 15 }}>
                  <Money value={report?.totalAssets || '0.00'} />
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* RIGHT COLUMN: Liabilities + Capital / Equity */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid rgba(208, 174, 146, 0.4)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-sm)',
            overflow: 'hidden',
          }}
        >
          {/* Liabilities Section */}
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
              Liabilities & Capital
            </h2>
            <span style={{ fontSize: 12, color: 'var(--brown-700)', fontFamily: 'var(--font-body)' }}>
              Click any amount to drill down
            </span>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ height: 32, borderBottom: '1px solid rgba(208, 174, 146, 0.2)', background: 'rgba(249, 242, 228, 0.5)' }}>
                <th style={{ padding: '0 20px', fontSize: 11, fontWeight: 600, color: 'var(--brown-700)', textTransform: 'uppercase' }}>
                  Account / Equity Source
                </th>
                <th style={{ padding: '0 20px', fontSize: 11, fontWeight: 600, color: 'var(--brown-700)', textTransform: 'uppercase', textAlign: 'right' }}>
                  Balance
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Category: Liabilities Header */}
              <tr style={{ background: 'rgba(235, 215, 190, 0.2)', height: 28 }}>
                <td colSpan={2} style={{ padding: '0 20px', fontSize: 11, fontWeight: 700, color: 'var(--brown-700)', textTransform: 'uppercase' }}>
                  Liabilities
                </td>
              </tr>
              {report?.liabilities && report.liabilities.length > 0 ? (
                report.liabilities.map((item) => (
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
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = 'var(--brown-700)';
                          e.currentTarget.style.textDecoration = 'underline';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--brown-900)';
                          e.currentTarget.style.textDecoration = 'none';
                        }}
                      >
                        <Money value={item.balance} />
                        <ExternalLink size={11} style={{ color: 'var(--brown-700)' }} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : null}

              {/* Subtotal Liabilities */}
              <tr style={{ height: 36, background: 'rgba(249, 242, 228, 0.3)', borderBottom: '1px solid rgba(208, 174, 146, 0.3)' }}>
                <td style={{ padding: '0 20px', fontSize: 12, fontWeight: 600, color: 'var(--brown-700)', fontStyle: 'italic' }}>
                  Total Liabilities
                </td>
                <td style={{ padding: '0 20px', textAlign: 'right', fontWeight: 600 }}>
                  <Money value={report?.totalLiabilities || '0.00'} />
                </td>
              </tr>

              {/* Category: Capital & Equity */}
              <tr style={{ background: 'rgba(235, 215, 190, 0.2)', height: 28 }}>
                <td colSpan={2} style={{ padding: '0 20px', fontSize: 11, fontWeight: 700, color: 'var(--brown-700)', textTransform: 'uppercase' }}>
                  Capital & Equity
                </td>
              </tr>
              {report?.capital && report.capital.length > 0
                ? report.capital.map((item) => (
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
                          <Money value={item.balance} />
                          <ExternalLink size={11} style={{ color: 'var(--brown-700)' }} />
                        </button>
                      </td>
                    </tr>
                  ))
                : null}

              {/* Current Period Net Profit flowing into Equity */}
              <tr style={{ height: 44, borderBottom: '1px solid rgba(208, 174, 146, 0.2)' }}>
                <td style={{ padding: '0 20px', fontSize: 13, fontWeight: 600, color: 'var(--posted)' }}>
                  Current Period Net Profit
                </td>
                <td style={{ padding: '0 20px', textAlign: 'right', fontWeight: 600 }}>
                  <Money value={report?.currentPeriodProfit || '0.00'} />
                </td>
              </tr>

              {/* Subtotal Equity */}
              <tr style={{ height: 36, background: 'rgba(249, 242, 228, 0.3)' }}>
                <td style={{ padding: '0 20px', fontSize: 12, fontWeight: 600, color: 'var(--brown-700)', fontStyle: 'italic' }}>
                  Total Capital & Reserves
                </td>
                <td style={{ padding: '0 20px', textAlign: 'right', fontWeight: 600 }}>
                  <Money value={report?.totalCapital || '0.00'} />
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr style={{ background: 'var(--brown-100)', height: 48, fontWeight: 700, borderTop: '2px solid var(--brown-300)' }}>
                <td style={{ padding: '0 20px', fontSize: 13, textTransform: 'uppercase', color: 'var(--brown-900)' }}>
                  Total Liabilities & Capital
                </td>
                <td style={{ padding: '0 20px', textAlign: 'right', fontSize: 15 }}>
                  <Money value={report?.totalEquity || '0.00'} />
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
          asOf={asOfDate}
          onClose={() => setSelectedDrillAccount(null)}
        />
      )}
    </div>
  );
}
