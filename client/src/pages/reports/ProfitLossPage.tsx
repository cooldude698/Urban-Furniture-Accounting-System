import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Decimal from 'decimal.js';
import { ReportsApi, ProfitLossReport } from '../../api/reports.api';
import Money from '../../components/ui/Money';
import LedgerDrilldownModal from './LedgerDrilldownModal';
import {
  Printer,
  Calendar,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';

export default function ProfitLossPage() {
  const navigate = useNavigate();
  const [fromDate, setFromDate] = useState<string>('2026-01-01');
  const [toDate, setToDate] = useState<string>(
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
  } = useQuery<ProfitLossReport>({
    queryKey: ['profit-loss', fromDate, toDate],
    queryFn: () => ReportsApi.getProfitAndLoss(fromDate, toDate),
  });

  const handlePrint = () => {
    ReportsApi.downloadPdf('profit-loss', { from: fromDate, to: toDate });
  };

  const setPreset = (preset: 'month' | 'quarter' | 'year' | 'fy26') => {
    const today = new Date();
    const y = today.getFullYear();
    if (preset === 'month') {
      const firstDay = new Date(y, today.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(y, today.getMonth() + 1, 0).toISOString().split('T')[0];
      setFromDate(firstDay);
      setToDate(lastDay);
    } else if (preset === 'quarter') {
      const q = Math.floor(today.getMonth() / 3);
      const firstDay = new Date(y, q * 3, 1).toISOString().split('T')[0];
      const lastDay = new Date(y, (q + 1) * 3, 0).toISOString().split('T')[0];
      setFromDate(firstDay);
      setToDate(lastDay);
    } else if (preset === 'year') {
      setFromDate(`${y}-01-01`);
      setToDate(`${y}-12-31`);
    } else if (preset === 'fy26') {
      setFromDate('2026-04-01');
      setToDate('2027-03-31');
    }
  };

  const isNetProfitPositive = report
    ? new Decimal(report.netProfit || '0').greaterThanOrEqualTo(0)
    : true;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 980, margin: '0 auto', width: '100%' }}>
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
        {/* Date Filter & Presets */}
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
            <span style={{ fontWeight: 600, color: 'var(--brown-700)' }}>Period:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
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
            <span style={{ color: 'var(--brown-400)' }}>to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
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
              onClick={() => setPreset('month')}
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
              This Month
            </button>
            <button
              type="button"
              onClick={() => setPreset('quarter')}
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
              This Quarter
            </button>
            <button
              type="button"
              onClick={() => setPreset('year')}
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
              FY 2026
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
            marginBottom: 24,
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
            Statement of Profit & Loss
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              color: 'var(--brown-700)',
              margin: 0,
            }}
          >
            For the period from {fromDate} to {toDate}
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

        {/* ── Statement Content ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* 1. Operating Revenue / Income */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 0',
                borderBottom: '1px solid var(--brown-900)',
                marginBottom: 8,
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
                I. Revenue & Operating Income
              </h2>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--brown-500)', textTransform: 'uppercase' }}>
                Amount (₹)
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {report?.income && report.income.length > 0 ? (
                report.income.map((acc) => (
                  <div
                    key={acc.accountId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
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
                      <Money value={acc.total} />
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '12px', fontSize: 13, color: 'var(--brown-500)', fontStyle: 'italic' }}>
                  No income entries recorded in this period.
                </div>
              )}

              {/* Subtotal: Total Income */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  background: 'rgba(235, 215, 190, 0.2)',
                  borderTop: '1px solid var(--brown-400)',
                  borderBottom: '1px solid var(--brown-400)',
                  fontWeight: 700,
                  fontSize: 13,
                  marginTop: 4,
                }}
              >
                <span style={{ color: 'var(--brown-900)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                  Total Revenue (A)
                </span>
                <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--brown-900)' }}>
                  <Money value={report?.totalIncome || '0.00'} />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Operating & Other Expenses */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 0',
                borderBottom: '1px solid var(--brown-900)',
                marginBottom: 8,
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
                II. Cost of Goods & Operating Expenses
              </h2>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--brown-500)', textTransform: 'uppercase' }}>
                Amount (₹)
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {report?.expenses && report.expenses.length > 0 ? (
                report.expenses.map((acc) => (
                  <div
                    key={acc.accountId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
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
                        {acc.type.replace('_', ' ')}
                      </span>
                      <ArrowUpRight size={13} style={{ color: 'var(--brown-400)' }} />
                    </button>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: 'var(--brown-900)' }}>
                      <Money value={acc.total} />
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '12px', fontSize: 13, color: 'var(--brown-500)', fontStyle: 'italic' }}>
                  No expense entries recorded in this period.
                </div>
              )}

              {/* Subtotal: Total Expenses */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  background: 'rgba(235, 215, 190, 0.2)',
                  borderTop: '1px solid var(--brown-400)',
                  borderBottom: '1px solid var(--brown-400)',
                  fontWeight: 700,
                  fontSize: 13,
                  marginTop: 4,
                }}
              >
                <span style={{ color: 'var(--brown-900)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                  Total Expenses (B)
                </span>
                <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--brown-900)' }}>
                  <Money value={report?.totalExpenses || '0.00'} />
                </div>
              </div>
            </div>
          </div>

          {/* 3. Net Profit / (Loss) Bottom Accounting Line */}
          <div
            style={{
              marginTop: 12,
              padding: '16px 20px',
              background: isNetProfitPositive ? 'var(--posted-bg)' : 'var(--danger-bg)',
              border: `1px solid ${isNetProfitPositive ? 'rgba(95, 112, 82, 0.4)' : 'rgba(158, 74, 56, 0.4)'}`,
              borderTop: '2px solid var(--brown-900)',
              borderBottom: '4px double var(--brown-900)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 15,
                  fontWeight: 700,
                  color: isNetProfitPositive ? 'var(--posted)' : 'var(--danger)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {isNetProfitPositive ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                <span>Net {isNetProfitPositive ? 'Profit' : 'Loss'} for the Period (A − B)</span>
              </div>
              <span style={{ fontSize: 11, color: 'var(--brown-700)', marginTop: 2, display: 'block' }}>
                Recognized net profit flows directly to Balance Sheet Equity reserves.
              </span>
            </div>

            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 22,
                fontWeight: 700,
                color: isNetProfitPositive ? 'var(--posted)' : 'var(--danger)',
              }}
            >
              <Money value={report?.netProfit || '0.00'} />
            </div>
          </div>
        </div>
      </div>

      {/* ── 4-Level Drilldown Modal ── */}
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
