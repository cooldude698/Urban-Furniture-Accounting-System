import React, { useState, useEffect } from 'react';
import { FormButtons } from '../components/FormButtons';
import { StatusBadge } from '../components/StatusBadge';
import { LineItemGrid, GridLine } from '../components/LineItemGrid';
import { BlockingWarning, NonBlockingWarning } from '../components/Warnings';
import { SalesOrderDTO } from '../../../shared/schemas/salesOrder';

interface SalesOrderFormProps {
  orderId?: number | null;
  onBack: () => void;
  onNavigateToInvoice?: (invoiceId: number) => void;
}

export const SalesOrderForm: React.FC<SalesOrderFormProps> = ({
  orderId,
  onBack,
  onNavigateToInvoice,
}) => {
  const [order, setOrder] = useState<SalesOrderDTO | null>(null);
  const [customerId, setCustomerId] = useState<number>(0);
  const [orderDate, setOrderDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [lines, setLines] = useState<GridLine[]>([]);
  const [contacts, setContacts] = useState<Array<{ id: number; name: string; email: string }>>([]);
  const [products, setProducts] = useState<Array<{ id: number; name: string; sku: string; sales_price: string; tax_rate: string }>>([]);
  const [analytics, setAnalytics] = useState<Array<{ id: number; name: string }>>([]);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  // Load dropdown data
  useEffect(() => {
    fetch('/api/contacts?type=customer')
      .then(res => res.json())
      .then(json => {
        if (json.data) setContacts(json.data);
      })
      .catch(() => {});

    fetch('/api/products')
      .then(res => res.json())
      .then(json => {
        if (json.data) setProducts(json.data);
      })
      .catch(() => {});

    fetch('/api/analytic-accounts')
      .then(res => res.json())
      .then(json => {
        if (json.data) setAnalytics(json.data);
      })
      .catch(() => {});
  }, []);

  // Load existing order if orderId provided
  useEffect(() => {
    if (orderId) {
      setLoading(true);
      fetch(`/api/sales-orders/${orderId}`)
        .then(res => res.json())
        .then(json => {
          if (json.data) {
            const o: SalesOrderDTO = json.data;
            setOrder(o);
            setCustomerId(o.customerId);
            setOrderDate(o.orderDate);
            setLines(o.lines.map(l => ({
              productId: l.productId,
              analyticAccountId: l.analyticAccountId || null,
              qty: l.qty,
              unitPrice: l.unitPrice,
              taxRate: l.taxRate,
              taxAmount: l.taxAmount,
              subtotal: l.subtotal,
              total: l.total,
            })));
          } else if (json.error) {
            setError(json.error.message);
          }
        })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      // New form initialization
      setOrder(null);
      setCustomerId(0);
      setOrderDate(new Date().toISOString().split('T')[0]);
      setLines([
        {
          productId: 0,
          analyticAccountId: null,
          qty: '1',
          unitPrice: '0.00',
          taxRate: '18.00',
        },
      ]);
    }
  }, [orderId]);

  const handleSaveDraft = async () => {
    if (!customerId) {
      setError('Please select a customer.');
      return;
    }
    if (lines.length === 0 || lines.some(l => !l.productId || Number(l.qty) <= 0)) {
      setError('Please provide valid products and quantities for all lines.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/sales-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          orderDate,
          lines,
        }),
      });
      const json = await res.json();
      if (json.data) {
        setOrder(json.data);
        setInfoMsg(`Sales Order ${json.data.number} created as Draft.`);
      } else {
        setError(json.error?.message || 'Failed to save Sales Order');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!order?.id) {
      // Auto-save then confirm
      await handleSaveDraft();
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/sales-orders/${order.id}/confirm`, {
        method: 'POST',
      });
      const json = await res.json();
      if (json.data) {
        setOrder(json.data);
        setInfoMsg(`Sales Order ${json.data.number} Confirmed! (Zero journal entries posted)`);
      } else {
        setError(json.error?.message || 'Failed to confirm Sales Order');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = async () => {
    if (!order?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/sales-orders/${order.id}/create-invoice`, {
        method: 'POST',
      });
      const json = await res.json();
      if (json.data) {
        setInfoMsg(`Customer Invoice ${json.data.number} successfully created!`);
        if (onNavigateToInvoice) {
          onNavigateToInvoice(json.data.id);
        }
      } else {
        setError(json.error?.message || 'Failed to create Customer Invoice');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isConfirmed = order?.status === 'confirmed';
  const isDraft = !order || order.status === 'draft';

  return (
    <div className="max-w-5xl mx-auto pb-16">
      {/* Sticky Button Row */}
      <FormButtons
        onBack={onBack}
        onNew={() => {
          setOrder(null);
          setCustomerId(0);
          setOrderDate(new Date().toISOString().split('T')[0]);
          setLines([{ productId: 0, analyticAccountId: null, qty: '1', unitPrice: '0.00', taxRate: '18.00' }]);
          setError(null);
          setInfoMsg(null);
        }}
        onConfirm={isDraft ? handleConfirm : undefined}
        onCreateInvoice={isConfirmed ? handleCreateInvoice : undefined}
        canConfirm={lines.length > 0}
        canCreateInvoice={isConfirmed}
        isConfirmed={isConfirmed}
        isLoading={loading}
      />

      <div className="px-6">
        {/* Warnings / Alerts */}
        {error && <BlockingWarning message={error} />}
        {infoMsg && (
          <div className="p-4 bg-posted-bg border border-posted/30 text-posted rounded-md mb-4 text-sm font-medium">
            ✓ {infoMsg}
          </div>
        )}

        {/* Document Header Card */}
        <div className="bg-surface border border-brown-300 rounded-[10px] p-6 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-brown-100 gap-4">
            <div>
              <span className="text-xs font-semibold text-brown-500 uppercase tracking-wider">Sales Order</span>
              <h1 className="text-2xl font-bold font-display text-brown-900 mt-1">
                {order ? order.number : 'New Draft Order'}
              </h1>
            </div>
            <StatusBadge status={order?.status || 'Draft'} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Customer Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brown-700 mb-1.5">
                Customer Name *
              </label>
              <select
                disabled={isConfirmed}
                value={customerId}
                onChange={e => setCustomerId(Number(e.target.value))}
                className="w-full bg-surface border border-brown-300 rounded-[6px] px-3 py-2 text-brown-900 focus:ring-2 focus:ring-brown-700 outline-none text-sm"
              >
                <option value={0} disabled>Select Customer...</option>
                {contacts.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.email ? `(${c.email})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Order Date */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brown-700 mb-1.5">
                SO Date *
              </label>
              <input
                type="date"
                disabled={isConfirmed}
                value={orderDate}
                onChange={e => setOrderDate(e.target.value)}
                className="w-full bg-surface border border-brown-300 rounded-[6px] px-3 py-2 text-brown-900 focus:ring-2 focus:ring-brown-700 outline-none text-sm"
              />
            </div>
          </div>
        </div>

        {/* Line Items Grid */}
        <div className="mb-6">
          <h2 className="text-base font-bold font-display text-brown-900 mb-2">Order Line Items</h2>
          <LineItemGrid
            lines={lines}
            products={products}
            analytics={analytics}
            onChange={setLines}
            disabled={isConfirmed}
          />
        </div>
      </div>
    </div>
  );
};
