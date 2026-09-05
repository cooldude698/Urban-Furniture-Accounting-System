import { localDB } from '../db/db.js';
import { CreateBillInput, UpdateBillInput, VendorBill, BillLine } from '../../../shared/schemas/vendorBill.schema.js';
import { SequenceService } from './sequence.service.js';
import { BudgetCheckService, BudgetCheckResult } from './budgetCheck.service.js';
import { PostingService } from './posting.service.js';
import { Decimal } from 'decimal.js';

export class VendorBillService {
  static getAll(): VendorBill[] {
    const bills = localDB.getState().vendor_bills;
    const contacts = localDB.getState().contacts;
    const lines = localDB.getState().vendor_bill_lines;
    const products = localDB.getState().products;
    const accounts = localDB.getState().accounts;
    const analytics = localDB.getState().analytic_accounts;

    return bills.map(b => {
      const vendor = contacts.find(c => c.id === b.vendor_id);
      const billLines = lines
        .filter(l => l.bill_id === b.id)
        .sort((a, b) => a.sr_no - b.sr_no)
        .map(l => {
          const product = products.find(p => p.id === l.product_id);
          const account = accounts.find(a => a.id === l.account_id);
          const analytic = analytics.find(a => a.id === l.analytic_account_id);
          return {
            ...l,
            product_name: product ? product.name : 'Unknown Product',
            account_name: account ? account.name : 'Purchase Expense',
            analytic_account_name: analytic ? analytic.name : null,
          };
        });

      const grandTotal = new Decimal(b.grand_total || b.total_amount || '0');
      const paid = new Decimal(b.amount_paid || '0');
      const due = grandTotal.minus(paid);

      let paymentStatus: 'paid' | 'partial' | 'not_paid' = 'not_paid';
      if (b.status === 'confirmed') {
        if (due.isZero() && grandTotal.greaterThan(0)) {
          paymentStatus = 'paid';
        } else if (paid.greaterThan(0) && due.greaterThan(0)) {
          paymentStatus = 'partial';
        }
      }

      return {
        ...b,
        vendor_name: vendor ? vendor.name : 'Unknown Vendor',
        amount_paid: paid.toFixed(2),
        amount_due: due.toFixed(2),
        payment_status: paymentStatus,
        lines: billLines,
      };
    }).sort((a, b) => (b.id || 0) - (a.id || 0));
  }

  static getById(id: number): VendorBill | null {
    const bill = localDB.getState().vendor_bills.find(b => b.id === id);
    if (!bill) return null;

    const vendor = localDB.getState().contacts.find(c => c.id === bill.vendor_id);
    const billLines = localDB.getState().vendor_bill_lines
      .filter(l => l.bill_id === bill.id)
      .sort((a, b) => a.sr_no - b.sr_no)
      .map(l => {
        const product = localDB.getState().products.find(p => p.id === l.product_id);
        const account = localDB.getState().accounts.find(a => a.id === l.account_id);
        const analytic = localDB.getState().analytic_accounts.find(a => a.id === l.analytic_account_id);
        return {
          ...l,
          product_name: product ? product.name : 'Unknown Product',
          account_name: account ? account.name : 'Purchase Expense',
          analytic_account_name: analytic ? analytic.name : null,
        };
      });

    const grandTotal = new Decimal(bill.grand_total || bill.total_amount || '0');
    const paid = new Decimal(bill.amount_paid || '0');
    const due = grandTotal.minus(paid);

    let paymentStatus: 'paid' | 'partial' | 'not_paid' = 'not_paid';
    if (bill.status === 'confirmed') {
      if (due.isZero() && grandTotal.greaterThan(0)) {
        paymentStatus = 'paid';
      } else if (paid.greaterThan(0) && due.greaterThan(0)) {
        paymentStatus = 'partial';
      }
    }

    return {
      ...bill,
      vendor_name: vendor ? vendor.name : 'Unknown Vendor',
      amount_paid: paid.toFixed(2),
      amount_due: due.toFixed(2),
      payment_status: paymentStatus,
      lines: billLines,
    };
  }

  static create(data: CreateBillInput): VendorBill {
    const docNumber = SequenceService.nextDocNumber('BILL');
    let subtotalSum = new Decimal('0');
    let taxSum = new Decimal('0');

    const calculatedLines = data.lines.map((l, index) => {
      const unitPrice = new Decimal(l.unit_price || '0').toFixed(2);
      const taxRate = new Decimal(l.tax_rate || '0').toFixed(2);
      const subtotal = new Decimal(l.qty).times(new Decimal(unitPrice)).toFixed(2);
      const taxAmount = new Decimal(subtotal).times(new Decimal(taxRate)).dividedBy(100).toFixed(2);
      const total = new Decimal(subtotal).plus(new Decimal(taxAmount)).toFixed(2);

      subtotalSum = subtotalSum.plus(new Decimal(subtotal));
      taxSum = taxSum.plus(new Decimal(taxAmount));

      return {
        sr_no: index + 1,
        product_id: l.product_id,
        account_id: l.account_id || 6,
        analytic_account_id: l.analytic_account_id || null,
        qty: l.qty,
        unit_price: unitPrice,
        tax_rate: taxRate,
        subtotal,
        tax_amount: taxAmount,
        total,
      };
    });

    const grandTotal = subtotalSum.plus(taxSum).toFixed(2);
    let createdBill: VendorBill;

    localDB.update(state => {
      const nextBillId = state.vendor_bills.length > 0 ? Math.max(...state.vendor_bills.map(b => b.id || 0)) + 1 : 1;

      createdBill = {
        id: nextBillId,
        number: docNumber,
        bill_reference: data.bill_reference || '',
        po_id: data.po_id || null,
        vendor_id: data.vendor_id,
        bill_date: data.bill_date,
        due_date: data.due_date,
        status: 'draft',
        total_amount: subtotalSum.toFixed(2),
        tax_amount: taxSum.toFixed(2),
        grand_total: grandTotal,
        amount_paid: '0.00',
        amount_due: grandTotal,
        payment_status: 'not_paid',
        paid_via_cash: '0.00',
        paid_via_bank: '0.00',
        journal_entry_id: null,
        lines: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      state.vendor_bills.push(createdBill);

      calculatedLines.forEach((cl, idx) => {
        const nextLineId = state.vendor_bill_lines.length > 0 ? Math.max(...state.vendor_bill_lines.map(l => l.id || 0)) + 1 : 1;
        state.vendor_bill_lines.push({
          id: nextLineId + idx,
          bill_id: nextBillId,
          ...cl,
        });
      });

      state.audit_log.push({
        id: state.audit_log.length + 1,
        table_name: 'vendor_bills',
        record_id: nextBillId,
        action: 'CREATE_BILL',
        new_data: JSON.stringify({ bill: createdBill, lines: calculatedLines }),
        timestamp: new Date().toISOString(),
      });
    });

    return this.getById(createdBill!.id!)!;
  }

  static confirm(id: number): { bill: VendorBill; budgetCheck: BudgetCheckResult } | null {
    const bill = this.getById(id);
    if (!bill || bill.status !== 'draft') return null;

    // 1. Budget check
    const budgetCheck = BudgetCheckService.checkBudgetOverrun(bill.lines);

    // 2. Post to ledger via postingService
    const { entryId } = PostingService.postDocument('bill', id);

    // 3. Stock moves for physical goods
    localDB.update(state => {
      const idx = state.vendor_bills.findIndex(b => b.id === id);
      if (idx === -1) return;

      state.vendor_bills[idx].status = 'confirmed';
      state.vendor_bills[idx].journal_entry_id = entryId;
      state.vendor_bills[idx].updated_at = new Date().toISOString();

      // Insert stock moves for goods products (+qty)
      const lines = state.vendor_bill_lines.filter(l => l.bill_id === id);
      for (const line of lines) {
        const prod = state.products.find(p => p.id === line.product_id);
        if (prod && (prod.type === 'goods' || prod.type === 'combo')) {
          const nextSmId = state.stock_moves.length > 0 ? Math.max(...state.stock_moves.map(m => m.id || 0)) + 1 : 1;
          state.stock_moves.push({
            id: nextSmId,
            product_id: line.product_id,
            qty_change: line.qty,
            reference: `Vendor Bill ${bill.number}`,
            created_at: new Date().toISOString(),
          });
          prod.stock_qty = (prod.stock_qty || 0) + line.qty;
        }
      }

      state.audit_log.push({
        id: state.audit_log.length + 1,
        table_name: 'vendor_bills',
        record_id: id,
        action: 'CONFIRM_BILL',
        new_data: JSON.stringify({ status: 'confirmed', journal_entry_id: entryId }),
        timestamp: new Date().toISOString(),
      });
    });

    return {
      bill: this.getById(id)!,
      budgetCheck,
    };
  }

  static cancel(id: number): VendorBill | null {
    const bill = this.getById(id);
    if (!bill) return null;

    localDB.update(state => {
      const idx = state.vendor_bills.findIndex(b => b.id === id);
      if (idx === -1) return;

      state.vendor_bills[idx].status = 'cancelled';
      state.vendor_bills[idx].updated_at = new Date().toISOString();

      state.audit_log.push({
        id: state.audit_log.length + 1,
        table_name: 'vendor_bills',
        record_id: id,
        action: 'CANCEL_BILL',
        timestamp: new Date().toISOString(),
      });
    });

    return this.getById(id);
  }
}
