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
  RefreshCw,
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
    window.print();
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 900, margin: '0 auto', width: '100%' }}>
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
        {/* Date Filter & Presets */}
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
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--brown-700)' }}>Period:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
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
            <span style={{ color: 'var(--brown-400)', fontSize: 12, fontWeight: 500 }}>to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
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
              {
                id: 'month',
                label: 'This Month',
                from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
                to: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
              },
              {
                id: 'quarter',
                label: 'This Quarter',
                from: new Date(new Date().getFullYear(), Math.floor(new Date().getMonth() / 3) * 3, 1).toISOString().split('T')[0],
                to: new Date(new Date().getFullYear(), (Math.floor(new Date().getMonth() / 3) + 1) * 3, 0).toISOString().split('T')[0],
              },
              {
                id: 'fy26',
                label: 'FY 2026',
                from: '2026-04-01',
                to: '2027-03-31',
              },
            ].map((preset) => {
              const isActive = fromDate === preset.from && toDate === preset.to;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setFromDate(preset.from);
                    setToDate(preset.to);
                  }}
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

        {/* Action Buttons */}
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
            <span>Print Profit & Loss</span>
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
            marginBottom: 20,
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
            Statement of Profit & Loss
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 12,
              color: 'var(--brown-700)',
              margin: 0,
            }}
          >
            For the period from {fromDate} to {toDate}
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

        {/* ── Statement Content ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* 1. Revenue & Operating Income */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 0',
                borderBottom: '1px solid var(--brown-900)',
                marginBottom: 6,
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
                I. Revenue & Operating Income
              </h2>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--brown-500)', textTransform: 'uppercase' }}>
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
                      <Money value={acc.total} />
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '8px', fontSize: 12, color: 'var(--brown-500)', fontStyle: 'italic' }}>
                  No income entries recorded in this period.
                </div>
              )}

              {/* Subtotal: Total Income */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 4px',
                  borderTop: '1px solid var(--brown-400)',
                  borderBottom: '1px solid var(--brown-400)',
                  fontWeight: 700,
                  fontSize: 13,
                  marginTop: 2,
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

          {/* 2. Cost of Goods & Operating Expenses */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 0',
                borderBottom: '1px solid var(--brown-900)',
                marginBottom: 6,
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
                II. Cost of Goods & Operating Expenses
              </h2>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--brown-500)', textTransform: 'uppercase' }}>
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
                      <Money value={acc.total} />
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '8px', fontSize: 12, color: 'var(--brown-500)', fontStyle: 'italic' }}>
                  No expense entries recorded in this period.
                </div>
              )}

              {/* Subtotal: Total Expenses */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 4px',
                  borderTop: '1px solid var(--brown-400)',
                  borderBottom: '1px solid var(--brown-400)',
                  fontWeight: 700,
                  fontSize: 13,
                  marginTop: 2,
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
              padding: '10px 4px',
              borderTop: '1.5px solid var(--brown-900)',
              borderBottom: '3px double var(--brown-900)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--brown-900)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Net {isNetProfitPositive ? 'Profit' : 'Loss'} for the Period (A − B)
              </span>
            </div>

            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 16,
                fontWeight: 700,
                color: 'var(--brown-900)',
              }}
            >
              <Money value={report?.netProfit || '0.00'} />
            </div>
          </div>
        </div>
      </div>

      {/* ── 4-Level Drilldown Modal (Hidden from Print) ── */}
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
