export interface UserPayload {
  id: number;
  login_id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'accountant' | 'manager' | 'contact';
  contact_id: number | null;
}

export type ScopedResource =
  | 'invoice'
  | 'bill'
  | 'sales_order'
  | 'purchase_order'
  | 'payment'
  | 'journal_entry'
  | 'audit_log'
  | 'financial_kpi'
  | 'financial_report'
  | string;

/**
 * Record-rule scoping layer: rewrites data queries at the data layer.
 * admin: Unrestricted across all tables and financial logs.
 * accountant: Unrestricted across invoices, bills, journal entries, ledgers; restricted from system audit logs.
 * manager: Operational access (orders, inventory, catalog); redacted/restricted from raw journal entries, audit logs, and bank/profit KPIs.
 * contact: Strictly customer portal records { customerId: user.contactId }.
 */
export function scopeFor(
  user: UserPayload,
  resource?: ScopedResource
): Record<string, any> {
  // Admin is fully unrestricted
  if (user.role === 'admin') {
    return {};
  }

  // Contact (Customer portal)
  if (user.role === 'contact') {
    if (resource === 'journal_entry' || resource === 'audit_log' || resource === 'financial_kpi' || resource === 'financial_report') {
      return { allowed: false, customerId: user.contact_id, reason: 'CONTACTS_RESTRICTED_FROM_INTERNAL_RECORDS' };
    }
    return { customerId: user.contact_id };
  }

  // Accountant
  if (user.role === 'accountant') {
    if (resource === 'audit_log') {
      return { allowed: false, reason: 'AUDIT_LOG_RESTRICTED_TO_ADMIN' };
    }
    return {};
  }

  // Manager (Operational isolate)
  if (user.role === 'manager') {
    if (resource === 'journal_entry') {
      return { allowed: false, reason: 'MANAGERS_RESTRICTED_FROM_RAW_JOURNAL_ENTRIES' };
    }
    if (resource === 'audit_log') {
      return { allowed: false, reason: 'AUDIT_LOG_RESTRICTED_TO_ADMIN' };
    }
    if (resource === 'financial_kpi' || resource === 'financial_report') {
      return { redacted: true, hideFinancials: true };
    }
    // Operational orders, invoices, products are accessible
    return {};
  }

  return { customerId: -1 };
}
