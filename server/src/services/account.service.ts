import { localDB } from '../db/db.js';
import { CreateAccountInput, UpdateAccountInput, Account, CreateJournalInput, UpdateJournalInput, Journal } from '../../../shared/schemas/account.schema.js';

export class AccountService {
  // Accounts CRUD
  static getAllAccounts(includeArchived = false, type?: string): Account[] {
    const accounts = localDB.getState().accounts;
    return accounts.filter(a => {
      if (!includeArchived && a.is_archived) return false;
      if (type && type !== 'all' && a.type !== type) return false;
      return true;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }

  static getAccountById(id: number): Account | null {
    const account = localDB.getState().accounts.find(a => a.id === id);
    return account || null;
  }

  static createAccount(data: CreateAccountInput): Account {
    let createdAccount: Account;
    localDB.update(state => {
      const nextId = state.accounts.length > 0 ? Math.max(...state.accounts.map(a => a.id || 0)) + 1 : 1;
      createdAccount = {
        id: nextId,
        code: data.code || `ACC-${nextId.toString().padStart(4, '0')}`,
        name: data.name,
        type: data.type,
        is_archived: Boolean(data.is_archived),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      state.accounts.push(createdAccount);

      state.audit_log.push({
        id: state.audit_log.length + 1,
        table_name: 'accounts',
        record_id: nextId,
        action: 'CREATE',
        new_data: JSON.stringify(createdAccount),
        timestamp: new Date().toISOString(),
      });
    });

    return createdAccount!;
  }

  static updateAccount(id: number, data: UpdateAccountInput): Account | null {
    let updatedAccount: Account | null = null;
    localDB.update(state => {
      const idx = state.accounts.findIndex(a => a.id === id);
      if (idx === -1) return;

      const existing = state.accounts[idx];
      updatedAccount = {
        ...existing,
        ...data,
        updated_at: new Date().toISOString(),
      };
      state.accounts[idx] = updatedAccount;

      state.audit_log.push({
        id: state.audit_log.length + 1,
        table_name: 'accounts',
        record_id: id,
        action: 'UPDATE',
        old_data: JSON.stringify(existing),
        new_data: JSON.stringify(updatedAccount),
        timestamp: new Date().toISOString(),
      });
    });

    return updatedAccount;
  }

  static archiveAccount(id: number, isArchived = true): Account | null {
    let updatedAccount: Account | null = null;
    localDB.update(state => {
      const idx = state.accounts.findIndex(a => a.id === id);
      if (idx === -1) return;

      const existing = state.accounts[idx];
      updatedAccount = {
        ...existing,
        is_archived: isArchived,
        updated_at: new Date().toISOString(),
      };
      state.accounts[idx] = updatedAccount;

      state.audit_log.push({
        id: state.audit_log.length + 1,
        table_name: 'accounts',
        record_id: id,
        action: isArchived ? 'ARCHIVE' : 'UNARCHIVE',
        old_data: JSON.stringify(existing),
        new_data: JSON.stringify(updatedAccount),
        timestamp: new Date().toISOString(),
      });
    });

    return updatedAccount;
  }

  // Journals CRUD
  static getAllJournals(includeArchived = false, type?: string): Journal[] {
    const journals = localDB.getState().journals;
    const accounts = localDB.getState().accounts;
    return journals.filter(j => {
      if (!includeArchived && j.is_archived) return false;
      if (type && type !== 'all' && j.type !== type) return false;
      return true;
    }).map(j => {
      const defAcc = accounts.find(a => a.id === j.default_account_id);
      return {
        ...j,
        default_account_name: defAcc ? defAcc.name : 'Unknown Account',
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }

  static getJournalById(id: number): Journal | null {
    const journal = localDB.getState().journals.find(j => j.id === id);
    if (!journal) return null;
    const defAcc = localDB.getState().accounts.find(a => a.id === journal.default_account_id);
    return {
      ...journal,
      default_account_name: defAcc ? defAcc.name : 'Unknown Account',
    };
  }

  static createJournal(data: CreateJournalInput): Journal {
    let createdJournal: Journal;
    localDB.update(state => {
      const nextId = state.journals.length > 0 ? Math.max(...state.journals.map(j => j.id || 0)) + 1 : 1;
      createdJournal = {
        id: nextId,
        name: data.name,
        type: data.type,
        default_account_id: data.default_account_id,
        is_archived: Boolean(data.is_archived),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      state.journals.push(createdJournal);

      state.audit_log.push({
        id: state.audit_log.length + 1,
        table_name: 'journals',
        record_id: nextId,
        action: 'CREATE',
        new_data: JSON.stringify(createdJournal),
        timestamp: new Date().toISOString(),
      });
    });

    return this.getJournalById(createdJournal!.id!)!;
  }

  static updateJournal(id: number, data: UpdateJournalInput): Journal | null {
    let updatedJournal: Journal | null = null;
    localDB.update(state => {
      const idx = state.journals.findIndex(j => j.id === id);
      if (idx === -1) return;

      const existing = state.journals[idx];
      updatedJournal = {
        ...existing,
        ...data,
        updated_at: new Date().toISOString(),
      };
      state.journals[idx] = updatedJournal;

      state.audit_log.push({
        id: state.audit_log.length + 1,
        table_name: 'journals',
        record_id: id,
        action: 'UPDATE',
        old_data: JSON.stringify(existing),
        new_data: JSON.stringify(updatedJournal),
        timestamp: new Date().toISOString(),
      });
    });

    return this.getJournalById(id);
  }

  static archiveJournal(id: number, isArchived = true): Journal | null {
    let updatedJournal: Journal | null = null;
    localDB.update(state => {
      const idx = state.journals.findIndex(j => j.id === id);
      if (idx === -1) return;

      const existing = state.journals[idx];
      updatedJournal = {
        ...existing,
        is_archived: isArchived,
        updated_at: new Date().toISOString(),
      };
      state.journals[idx] = updatedJournal;

      state.audit_log.push({
        id: state.audit_log.length + 1,
        table_name: 'journals',
        record_id: id,
        action: isArchived ? 'ARCHIVE' : 'UNARCHIVE',
        old_data: JSON.stringify(existing),
        new_data: JSON.stringify(updatedJournal),
        timestamp: new Date().toISOString(),
      });
    });

    return this.getJournalById(id);
  }
}
