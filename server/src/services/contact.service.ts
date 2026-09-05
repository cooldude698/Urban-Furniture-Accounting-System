import { localDB } from '../db/db.js';
import { CreateContactInput, UpdateContactInput, Contact } from '../../../shared/schemas/contact.schema.js';

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
}
