import { localDB } from '../db/db.js';
import { CreateAnalyticAccountInput, UpdateAnalyticAccountInput, AnalyticAccount } from '../../../shared/schemas/analytic.schema.js';

export class AnalyticService {
  static getAll(includeArchived = false, type?: string): AnalyticAccount[] {
    const analytics = localDB.getState().analytic_accounts;
    return analytics.filter(a => {
      if (!includeArchived && a.is_archived) return false;
      if (type && type !== 'all' && a.type !== type) return false;
      return true;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }

  static getById(id: number): AnalyticAccount | null {
    const item = localDB.getState().analytic_accounts.find(a => a.id === id);
    return item || null;
  }

  static create(data: CreateAnalyticAccountInput): AnalyticAccount {
    let created: AnalyticAccount;
    localDB.update(state => {
      const nextId = state.analytic_accounts.length > 0 ? Math.max(...state.analytic_accounts.map(a => a.id || 0)) + 1 : 1;
      created = {
        id: nextId,
        name: data.name,
        type: data.type,
        description: data.description || '',
        is_archived: Boolean(data.is_archived),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      state.analytic_accounts.push(created);

      state.audit_log.push({
        id: state.audit_log.length + 1,
        table_name: 'analytic_accounts',
        record_id: nextId,
        action: 'CREATE',
        new_data: JSON.stringify(created),
        timestamp: new Date().toISOString(),
      });
    });

    return created!;
  }

  static update(id: number, data: UpdateAnalyticAccountInput): AnalyticAccount | null {
    let updated: AnalyticAccount | null = null;
    localDB.update(state => {
      const idx = state.analytic_accounts.findIndex(a => a.id === id);
      if (idx === -1) return;

      const existing = state.analytic_accounts[idx];
      updated = {
        ...existing,
        ...data,
        updated_at: new Date().toISOString(),
      };
      state.analytic_accounts[idx] = updated;

      state.audit_log.push({
        id: state.audit_log.length + 1,
        table_name: 'analytic_accounts',
        record_id: id,
        action: 'UPDATE',
        old_data: JSON.stringify(existing),
        new_data: JSON.stringify(updated),
        timestamp: new Date().toISOString(),
      });
    });

    return updated;
  }

  static archive(id: number, isArchived = true): AnalyticAccount | null {
    let updated: AnalyticAccount | null = null;
    localDB.update(state => {
      const idx = state.analytic_accounts.findIndex(a => a.id === id);
      if (idx === -1) return;

      const existing = state.analytic_accounts[idx];
      updated = {
        ...existing,
        is_archived: isArchived,
        updated_at: new Date().toISOString(),
      };
      state.analytic_accounts[idx] = updated;

      state.audit_log.push({
        id: state.audit_log.length + 1,
        table_name: 'analytic_accounts',
        record_id: id,
        action: isArchived ? 'ARCHIVE' : 'UNARCHIVE',
        old_data: JSON.stringify(existing),
        new_data: JSON.stringify(updated),
        timestamp: new Date().toISOString(),
      });
    });

    return updated;
  }
}
