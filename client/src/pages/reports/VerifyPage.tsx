import React from 'react';
import { useQuery } from '@tanstack/react-query';
import Decimal from 'decimal.js';
import { ReportsApi, VerificationResult } from '../../api/reports.api';
import Money from '../../components/ui/Money';
import {
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Scale,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export default function VerifyPage() {
  const {
    data: verifyData,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery<VerificationResult>({
    queryKey: ['verify-ledger'],
    queryFn: ReportsApi.verifyLedger,
  });

  const diffDecimal = new Decimal(verifyData?.difference || '0.00');
  const isZero = diffDecimal.isZero();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '75vh',
        maxWidth: 880,
        margin: '0 auto',
        textAlign: 'center',
        padding: '32px 16px',
        gap: 'var(--space-8)',
      }}
    >
      {/* ── Demo Badge ── */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: isZero ? 'var(--posted-bg)' : 'var(--danger-bg)',
          border: `1px solid ${isZero ? 'var(--posted)' : 'var(--danger)'}`,
          padding: '6px 16px',
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: isZero ? 'var(--posted)' : 'var(--danger)',
        }}
      >
        <ShieldCheck size={16} />
        <span>Double-Entry Balance Verification</span>
      </div>

      {/* ── Title & Intro ── */}
      <div>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 36,
            lineHeight: '44px',
            color: 'var(--brown-900)',
            margin: 0,
          }}
        >
          System Ledger Audit
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 16,
            color: 'var(--brown-700)',
            marginTop: 8,
            maxWidth: 600,
            margin: '8px auto 0 auto',
          }}
        >
          Verification of the fundamental accounting invariant across all posted journal entries in the database.
        </p>
      </div>

      {/* ── Central Difference Showpiece ── */}
      <div
        style={{
          width: '100%',
          background: 'var(--surface)',
          border: `2px solid ${isZero ? 'var(--posted)' : 'var(--danger)'}`,
          borderRadius: 'var(--radius-lg)',
          boxShadow: isZero ? '0 12px 32px rgba(95, 112, 82, 0.15)' : '0 12px 32px rgba(158, 74, 56, 0.15)',
          padding: '40px 32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: isZero ? 'var(--posted)' : 'var(--danger)' }}>
          <Scale size={24} />
          <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Net Ledger Difference (Debits − Credits)
          </span>
        </div>

        {/* Big Centered Type */}
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 56,
            lineHeight: '64px',
            color: isZero ? 'var(--posted)' : 'var(--danger)',
          }}
        >
          {isLoading ? 'Checking…' : <Money value={verifyData?.difference || '0.00'} />}
        </div>

        {isZero ? (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--posted-bg)',
              padding: '8px 20px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--posted)',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            <CheckCircle2 size={18} />
            <span>Perfect Balance Confirmed — Debit = Credit</span>
          </div>
        ) : (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--danger-bg)',
              padding: '8px 20px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--danger)',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            <AlertTriangle size={18} />
            <span>Ledger Unbalanced — Discrepancy Detected</span>
          </div>
        )}

        {/* ── Sub-cards: Total Debits vs Total Credits ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 20,
            width: '100%',
            marginTop: 16,
            borderTop: '1px solid rgba(208, 174, 146, 0.4)',
            paddingTop: 24,
          }}
        >
          {/* Total Debits */}
          <div
            style={{
              background: 'var(--cream)',
              borderRadius: 'var(--radius-md)',
              padding: '16px 20px',
              textAlign: 'center',
              border: '1px solid rgba(208, 174, 146, 0.4)',
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--brown-700)', textTransform: 'uppercase' }}>
              Total Debits
            </span>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 26,
                color: 'var(--brown-900)',
                marginTop: 6,
              }}
            >
              <Money value={verifyData?.totalDebit || '0.00'} />
            </div>
          </div>

          {/* Total Credits */}
          <div
            style={{
              background: 'var(--cream)',
              borderRadius: 'var(--radius-md)',
              padding: '16px 20px',
              textAlign: 'center',
              border: '1px solid rgba(208, 174, 146, 0.4)',
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--brown-700)', textTransform: 'uppercase' }}>
              Total Credits
            </span>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 26,
                color: 'var(--brown-900)',
                marginTop: 6,
              }}
            >
              <Money value={verifyData?.totalCredit || '0.00'} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Re-run Verification Button & Explanatory Note ── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isLoading || isRefetching}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 24px',
            fontSize: 14,
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            color: 'var(--cream)',
            background: 'var(--brown-900)',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-md)',
            transition: 'opacity 150ms ease-out',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.9';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
        >
          <RefreshCw size={16} className={isRefetching ? 'animate-spin' : ''} />
          <span>{isRefetching ? 'Auditing Ledger…' : 'Re-verify Ledger Integrity'}</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--brown-700)', fontSize: 12 }}>
          <Lock size={13} />
          <span>Backed by PostgreSQL DEFERRABLE transaction constraint triggers</span>
        </div>
      </div>
    </div>
  );
}
