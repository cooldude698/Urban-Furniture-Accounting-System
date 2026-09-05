import { localDB } from '../db/db.js';
import { CreatePOInput, UpdatePOInput, PurchaseOrder, POLine } from '../../../shared/schemas/purchaseOrder.schema.js';
import { SequenceService } from './sequence.service.js';
import { BudgetCheckService, BudgetCheckResult } from './budgetCheck.service.js';
import { ProductService } from './product.service.js';
import { Decimal } from 'decimal.js';

export class PurchaseOrderService {
  static getAll(): PurchaseOrder[] {
    const pos = localDB.getState().purchase_orders;
    const contacts = localDB.getState().contacts;
    const lines = localDB.getState().purchase_order_lines;
    const products = localDB.getState().products;
    const analytics = localDB.getState().analytic_accounts;

    return pos.map(po => {
      const vendor = contacts.find(c => c.id === po.vendor_id);
      const poLines = lines
        .filter(l => l.po_id === po.id)
        .sort((a, b) => a.sr_no - b.sr_no)
        .map(l => {
          const product = products.find(p => p.id === l.product_id);
          const analytic = analytics.find(a => a.id === l.analytic_account_id);
          return {
            ...l,
            product_name: product ? product.name : 'Unknown Product',
            analytic_account_name: analytic ? analytic.name : null,
          };
        });

      return {
        ...po,
        vendor_name: vendor ? vendor.name : 'Unknown Vendor',
        lines: poLines,
      };
    }).sort((a, b) => (b.id || 0) - (a.id || 0));
  }

  static getById(id: number): PurchaseOrder | null {
    const po = localDB.getState().purchase_orders.find(p => p.id === id);
    if (!po) return null;

    const vendor = localDB.getState().contacts.find(c => c.id === po.vendor_id);
    const lines = localDB.getState().purchase_order_lines
      .filter(l => l.po_id === po.id)
      .sort((a, b) => a.sr_no - b.sr_no)
      .map(l => {
        const product = localDB.getState().products.find(p => p.id === l.product_id);
        const analytic = localDB.getState().analytic_accounts.find(a => a.id === l.analytic_account_id);
        return {
          ...l,
          product_name: product ? product.name : 'Unknown Product',
          analytic_account_name: analytic ? analytic.name : null,
        };
      });

    return {
      ...po,
      vendor_name: vendor ? vendor.name : 'Unknown Vendor',
      lines,
    };
  }

  static create(data: CreatePOInput): PurchaseOrder {
    const docNumber = SequenceService.nextDocNumber('PO');
    let grandTotal = new Decimal('0');

    const calculatedLines = data.lines.map((l, index) => {
      const unitPrice = new Decimal(l.unit_price || '0').toFixed(2);
      const lineTotal = new Decimal(l.qty).times(new Decimal(unitPrice)).toFixed(2);
      grandTotal = grandTotal.plus(new Decimal(lineTotal));
      return {
        sr_no: index + 1,
        product_id: l.product_id,
        analytic_account_id: l.analytic_account_id || null,
        qty: l.qty,
        unit_price: unitPrice,
        total: lineTotal,
      };
    });

    let createdPO: PurchaseOrder;

    localDB.update(state => {
      const nextPoId = state.purchase_orders.length > 0 ? Math.max(...state.purchase_orders.map(p => p.id || 0)) + 1 : 1;

      createdPO = {
        id: nextPoId,
        number: docNumber,
        vendor_id: data.vendor_id,
        po_date: data.po_date,
        status: 'draft',
        total_amount: grandTotal.toFixed(2),
        lines: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      state.purchase_orders.push(createdPO);

      calculatedLines.forEach((cl, idx) => {
        const nextLineId = state.purchase_order_lines.length > 0 ? Math.max(...state.purchase_order_lines.map(l => l.id || 0)) + 1 : 1;
        state.purchase_order_lines.push({
          id: nextLineId + idx,
          po_id: nextPoId,
          ...cl,
        });
      });

      // Audit log
      state.audit_log.push({
        id: state.audit_log.length + 1,
        table_name: 'purchase_orders',
        record_id: nextPoId,
        action: 'CREATE_PO',
        new_data: JSON.stringify({ po: createdPO, lines: calculatedLines }),
        timestamp: new Date().toISOString(),
      });
    });

    return this.getById(createdPO!.id!)!;
  }

  static update(id: number, data: UpdatePOInput): PurchaseOrder | null {
    const existing = this.getById(id);
    if (!existing || existing.status !== 'draft') return null;

    let grandTotal = new Decimal('0');
    let calculatedLines = existing.lines;

    if (data.lines) {
      calculatedLines = data.lines.map((l, index) => {
        const unitPrice = new Decimal(l.unit_price || '0').toFixed(2);
        const lineTotal = new Decimal(l.qty).times(new Decimal(unitPrice)).toFixed(2);
        grandTotal = grandTotal.plus(new Decimal(lineTotal));
        return {
          id: l.product_id,
          po_id: id,
          sr_no: index + 1,
          product_id: l.product_id,
          analytic_account_id: l.analytic_account_id || null,
          qty: l.qty,
          unit_price: unitPrice,
          total: lineTotal,
        };
      });
    } else {
      grandTotal = new Decimal(existing.total_amount);
    }

    localDB.update(state => {
      const idx = state.purchase_orders.findIndex(p => p.id === id);
      if (idx === -1) return;

      state.purchase_orders[idx] = {
        ...state.purchase_orders[idx],
        vendor_id: data.vendor_id || existing.vendor_id,
        po_date: data.po_date || existing.po_date,
        total_amount: grandTotal.toFixed(2),
        updated_at: new Date().toISOString(),
      };

      if (data.lines) {
        state.purchase_order_lines = state.purchase_order_lines.filter(l => l.po_id !== id);
        calculatedLines.forEach((cl, idx) => {
          const nextLineId = state.purchase_order_lines.length > 0 ? Math.max(...state.purchase_order_lines.map(l => l.id || 0)) + 1 : 1;
          state.purchase_order_lines.push({
            id: nextLineId + idx,
            po_id: id,
            ...cl,
          });
        });
      }

      state.audit_log.push({
        id: state.audit_log.length + 1,
        table_name: 'purchase_orders',
        record_id: id,
        action: 'UPDATE_PO',
        old_data: JSON.stringify(existing),
        new_data: JSON.stringify(state.purchase_orders[idx]),
        timestamp: new Date().toISOString(),
      });
    });

    return this.getById(id);
  }

  static confirm(id: number): { po: PurchaseOrder; budgetCheck: BudgetCheckResult } | null {
    const po = this.getById(id);
    if (!po) return null;

    // Check budget overrun for lines with analytic accounts
    const budgetCheck = BudgetCheckService.checkBudgetOverrun(po.lines);

    // Check pricing warnings (Below-cost or MRP ceiling)
    const priceWarnings: string[] = [];
    for (const line of po.lines) {
      const pWarn = ProductService.checkPricingWarnings(line.product_id, line.unit_price);
      if (pWarn) priceWarnings.push(pWarn);
    }

    if (priceWarnings.length > 0) {
      budgetCheck.hasWarning = true;
      const combined = [budgetCheck.warningMessage, ...priceWarnings].filter(Boolean).join(' | ');
      budgetCheck.warningMessage = combined;
    }

    // Confirm the PO — Status changes to 'confirmed'
    // HARD RULE: Zero ledger movement / NO journal entries created on PO confirm
    localDB.update(state => {
      const idx = state.purchase_orders.findIndex(p => p.id === id);
      if (idx === -1) return;

      state.purchase_orders[idx].status = 'confirmed';
      state.purchase_orders[idx].updated_at = new Date().toISOString();

      state.audit_log.push({
        id: state.audit_log.length + 1,
        table_name: 'purchase_orders',
        record_id: id,
        action: 'CONFIRM_PO',
        new_data: JSON.stringify({ status: 'confirmed', hasBudgetWarning: budgetCheck.hasWarning }),
        timestamp: new Date().toISOString(),
      });
    });

    return {
      po: this.getById(id)!,
      budgetCheck,
    };
  }

  static cancel(id: number): PurchaseOrder | null {
    const po = this.getById(id);
    if (!po) return null;

    localDB.update(state => {
      const idx = state.purchase_orders.findIndex(p => p.id === id);
      if (idx === -1) return;

      state.purchase_orders[idx].status = 'cancelled';
      state.purchase_orders[idx].updated_at = new Date().toISOString();

      state.audit_log.push({
        id: state.audit_log.length + 1,
        table_name: 'purchase_orders',
        record_id: id,
        action: 'CANCEL_PO',
        timestamp: new Date().toISOString(),
      });
    });

    return this.getById(id);
  }

  static createBillFromPO(poId: number): any {
    const po = this.getById(poId);
    if (!po) throw new Error('Purchase Order not found');

    const billNumber = SequenceService.nextDocNumber('BILL');
    let grandTotal = new Decimal('0');

    const billLines = po.lines.map((pol, idx) => {
      const product = localDB.getState().products.find(p => p.id === pol.product_id);
      const taxRate = product ? product.tax_rate : '18.00';
      const lineTotal = new Decimal(pol.total || '0').toFixed(2);
      grandTotal = grandTotal.plus(new Decimal(lineTotal));

      return {
        sr_no: idx + 1,
        product_id: pol.product_id,
        account_id: 6, // Default to Purchase Expense
        analytic_account_id: pol.analytic_account_id || null,
        qty: pol.qty,
        unit_price: pol.unit_price,
        tax_rate: taxRate,
        total: lineTotal,
      };
    });

    let createdBill: any;

    localDB.update(state => {
      const nextBillId = state.vendor_bills.length > 0 ? Math.max(...state.vendor_bills.map(b => b.id || 0)) + 1 : 1;

      createdBill = {
        id: nextBillId,
        number: billNumber,
        bill_reference: '',
        po_id: po.id,
        vendor_id: po.vendor_id,
        bill_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'draft',
        total_amount: grandTotal.toFixed(2),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      state.vendor_bills.push(createdBill);

      billLines.forEach((bl, idx) => {
        const nextLineId = state.vendor_bill_lines.length > 0 ? Math.max(...state.vendor_bill_lines.map(l => l.id || 0)) + 1 : 1;
        state.vendor_bill_lines.push({
          id: nextLineId + idx,
          bill_id: nextBillId,
          ...bl,
        });
      });

      state.audit_log.push({
        id: state.audit_log.length + 1,
        table_name: 'vendor_bills',
        record_id: nextBillId,
        action: 'CREATE_BILL_FROM_PO',
        new_data: JSON.stringify({ bill: createdBill, po_id: po.id }),
        timestamp: new Date().toISOString(),
      });
    });

    return createdBill;
  }
}
