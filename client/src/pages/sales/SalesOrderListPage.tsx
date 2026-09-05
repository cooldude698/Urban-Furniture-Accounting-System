import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { StatusBadge } from '../../components/StatusBadge';
import { SalesOrderDTO } from '@shared/schemas/salesOrder';

export interface SalesOrderListPageProps {
  onSelectOrder?: (id: number) => void;
  onNewOrder?: () => void;
}

export const SalesOrderListPage: React.FC<SalesOrderListPageProps> = ({ onSelectOrder, onNewOrder }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState<SalesOrderDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<string>(searchParams.get('status') || 'all');

  useEffect(() => {
    const param = searchParams.get('status');
    if (param) setFilterStatus(param);
  }, [searchParams]);

  useEffect(() => {
    fetch('/api/sales-orders')
      .then(res => res.json())
      .then(json => {
        if (json.data) setOrders(json.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = orders.filter(o => {
    if (filterStatus === 'all') return true;
    return o.status === filterStatus;
  });

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display text-brown-900">Sales Orders</h1>
          <p className="text-sm text-brown-700">Commercial intent orders before customer billing</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-surface border border-brown-300 rounded-[6px] px-3 py-1.5 text-sm text-brown-900 focus:ring-2 focus:ring-brown-700 outline-none shadow-sm"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button
            onClick={() => onNewOrder ? onNewOrder() : navigate('/sales/orders/new')}
            className="bg-brown-900 text-cream px-4 py-2 rounded-[6px] text-sm font-semibold hover:bg-brown-700 transition-colors shadow-sm"
          >
            + New Order
          </button>
        </div>
      </div>

      <div className="bg-surface border border-brown-300 rounded-[10px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-brown-100 text-brown-900 font-semibold border-b border-brown-300">
                <th className="p-3.5">SO Number</th>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right font-mono-num">Tax</th>
                <th className="p-3.5 text-right font-mono-num">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brown-100/70">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-brown-500">
                    Loading sales orders...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-brown-500">
                    No sales orders found. Click <strong>+ New Order</strong> to create one.
                  </td>
                </tr>
              ) : (
                filtered.map(order => (
                  <tr
                    key={order.id}
                    onClick={() => onSelectOrder ? onSelectOrder(order.id) : navigate(`/sales/orders/${order.id}`)}
                    className="hover:bg-brown-100/40 cursor-pointer transition-colors"
                  >
                    <td className="p-3.5 font-semibold text-brown-900">{order.number}</td>
                    <td className="p-3.5 text-brown-700">{order.customerName || `Customer #${order.customerId}`}</td>
                    <td className="p-3.5 text-brown-500">{order.orderDate}</td>
                    <td className="p-3.5">
                      <StatusBadge status={order.status as any} />
                    </td>
                    <td className="p-3.5 text-right font-mono-num text-brown-700">₹{order.taxAmount}</td>
                    <td className="p-3.5 text-right font-mono-num font-bold text-brown-900">₹{order.totalAmount}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default SalesOrderListPage;
