import { useState } from 'react';
import {
  Money,
  StatusBadge,
  SmartButton,
  BlockingWarning,
  NonBlockingWarning,
  ListView,
  FormView,
  LineItemGrid,
} from '../components';
import type { ListColumn, GridRow } from '../components';

/* ── Sample data ─────────────────────────────────────────────── */
type SampleRow = { id: string; ref: string; partner: string; amount: string; status: string; date: string };

const SAMPLE_ROWS: SampleRow[] = [
  { id: '1', ref: 'Bill/2026/0001', partner: 'Acme Furniture', amount: '125000.00', status: 'confirmed', date: '2026-09-01' },
  { id: '2', ref: 'Bill/2026/0002', partner: 'Teak World',      amount: '48500.50',  status: 'draft',     date: '2026-09-03' },
  { id: '3', ref: 'Bill/2026/0003', partner: 'Wood Palace',     amount: '9999.00',   status: 'paid',      date: '2026-09-04' },
  { id: '4', ref: 'Bill/2026/0004', partner: 'Maple Co.',       amount: '200000.00', status: 'partial',   date: '2026-09-05' },
];

const LIST_COLS: ListColumn<SampleRow>[] = [
  { label: 'Reference', key: 'ref',     type: 'text' },
  { label: 'Partner',   key: 'partner', type: 'text' },
  { label: 'Date',      key: 'date',    type: 'date' },
  { label: 'Amount',    key: 'amount',  type: 'money', width: 160 },
  { label: 'Status',    key: 'status',  type: 'badge', width: 130 },
];

const GRID_COLS = [
  { key: 'product',   label: 'Product',    type: 'text'   as const },
  { key: 'qty',       label: 'Qty',        type: 'number' as const, width: 80 },
  { key: 'unitPrice', label: 'Unit Price', type: 'money'  as const, width: 140 },
  { key: 'total',     label: 'Total',      type: 'readonly' as const, width: 140 },
];

const INIT_ROWS: GridRow[] = [
  { product: 'Walnut Chair',   qty: '4',  unitPrice: '12500.00', total: '50000.00' },
  { product: 'Teak Table',     qty: '1',  unitPrice: '85000.00', total: '85000.00' },
];

/* ── KitchenSink ─────────────────────────────────────────────── */
export default function KitchenSink() {
  const [gridRows, setGridRows] = useState<GridRow[]>(INIT_ROWS);
  const [showBlocking, setShowBlocking] = useState(true);
  const [showNonBlocking, setShowNonBlocking] = useState(true);

  return (
    <div style={{ padding: '32px', background: 'var(--cream)', minHeight: '100vh' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, color: 'var(--brown-900)', marginBottom: 8 }}>
        Kitchen Sink
      </h1>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--brown-500)', marginBottom: 48 }}>
        Every component in every state — reviewers check this route.
      </p>

      {/* ── FONTS ── */}
      <Section title="1. Fonts">
        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, color: 'var(--brown-900)' }}>
          Montserrat 700 — Display / Headers
        </p>
        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18, color: 'var(--brown-700)', marginTop: 8 }}>
          Montserrat 600 — Section
        </p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--brown-900)', marginTop: 8 }}>
          DM Sans 400 — Body copy, the main reading font for the whole app.
        </p>
        <p style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 15, color: 'var(--brown-700)', marginTop: 4 }}>
          DM Sans 500 Medium — Labels, nav items.
        </p>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 15, color: 'var(--brown-900)', marginTop: 8, fontVariantNumeric: 'tabular-nums' }}>
          IBM Plex Mono 400 — ₹12,34,567.89 — ledger figures, amounts
        </p>
        <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 500, fontSize: 15, color: 'var(--brown-900)', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
          IBM Plex Mono 500 — ₹9,87,65,432.10 — totals row
        </p>
      </Section>

      {/* ── COLOURS ── */}
      <Section title="2. Colour tokens">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {[
            ['--brown-900', '#4A3A34'],
            ['--brown-700', '#77574A'],
            ['--brown-500', '#A8836C'],
            ['--brown-300', '#D0AE92'],
            ['--brown-100', '#EBD7BE'],
            ['--cream',     '#F9F2E4'],
            ['--surface',   '#FFFFFF'],
            ['--posted',    '#5F7052'],
            ['--posted-bg', '#EDF1E8'],
            ['--warning',   '#C08A3E'],
            ['--warning-bg','#FBF1DF'],
            ['--danger',    '#9E4A38'],
            ['--danger-bg', '#F8EAE6'],
          ].map(([token, hex]) => (
            <div key={token} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 52, height: 52, borderRadius: 8, background: `var(${token})`, border: '1px solid var(--brown-300)' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--brown-700)' }}>{token}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--brown-500)' }}>{hex}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* ── MONEY ── */}
      <Section title="3. Money component">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Money value="1234567.89" />
          <Money value="200000.00" />
          <Money value="500.50" />
          <Money value="-9500.00" />
          <Money value="0.00" />
        </div>
      </Section>

      {/* ── STATUS BADGES ── */}
      <Section title="4. Status badges — all 8 states">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <StatusBadge status="draft" />
          <StatusBadge status="posted" />
          <StatusBadge status="confirmed" />
          <StatusBadge status="paid" />
          <StatusBadge status="partial" />
          <StatusBadge status="not_paid" />
          <StatusBadge status="cancelled" />
          <StatusBadge status="revised" />
        </div>
      </Section>

      {/* ── SMART BUTTONS ── */}
      <Section title="5. Smart buttons">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <SmartButton count={3}  label="Invoices" visible={true}  onClick={() => alert('Invoices')} />
          <SmartButton count={1}  label="Bills"    visible={true}  onClick={() => alert('Bills')} />
          <SmartButton count={0}  label="Payments" visible={false} onClick={() => alert('never')} />
        </div>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--brown-500)', marginTop: 8 }}>
          ↑ "Payments" (visible=false) renders nothing — inspect the DOM to confirm
        </p>
      </Section>

      {/* ── WARNINGS — SIDE BY SIDE ── */}
      <Section title="6. Warning components — MUST look obviously different">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div>
            <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, color: 'var(--brown-700)', marginBottom: 8 }}>
              BlockingWarning — solid red bar, action DISABLED
            </p>
            {showBlocking
              ? <BlockingWarning message="Debit and credit amounts do not match. Entry cannot be posted." />
              : <button onClick={() => setShowBlocking(true)} style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--brown-700)', background: 'none', border: '1px dashed var(--brown-300)', borderRadius: 4, padding: '4px 8px', cursor: 'pointer' }}>Show again</button>
            }
            <button
              disabled={showBlocking}
              style={{
                marginTop: 8,
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                padding: '8px 16px',
                background: 'var(--brown-900)',
                color: 'var(--cream)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                opacity: showBlocking ? 0.45 : 1,
                cursor: showBlocking ? 'not-allowed' : 'pointer',
              }}
            >
              Post Entry {showBlocking ? '(disabled)' : '(enabled)'}
            </button>
          </div>

          <div>
            <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, color: 'var(--brown-700)', marginBottom: 8 }}>
              NonBlockingWarning — dashed amber, action STAYS ENABLED
            </p>
            {showNonBlocking && (
              <NonBlockingWarning onDismiss={() => setShowNonBlocking(false)} />
            )}
            {!showNonBlocking && (
              <button onClick={() => setShowNonBlocking(true)} style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--brown-700)', background: 'none', border: '1px dashed var(--brown-300)', borderRadius: 4, padding: '4px 8px', cursor: 'pointer' }}>Show again</button>
            )}
            <button
              style={{
                marginTop: 8,
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                padding: '8px 16px',
                background: 'var(--brown-900)',
                color: 'var(--cream)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
              }}
            >
              Confirm Bill (always enabled)
            </button>
          </div>
        </div>
      </Section>

      {/* ── LIST VIEW ── */}
      <Section title="7. ListView">
        <ListView
          columns={LIST_COLS}
          data={SAMPLE_ROWS}
          onRowClick={row => alert(`Clicked: ${row.ref}`)}
          searchable
        />
      </Section>

      {/* ── LINE ITEM GRID ── */}
      <Section title="8. LineItemGrid (Tab across, Enter for new row)">
        <LineItemGrid
          columns={GRID_COLS}
          rows={gridRows}
          onChange={setGridRows}
          qtyKey="qty"
          unitPriceKey="unitPrice"
          totalKey="total"
        />
      </Section>

      {/* ── FORM VIEW ── */}
      <Section title="9. FormView — sticky button row">
        <FormView
          title="Vendor Bill — Bill/2026/0001"
          onNew={() => alert('New')}
          onConfirm={() => alert('Confirm')}
          confirmDisabled={showBlocking}
          onArchive={() => alert('Archive')}
          onHome={() => alert('Home')}
          onBack={() => alert('Back')}
          smartButtons={
            <>
              <SmartButton count={1} label="PO" visible={true} onClick={() => alert('PO')} />
              <SmartButton count={2} label="Payments" visible={true} onClick={() => alert('Payments')} />
            </>
          }
        >
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--brown-500)' }}>
            FormView wraps the form. Smart buttons appear in the header. Confirm is disabled because BlockingWarning is shown above.
          </p>
        </FormView>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 48 }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18, color: 'var(--brown-700)', marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid var(--brown-100)' }}>
        {title}
      </h2>
      {children}
    </section>
  );
}
