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
  ArrowUpRight,
  ShieldCheck,
  Layers,
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
    ReportsApi.downloadPdf('balance-sheet', { asOf: asOfDate });
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1100, margin: '0 auto', width: '100%' }}>
      {/* ── Top Control Bar (Clean Accounting Toolbar) ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          padding: '4px 0',
        }}
      >
        {/* Single As-Of Date Filter & Presets */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--surface)',
              border: '1px solid var(--brown-300)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13,
            }}
          >
            <Calendar size={14} style={{ color: 'var(--brown-700)' }} />
            <span style={{ fontWeight: 600, color: 'var(--brown-700)' }}>As of Date:</span>
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
                color: 'var(--brown-900)',
                outline: 'none',
                cursor: 'pointer',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
              type="button"
              onClick={() => setPreset('today')}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--brown-300)',
                borderRadius: 'var(--radius-sm)',
                padding: '5px 9px',
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--brown-700)',
                cursor: 'pointer',
              }}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setPreset('month-end')}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--brown-300)',
                borderRadius: 'var(--radius-sm)',
                padding: '5px 9px',
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--brown-700)',
                cursor: 'pointer',
              }}
            >
              Month End
            </button>
            <button
              type="button"
              onClick={() => setPreset('fy26')}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--brown-300)',
                borderRadius: 'var(--radius-sm)',
                padding: '5px 9px',
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--brown-700)',
                cursor: 'pointer',
              }}
            >
              FY 2026 Close
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
              background: 'var(--surface)',
              border: '1px solid var(--brown-300)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
            }}
            title="Refresh statement"
          >
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--cream)',
              background: 'var(--brown-900)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <Printer size={13} />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* ── Financial Statement Document Sheet (Standard Accounting Presentation) ── */}
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 2px 8px rgba(74, 58, 52, 0.06)',
          border: '1px solid rgba(208, 174, 146, 0.45)',
          padding: '36px 44px',
        }}
      >
        {/* Document Formal Header */}
        <div
          style={{
            textAlign: 'center',
            borderBottom: '2px solid var(--brown-900)',
            paddingBottom: 20,
            marginBottom: 20,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.12em',
              color: 'var(--brown-500)',
              textTransform: 'uppercase',
            }}
          >
            Urban Furniture Private Limited
          </span>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 24,
              fontWeight: 700,
              color: 'var(--brown-900)',
              margin: '6px 0 4px 0',
            }}
          >
            Balance Sheet
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              color: 'var(--brown-700)',
              margin: 0,
            }}
          >
            Cumulative Financial Position as of {asOfDate}
          </p>
          <span
            style={{
              fontSize: 11,
              fontStyle: 'italic',
              color: 'var(--brown-500)',
              marginTop: 4,
              display: 'inline-block',
            }}
          >
            (All figures in Indian Rupees ₹ · Click any account to drill down into general ledger)
          </span>
        </div>

        {/* Equilibrium Status Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 14px',
            background: isBalanced ? 'rgba(95, 112, 82, 0.08)' : 'var(--danger-bg)',
            border: `1px solid ${isBalanced ? 'rgba(95, 112, 82, 0.3)' : 'var(--danger)'}`,
            borderRadius: 'var(--radius-sm)',
            marginBottom: 24,
            fontSize: 12,
            fontWeight: 600,
            color: isBalanced ? 'var(--posted)' : 'var(--danger)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {isBalanced ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
            <span>
              {isBalanced
                ? 'Balance Sheet in Equilibrium (Assets = Liabilities + Total Equity)'
                : 'Warning: Balance Sheet Unbalanced — check unposted transactions'}
            </span>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700 }}>
            {report?.totalAssets ? `₹${Number(report.totalAssets).toLocaleString('en-IN')}` : '—'}
          </span>
        </div>

        {/* ── 2-Column Side-by-Side Statement Structure ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'stretch' }}>
          {/* ── LEFT COLUMN: ASSETS ── */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRight: '1px solid rgba(208, 174, 146, 0.3)', paddingRight: 24 }}>
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 0',
                  borderBottom: '1px solid var(--brown-900)',
                  marginBottom: 10,
                }}
              >
                <h2
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 14,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--brown-900)',
                    margin: 0,
                  }}
                >
                  Assets
                </h2>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--brown-500)', textTransform: 'uppercase' }}>
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
                        padding: '8px 8px',
                        borderBottom: '1px solid rgba(208, 174, 146, 0.2)',
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
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          fontWeight: 500,
                          padding: 0,
                          textAlign: 'left',
                        }}
                        title="Click to drill down into ledger entries"
                      >
                        <span>{acc.accountName}</span>
                        <span
                          style={{
                            fontSize: 10,
                            background: 'rgba(235, 215, 190, 0.4)',
                            color: 'var(--brown-700)',
                            padding: '2px 6px',
                            borderRadius: 4,
                            textTransform: 'uppercase',
                          }}
                        >
                          {acc.type}
                        </span>
                        <ArrowUpRight size={13} style={{ color: 'var(--brown-400)' }} />
                      </button>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: 'var(--brown-900)' }}>
                        <Money value={acc.balance} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '12px', fontSize: 13, color: 'var(--brown-500)', fontStyle: 'italic' }}>
                    No asset balances recorded.
                  </div>
                )}
              </div>
            </div>

            {/* Total Assets with Double Bottom Border */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 10px',
                background: 'rgba(235, 215, 190, 0.2)',
                borderTop: '1px solid var(--brown-900)',
                borderBottom: '4px double var(--brown-900)',
                fontWeight: 700,
                fontSize: 14,
                marginTop: 24,
              }}
            >
              <span style={{ color: 'var(--brown-900)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Total Assets
              </span>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, color: 'var(--brown-900)' }}>
                <Money value={report?.totalAssets || '0.00'} />
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN: LIABILITIES & EQUITY ── */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              {/* 1. Liabilities Section */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 0',
                  borderBottom: '1px solid var(--brown-900)',
                  marginBottom: 10,
                }}
              >
                <h2
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 14,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--brown-900)',
                    margin: 0,
                  }}
                >
                  Liabilities
                </h2>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--brown-500)', textTransform: 'uppercase' }}>
                  Amount (₹)
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 16 }}>
                {report?.liabilities && report.liabilities.length > 0 ? (
                  report.liabilities.map((acc) => (
                    <div
                      key={acc.accountId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 8px',
                        borderBottom: '1px solid rgba(208, 174, 146, 0.2)',
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
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          fontWeight: 500,
                          padding: 0,
                          textAlign: 'left',
                        }}
                        title="Click to drill down into ledger entries"
                      >
                        <span>{acc.accountName}</span>
                        <ArrowUpRight size={13} style={{ color: 'var(--brown-400)' }} />
                      </button>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: 'var(--brown-900)' }}>
                        <Money value={acc.balance} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '8px', fontSize: 12, color: 'var(--brown-500)', fontStyle: 'italic' }}>
                    No liabilities recorded.
                  </div>
                )}

                {/* Subtotal: Total Liabilities */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 8px',
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

              {/* 2. Capital & Equity Section */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 0',
                  borderBottom: '1px solid var(--brown-900)',
                  marginBottom: 10,
                  marginTop: 10,
                }}
              >
                <h2
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 14,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--brown-900)',
                    margin: 0,
                  }}
                >
                  Capital & Equity
                </h2>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--brown-500)', textTransform: 'uppercase' }}>
                  Amount (₹)
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {report?.capital && report.capital.length > 0 ? (
                  report.capital.map((acc) => (
                    <div
                      key={acc.accountId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 8px',
                        borderBottom: '1px solid rgba(208, 174, 146, 0.2)',
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
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          fontWeight: 500,
                          padding: 0,
                          textAlign: 'left',
                        }}
                        title="Click to drill down into ledger entries"
                      >
                        <span>{acc.accountName}</span>
                        <ArrowUpRight size={13} style={{ color: 'var(--brown-400)' }} />
                      </button>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: 'var(--brown-900)' }}>
                        <Money value={acc.balance} />
                      </div>
                    </div>
                  ))
                ) : null}

                {/* Current Period Net Profit row flowed into equity */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 8px',
                    borderBottom: '1px solid rgba(208, 174, 146, 0.2)',
                    fontSize: 13,
                    background: 'rgba(95, 112, 82, 0.05)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 600, color: 'var(--posted)' }}>
                      Current Period Net Profit
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--brown-500)', fontStyle: 'italic' }}>
                      (Flowed from P&L)
                    </span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--posted)' }}>
                    <Money value={report?.currentPeriodProfit || '0.00'} />
                  </div>
                </div>

                {/* Subtotal: Total Equity */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 8px',
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

            {/* Total Liabilities & Equity with Double Bottom Border */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 10px',
                background: 'rgba(235, 215, 190, 0.2)',
                borderTop: '1px solid var(--brown-900)',
                borderBottom: '4px double var(--brown-900)',
                fontWeight: 700,
                fontSize: 14,
                marginTop: 24,
              }}
            >
              <span style={{ color: 'var(--brown-900)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Total Liabilities & Equity
              </span>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, color: 'var(--brown-900)' }}>
                <Money value={report?.totalEquity && report?.totalLiabilities ? new Decimal(report.totalLiabilities).plus(report.totalEquity).toFixed(2) : (report?.totalAssets || '0.00')} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4-Level Drilldown Modal ── */}
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
