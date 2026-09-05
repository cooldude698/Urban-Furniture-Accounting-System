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
  | string;

/**
 * Record-rule scoping layer: rewrites data queries at the data layer.
 * admin | accountant | manager -> {} (all records)
 * contact                     -> { customerId: user.contactId } (scoped to their partner)
 */
export function scopeFor(
  user: UserPayload,
  _resource?: ScopedResource
): Record<string, any> {
  if (user.role === 'admin' || user.role === 'accountant' || user.role === 'manager') {
    return {};
  }
  if (user.role === 'contact') {
    return { customerId: user.contact_id };
  }
  return { customerId: -1 };
}
