import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Decimal from 'decimal.js';
import { ReportsApi, BalanceSheetReport } from '../../api/reports.api';
import Money from '../../components/ui/Money';
import LedgerDrilldownModal from './LedgerDrilldownModal';
import {
  Printer,
  Calendar,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export default function BalanceSheetPage() {
  const navigate = useNavigate();
  const [asOfDate, setAsOfDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedDrillAccount, setSelectedDrillAccount] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const {
    data: report,
    isLoading,
    refetch,
  } = useQuery<BalanceSheetReport>({
    queryKey: ['balance-sheet', asOfDate],
    queryFn: () => ReportsApi.getBalanceSheet(asOfDate),
  });

  const handlePrint = () => {
    window.print();
  };

  const setPreset = (preset: 'today' | 'month-end' | 'q-end' | 'fy26') => {
    const today = new Date();
    const y = today.getFullYear();
    if (preset === 'today') {
      setAsOfDate(today.toISOString().split('T')[0]);
    } else if (preset === 'month-end') {
      const lastDay = new Date(y, today.getMonth() + 1, 0).toISOString().split('T')[0];
      setAsOfDate(lastDay);
    } else if (preset === 'q-end') {
      const q = Math.floor(today.getMonth() / 3);
      const lastDay = new Date(y, (q + 1) * 3, 0).toISOString().split('T')[0];
      setAsOfDate(lastDay);
    } else if (preset === 'fy26') {
      setAsOfDate('2026-03-31');
    }
  };

  const isBalanced = report?.isBalanced ?? true;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1000, margin: '0 auto', width: '100%' }}>
      {/* ── Top Control Bar (Hidden from Print) ── */}
      <div
        className="no-print"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          padding: '10px 16px',
          background: 'var(--surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid rgba(208, 174, 146, 0.4)',
          boxShadow: '0 1px 3px rgba(74, 58, 52, 0.04)',
        }}
      >
        {/* Left: Connected Segmented Controls & Date Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(235, 215, 190, 0.2)',
              border: '1px solid rgba(208, 174, 146, 0.4)',
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 13,
            }}
          >
            <Calendar size={14} style={{ color: 'var(--brown-600)' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--brown-700)' }}>As of:</span>
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                color: 'var(--brown-900)',
                outline: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            />
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: 'rgba(235, 215, 190, 0.3)',
              padding: 3,
              borderRadius: 8,
              border: '1px solid rgba(208, 174, 146, 0.3)',
              gap: 2,
            }}
          >
            {[
              { id: 'today', label: 'Today', date: new Date().toISOString().split('T')[0] },
              {
                id: 'month-end',
                label: 'Month End',
                date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
              },
              { id: 'fy26', label: 'FY 2026 Close', date: '2026-03-31' },
            ].map((preset) => {
              const isActive = asOfDate === preset.date;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setAsOfDate(preset.date)}
                  style={{
                    background: isActive ? 'var(--surface)' : 'transparent',
                    border: 'none',
                    borderRadius: 6,
                    padding: '5px 12px',
                    fontSize: 12,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? 'var(--brown-900)' : 'var(--brown-700)',
                    cursor: 'pointer',
                    boxShadow: isActive ? '0 1px 2px rgba(74, 58, 52, 0.08)' : 'none',
                    transition: 'all 120ms ease',
                  }}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Refresh & Print actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={() => refetch()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--brown-700)',
              background: 'transparent',
              border: '1px solid rgba(208, 174, 146, 0.4)',
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'all 120ms ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(235, 215, 190, 0.25)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            title="Refresh statement"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 16px',
              fontSize: 12,
              fontWeight: 600,
              color: '#FFFFFF',
              background: 'var(--brown-900)',
              border: '1px solid var(--brown-900)',
              borderRadius: 8,
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(74, 58, 52, 0.15)',
              transition: 'all 120ms ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--brown-800)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--brown-900)')}
          >
            <Printer size={13} />
            <span>Print Balance Sheet</span>
          </button>
        </div>
      </div>

      {/* ── Financial Statement Document Sheet (Pure Printable Document) ── */}
      <div
        className="printable-sheet print-avoid-break"
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 1px 4px rgba(74, 58, 52, 0.05)',
          border: '1px solid rgba(208, 174, 146, 0.4)',
          padding: '32px 36px',
        }}
      >
        {/* Document Formal Header */}
        <div
          style={{
            textAlign: 'center',
            borderBottom: '1.5px solid var(--brown-900)',
            paddingBottom: 14,
            marginBottom: 16,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.1em',
              color: 'var(--brown-500)',
              textTransform: 'uppercase',
            }}
          >
            Urban Furniture Private Limited
          </span>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--brown-900)',
              margin: '4px 0 2px 0',
            }}
          >
            Balance Sheet
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 12,
              color: 'var(--brown-700)',
              margin: 0,
            }}
          >
            As of {asOfDate}
          </p>
          <span
            style={{
              fontSize: 10,
              fontStyle: 'italic',
              color: 'var(--brown-500)',
              marginTop: 2,
              display: 'inline-block',
            }}
          >
            (All amounts in INR ₹ · Double-entry financial statement)
          </span>
        </div>

        {/* ── 2-Column Side-by-Side Statement ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, alignItems: 'stretch' }}>
          {/* ── LEFT COLUMN: ASSETS ── */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRight: '1px solid rgba(208, 174, 146, 0.25)', paddingRight: 20 }}>
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '4px 0',
                  borderBottom: '1px solid var(--brown-900)',
                  marginBottom: 8,
                }}
              >
                <h2
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--brown-900)',
                    margin: 0,
                  }}
                >
                  Assets
                </h2>
                <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--brown-500)', textTransform: 'uppercase' }}>
                  Amount (₹)
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {report?.assets && report.assets.length > 0 ? (
                  report.assets.map((acc) => (
                    <div
                      key={acc.accountId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 4px',
                        borderBottom: '1px solid rgba(208, 174, 146, 0.15)',
                        fontSize: 13,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedDrillAccount({
                            id: acc.accountId,
                            name: acc.accountName,
                          })
                        }
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--brown-900)',
                          cursor: 'pointer',
                          fontWeight: 500,
                          padding: 0,
                          textAlign: 'left',
                          fontSize: 13,
                        }}
                        title="Click to drill down into ledger entries"
                        onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                        onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                      >
                        {acc.accountName}
                      </button>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--brown-900)' }}>
                        <Money value={acc.balance} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '8px', fontSize: 12, color: 'var(--brown-500)', fontStyle: 'italic' }}>
                    No asset accounts recorded.
                  </div>
                )}
              </div>
            </div>

            {/* Total Assets */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 4px',
                borderTop: '1px solid var(--brown-900)',
                borderBottom: '3px double var(--brown-900)',
                fontWeight: 700,
                fontSize: 13,
                marginTop: 20,
              }}
            >
              <span style={{ color: 'var(--brown-900)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Total Assets
              </span>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--brown-900)' }}>
                <Money value={report?.totalAssets || '0.00'} />
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN: LIABILITIES & EQUITY ── */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              {/* Liabilities Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '4px 0',
                  borderBottom: '1px solid var(--brown-900)',
                  marginBottom: 8,
                }}
              >
                <h2
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--brown-900)',
                    margin: 0,
                  }}
                >
                  Liabilities & Equity
                </h2>
                <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--brown-500)', textTransform: 'uppercase' }}>
                  Amount (₹)
                </span>
              </div>

              {/* 1. Liabilities List */}
              <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 12 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--brown-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
                  Current Liabilities
                </span>
                {report?.liabilities && report.liabilities.length > 0 ? (
                  report.liabilities.map((acc) => (
                    <div
                      key={acc.accountId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '5px 4px',
                        borderBottom: '1px solid rgba(208, 174, 146, 0.15)',
                        fontSize: 13,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedDrillAccount({
                            id: acc.accountId,
                            name: acc.accountName,
                          })
                        }
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--brown-900)',
                          cursor: 'pointer',
                          fontWeight: 500,
                          padding: 0,
                          textAlign: 'left',
                          fontSize: 13,
                        }}
                        title="Click to drill down into ledger entries"
                        onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                        onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                      >
                        {acc.accountName}
                      </button>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--brown-900)' }}>
                        <Money value={acc.balance} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '4px', fontSize: 12, color: 'var(--brown-500)', fontStyle: 'italic' }}>
                    No liabilities recorded.
                  </div>
                )}

                {/* Subtotal Liabilities */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 4px',
                    borderTop: '1px solid var(--brown-300)',
                    fontWeight: 600,
                    fontSize: 12,
                    color: 'var(--brown-700)',
                  }}
                >
                  <span style={{ textTransform: 'uppercase' }}>Subtotal Liabilities</span>
                  <div style={{ fontFamily: 'var(--font-mono)' }}>
                    <Money value={report?.totalLiabilities || '0.00'} />
                  </div>
                </div>
              </div>

              {/* 2. Capital & Equity List */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--brown-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
                  Capital & Reserves
                </span>
                {report?.capital && report.capital.length > 0 ? (
                  report.capital.map((acc) => (
                    <div
                      key={acc.accountId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '5px 4px',
                        borderBottom: '1px solid rgba(208, 174, 146, 0.15)',
                        fontSize: 13,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedDrillAccount({
                            id: acc.accountId,
                            name: acc.accountName,
                          })
                        }
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--brown-900)',
                          cursor: 'pointer',
                          fontWeight: 500,
                          padding: 0,
                          textAlign: 'left',
                          fontSize: 13,
                        }}
                        title="Click to drill down into ledger entries"
                        onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                        onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                      >
                        {acc.accountName}
                      </button>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--brown-900)' }}>
                        <Money value={acc.balance} />
                      </div>
                    </div>
                  ))
                ) : null}

                {/* Flowed Current Period Profit */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '5px 4px',
                    borderBottom: '1px solid rgba(208, 174, 146, 0.15)',
                    fontSize: 13,
                  }}
                >
                  <span style={{ color: 'var(--brown-900)' }}>
                    Current Period Profit (P&L)
                  </span>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--brown-900)' }}>
                    <Money value={report?.currentPeriodProfit || '0.00'} />
                  </div>
                </div>

                {/* Subtotal Equity */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 4px',
                    borderTop: '1px solid var(--brown-300)',
                    fontWeight: 600,
                    fontSize: 12,
                    color: 'var(--brown-700)',
                  }}
                >
                  <span style={{ textTransform: 'uppercase' }}>Subtotal Equity</span>
                  <div style={{ fontFamily: 'var(--font-mono)' }}>
                    <Money value={report?.totalEquity || '0.00'} />
                  </div>
                </div>
              </div>
            </div>

            {/* Total Liabilities & Equity */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 4px',
                borderTop: '1px solid var(--brown-900)',
                borderBottom: '3px double var(--brown-900)',
                fontWeight: 700,
                fontSize: 13,
                marginTop: 20,
              }}
            >
              <span style={{ color: 'var(--brown-900)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Total Liabilities & Equity
              </span>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--brown-900)' }}>
                <Money value={report?.totalEquity && report?.totalLiabilities ? new Decimal(report.totalLiabilities).plus(report.totalEquity).toFixed(2) : (report?.totalAssets || '0.00')} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4-Level Drilldown Modal (Hidden from Print) ── */}
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
