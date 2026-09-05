import React, { useState, useEffect } from 'react';
import { ListView, Column } from '../../components/ui/ListView';
import { VendorBillsApi } from '../../api/vendorBills.api';
import { VendorBill } from '@shared/schemas/vendorBill.schema';
import { StatusBadge } from '../../components/StatusBadge';
import { Money } from '../../components/Money';
import { FileText, Building2 } from 'lucide-react';

interface VendorBillListPageProps {
  onSelectBill: (id: number) => void;
  onNewBill: () => void;
}

export const VendorBillListPage: React.FC<VendorBillListPageProps> = ({ onSelectBill, onNewBill }) => {
  const [bills, setBills] = useState<VendorBill[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const data = await VendorBillsApi.getAll();
      setBills(data);
    } catch (err) {
      console.error('Failed to load vendor bills', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const columns: Column<VendorBill>[] = [
    {
      key: 'number',
      header: 'Bill No.',
      className: 'font-mono text-xs font-semibold text-brown-700 w-32',
    },
    {
      key: 'bill_reference',
      header: 'Vendor Ref',
      className: 'text-xs text-brown-500 font-mono',
      render: b => b.bill_reference || '—',
    },
    {
      key: 'vendor_name',
      header: 'Vendor',
      render: b => (
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-brown-400" />
          <span className="font-semibold text-brown-900">{b.vendor_name}</span>
        </div>
      ),
    },
    {
      key: 'bill_date',
      header: 'Bill Date',
      className: 'text-sm text-brown-600',
    },
    {
      key: 'due_date',
      header: 'Due Date',
      className: 'text-sm text-brown-600',
    },
    {
      key: 'grand_total',
      header: 'Total Amount',
      align: 'right',
      render: b => <Money amount={b.grand_total || b.total_amount} className="font-bold text-brown-900" />,
    },
    {
      key: 'amount_due',
      header: 'Amount Due',
      align: 'right',
      render: b => <Money amount={b.amount_due} className="text-amber-800 font-medium" />,
    },
    {
      key: 'payment_status',
      header: 'Payment',
      align: 'center',
      render: b => <StatusBadge status={b.payment_status} />,
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: b => <StatusBadge status={b.status} />,
    },
  ];

  return (
    <ListView
      title="Vendor Bills"
      subtitle="Invoices received from vendors impacting accounts payable & stock"
      columns={columns}
      data={bills}
      loading={loading}
      onRowClick={b => b.id && onSelectBill(b.id)}
      onNew={onNewBill}
      includeArchived={false}
      onToggleArchived={() => {}}
    />
  );
};
