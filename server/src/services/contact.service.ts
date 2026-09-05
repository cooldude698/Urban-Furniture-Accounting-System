import { localDB } from '../db/db.js';
import { CreateContactInput, UpdateContactInput, Contact } from '../../../shared/schemas/contact.schema.js';
import { Decimal } from 'decimal.js';

export interface StatementLine {
  id: string;
  date: string;
  doc_number: string;
  reference: string;
  type: 'bill' | 'payment';
  debit: string;
  credit: string;
  running_balance: string;
}

export interface ContactStatement {
  contact: Contact;
  opening_balance: string;
  closing_balance: string;
  total_billed: string;
  total_paid: string;
  lines: StatementLine[];
}

export class ContactService {
  static getAll(includeArchived = false, type?: string): Contact[] {
    const contacts = localDB.getState().contacts;
    return contacts.filter(c => {
      if (!includeArchived && c.is_archived) return false;
      if (type && type !== 'all') {
        return c.type === type || c.type === 'both';
      }
      return true;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }

  static getById(id: number): Contact | null {
    const contact = localDB.getState().contacts.find(c => c.id === id);
    return contact || null;
  }

  static create(data: CreateContactInput): Contact {
    let createdContact: Contact;
    localDB.update(state => {
      const nextId = state.contacts.length > 0 ? Math.max(...state.contacts.map(c => c.id || 0)) + 1 : 1;
      createdContact = {
        id: nextId,
        name: data.name,
        type: data.type,
        email: data.email || '',
        mobile: data.mobile || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        pincode: data.pincode || '',
        image_path: data.image_path || null,
        gstin: data.gstin || '',
        is_archived: Boolean(data.is_archived),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      state.contacts.push(createdContact);

      state.audit_log.push({
        id: state.audit_log.length + 1,
        table_name: 'contacts',
        record_id: nextId,
        action: 'CREATE',
        new_data: JSON.stringify(createdContact),
        timestamp: new Date().toISOString(),
      });
    });

    return createdContact!;
  }

  static update(id: number, data: UpdateContactInput): Contact | null {
    let updatedContact: Contact | null = null;
    localDB.update(state => {
      const idx = state.contacts.findIndex(c => c.id === id);
      if (idx === -1) return;

      const oldData = state.contacts[idx];
      updatedContact = {
        ...oldData,
        ...data,
        updated_at: new Date().toISOString(),
      };
      state.contacts[idx] = updatedContact;

      state.audit_log.push({
        id: state.audit_log.length + 1,
        table_name: 'contacts',
        record_id: id,
        action: 'UPDATE',
        old_data: JSON.stringify(oldData),
        new_data: JSON.stringify(updatedContact),
        timestamp: new Date().toISOString(),
      });
    });

    return updatedContact;
  }

  static archive(id: number, isArchived = true): Contact | null {
    let updatedContact: Contact | null = null;
    localDB.update(state => {
      const idx = state.contacts.findIndex(c => c.id === id);
      if (idx === -1) return;

      const oldData = state.contacts[idx];
      updatedContact = {
        ...oldData,
        is_archived: isArchived,
        updated_at: new Date().toISOString(),
      };
      state.contacts[idx] = updatedContact;

      state.audit_log.push({
        id: state.audit_log.length + 1,
        table_name: 'contacts',
        record_id: id,
        action: isArchived ? 'ARCHIVE' : 'UNARCHIVE',
        old_data: JSON.stringify(oldData),
        new_data: JSON.stringify(updatedContact),
        timestamp: new Date().toISOString(),
      });
    });

    return updatedContact;
  }

  static updateImage(id: number, imagePath: string): Contact | null {
    let updatedContact: Contact | null = null;
    localDB.update(state => {
      const idx = state.contacts.findIndex(c => c.id === id);
      if (idx === -1) return;

      state.contacts[idx].image_path = imagePath;
      state.contacts[idx].updated_at = new Date().toISOString();
      updatedContact = state.contacts[idx];
    });

    return updatedContact;
  }

  static getSmartCounts(id: number) {
    const state = localDB.getState();
    const bills = state.vendor_bills.filter(b => b.vendor_id === id);
    const pos = state.purchase_orders.filter(p => p.vendor_id === id);

    let totalBilled = new Decimal('0');
    let totalPaid = new Decimal('0');
    let totalDue = new Decimal('0');

    bills.forEach(b => {
      const grandTotal = new Decimal(b.grand_total || b.total_amount || '0');
      const paid = new Decimal(b.amount_paid || '0');
      totalBilled = totalBilled.plus(grandTotal);
      totalPaid = totalPaid.plus(paid);
      totalDue = totalDue.plus(grandTotal.minus(paid));
    });

    return {
      billCount: bills.length,
      poCount: pos.length,
      confirmedBillCount: bills.filter(b => b.status === 'confirmed').length,
      totalBilled: totalBilled.toFixed(2),
      totalPaid: totalPaid.toFixed(2),
      totalDue: totalDue.toFixed(2),
    };
  }

  static getStatement(id: number): ContactStatement | null {
    const contact = this.getById(id);
    if (!contact) return null;

    const state = localDB.getState();
    const bills = state.vendor_bills
      .filter(b => b.vendor_id === id && b.status === 'confirmed')
      .map(b => ({
        id: `bill-${b.id}`,
        date: b.bill_date,
        doc_number: b.number,
        reference: b.bill_reference || 'Vendor Bill',
        type: 'bill' as const,
        amount: new Decimal(b.grand_total || b.total_amount || '0'),
        paid: new Decimal(b.amount_paid || '0'),
      }));

    // Sort chronologically
    const allEvents = [...bills].sort((a, b) => a.date.localeCompare(b.date));

    let runningBalance = new Decimal('0');
    let totalBilled = new Decimal('0');
    let totalPaid = new Decimal('0');

    const statementLines: StatementLine[] = [];

    for (const evt of allEvents) {
      if (evt.type === 'bill') {
        runningBalance = runningBalance.plus(evt.amount);
        totalBilled = totalBilled.plus(evt.amount);

        statementLines.push({
          id: evt.id,
          date: evt.date,
          doc_number: evt.doc_number,
          reference: evt.reference,
          type: 'bill',
          debit: evt.amount.toFixed(2),
          credit: '0.00',
          running_balance: runningBalance.toFixed(2),
        });

        // If part of the bill has been settled
        if (evt.paid.greaterThan(0)) {
          runningBalance = runningBalance.minus(evt.paid);
          totalPaid = totalPaid.plus(evt.paid);

          statementLines.push({
            id: `${evt.id}-pay`,
            date: evt.date,
            doc_number: `PAY/${evt.doc_number}`,
            reference: `Payment for ${evt.doc_number}`,
            type: 'payment',
            debit: '0.00',
            credit: evt.paid.toFixed(2),
            running_balance: runningBalance.toFixed(2),
          });
        }
      }
    }

    return {
      contact,
      opening_balance: '0.00',
      closing_balance: runningBalance.toFixed(2),
      total_billed: totalBilled.toFixed(2),
      total_paid: totalPaid.toFixed(2),
      lines: statementLines,
    };
  }
}
