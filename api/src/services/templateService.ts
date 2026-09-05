import { pool } from '../db/pool';

export interface TemplateCategory {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  sortOrder: number;
}

export interface BusinessTemplateSummary {
  id: number;
  name: string;
  slug: string;
  categoryId: number;
  categoryName: string;
  categorySlug: string;
  profession: string;
  description: string;
  fileType: string;
  version: string;
  sourceType: string;
  licenseNote: string;
  isActive: boolean;
  fields: string[];
  formulaNotes: string | null;
  erpDataSource: string | null;
  createdAt: string;
}

export interface BusinessTemplateDetail extends BusinessTemplateSummary {
  structure: {
    columns: Array<{
      key: string;
      label: string;
      type: 'text' | 'number' | 'currency' | 'date' | 'formula';
      formula?: string;
    }>;
  };
  previewData: {
    openingBalance?: string;
    budget?: string;
    rows: Array<Record<string, any>>;
  };
}

export interface UserTemplateItem {
  id: number;
  userId: number;
  templateId: number;
  templateName: string;
  templateSlug: string;
  categoryName: string;
  name: string;
  configuration: Record<string, any>;
  customData: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export class TemplateService {
  /**
   * Get all template categories ordered by sort_order
   */
  static async getCategories(): Promise<TemplateCategory[]> {
    const res = await pool.query<{
      id: number;
      name: string;
      slug: string;
      icon: string | null;
      sort_order: number;
    }>(
      `SELECT id, name, slug, icon, sort_order
       FROM template_categories
       ORDER BY sort_order ASC, name ASC`
    );

    return res.rows.map(r => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      icon: r.icon,
      sortOrder: r.sort_order,
    }));
  }

  /**
   * List templates with optional search and category filters
   */
  static async getTemplates(params: {
    categoryId?: number;
    categorySlug?: string;
    search?: string;
    profession?: string;
    includeInactive?: boolean;
  } = {}): Promise<BusinessTemplateSummary[]> {
    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (!params.includeInactive) {
      conditions.push(`t.is_active = true`);
    }

    if (params.categoryId) {
      conditions.push(`t.category_id = $${idx++}`);
      values.push(params.categoryId);
    }

    if (params.categorySlug && params.categorySlug !== 'all') {
      conditions.push(`tc.slug = $${idx++}`);
      values.push(params.categorySlug);
    }

    if (params.profession) {
      conditions.push(`t.profession ILIKE $${idx++}`);
      values.push(`%${params.profession}%`);
    }

    if (params.search && params.search.trim()) {
      const q = `%${params.search.trim()}%`;
      conditions.push(
        `(t.name ILIKE $${idx} OR t.description ILIKE $${idx} OR t.profession ILIKE $${idx} OR tc.name ILIKE $${idx})`
      );
      values.push(q);
      idx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT 
        t.id,
        t.name,
        t.slug,
        t.category_id,
        tc.name AS category_name,
        tc.slug AS category_slug,
        t.profession,
        t.description,
        t.file_type,
        t.version,
        t.source_type,
        t.license_note,
        t.is_active,
        t.fields_json,
        t.formula_notes,
        t.erp_data_source,
        t.created_at
      FROM templates t
      JOIN template_categories tc ON tc.id = t.category_id
      ${whereClause}
      ORDER BY tc.sort_order ASC, t.name ASC
    `;

    const res = await pool.query(sql, values);

    return res.rows.map(r => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      categoryId: r.category_id,
      categoryName: r.category_name,
      categorySlug: r.category_slug,
      profession: r.profession,
      description: r.description,
      fileType: r.file_type,
      version: r.version,
      sourceType: r.source_type,
      licenseNote: r.license_note,
      isActive: r.is_active,
      fields: Array.isArray(r.fields_json) ? r.fields_json : JSON.parse(r.fields_json || '[]'),
      formulaNotes: r.formula_notes,
      erpDataSource: r.erp_data_source,
      createdAt: r.created_at,
    }));
  }

  /**
   * Get template by ID with full structure and preview data
   */
  static async getTemplateById(identifier: number | string): Promise<BusinessTemplateDetail | null> {
    const isNum = typeof identifier === 'number' || /^\d+$/.test(String(identifier));
    const sql = `
      SELECT 
        t.id,
        t.name,
        t.slug,
        t.category_id,
        tc.name AS category_name,
        tc.slug AS category_slug,
        t.profession,
        t.description,
        t.file_type,
        t.version,
        t.source_type,
        t.license_note,
        t.is_active,
        t.fields_json,
        t.structure_json,
        t.preview_data_json,
        t.formula_notes,
        t.erp_data_source,
        t.created_at
      FROM templates t
      JOIN template_categories tc ON tc.id = t.category_id
      WHERE ${isNum ? 't.id = $1' : 't.slug = $1'}
    `;

    const res = await pool.query(sql, [isNum ? Number(identifier) : String(identifier)]);
    if (res.rows.length === 0) return null;

    const r = res.rows[0];
    return {
      id: r.id,
      name: r.name,
      slug: r.slug,
      categoryId: r.category_id,
      categoryName: r.category_name,
      categorySlug: r.category_slug,
      profession: r.profession,
      description: r.description,
      fileType: r.file_type,
      version: r.version,
      sourceType: r.source_type,
      licenseNote: r.license_note,
      isActive: r.is_active,
      fields: Array.isArray(r.fields_json) ? r.fields_json : JSON.parse(r.fields_json || '[]'),
      structure: typeof r.structure_json === 'object' ? r.structure_json : JSON.parse(r.structure_json || '{}'),
      previewData: typeof r.preview_data_json === 'object' ? r.preview_data_json : JSON.parse(r.preview_data_json || '{}'),
      formulaNotes: r.formula_notes,
      erpDataSource: r.erp_data_source,
      createdAt: r.created_at,
    };
  }

  /**
   * Fetch live ERP data for connected templates
   */
  static async getTemplateErpData(templateId: number): Promise<any[]> {
    const tmpl = await this.getTemplateById(templateId);
    if (!tmpl || !tmpl.erpDataSource) {
      return [];
    }

    switch (tmpl.erpDataSource) {
      case 'customer_invoices': {
        const res = await pool.query(`
          SELECT 
            ci.invoice_date AS date,
            ci.number AS invoice,
            c.name AS customer,
            COALESCE(c.gstin, 'Unregistered') AS gstin,
            ci.subtotal AS taxable,
            (ci.tax_total / 2)::numeric(14,2) AS cgst,
            (ci.tax_total / 2)::numeric(14,2) AS sgst,
            '0.00' AS igst,
            ci.total AS total,
            vis.amount_due AS due,
            vis.payment_status AS status
          FROM customer_invoices ci
          JOIN contacts c ON c.id = ci.customer_id
          LEFT JOIN v_invoice_status vis ON vis.invoice_id = ci.id
          WHERE ci.status = 'confirmed'
          ORDER BY ci.invoice_date DESC
          LIMIT 100
        `);
        return res.rows;
      }

      case 'vendor_bills': {
        const res = await pool.query(`
          SELECT 
            vb.bill_date AS date,
            vb.number AS bill,
            c.name AS vendor,
            COALESCE(c.gstin, 'Unregistered') AS gstin,
            vb.subtotal AS taxable,
            vb.tax_total AS itc,
            vb.total AS total,
            vbs.amount_due AS due,
            vbs.payment_status AS status
          FROM vendor_bills vb
          JOIN contacts c ON c.id = vb.vendor_id
          LEFT JOIN v_bill_status vbs ON vbs.bill_id = vb.id
          WHERE vb.status = 'confirmed'
          ORDER BY vb.bill_date DESC
          LIMIT 100
        `);
        return res.rows;
      }

      case 'stock_on_hand': {
        const res = await pool.query(`
          SELECT 
            p.sku,
            p.name,
            COALESCE(p.category, 'General Furniture') AS category,
            p.cost_price AS cost,
            COALESCE(s.stock_qty, 0) AS stock,
            5 AS reorder,
            (COALESCE(s.stock_qty, 0) * p.cost_price)::numeric(14,2) AS value
          FROM products p
          LEFT JOIN v_stock_on_hand s ON s.product_id = p.id
          WHERE p.is_archived = false
          ORDER BY p.name ASC
        `);
        return res.rows;
      }

      case 'customer_outstanding': {
        const res = await pool.query(`
          SELECT 
            ci.invoice_date AS date,
            ci.number AS doc,
            'Customer Invoice' AS type,
            ci.total AS debit,
            (ci.total - vis.amount_due)::numeric(14,2) AS credit,
            vis.amount_due AS balance,
            c.name AS customer
          FROM customer_invoices ci
          JOIN contacts c ON c.id = ci.customer_id
          JOIN v_invoice_status vis ON vis.invoice_id = ci.id
          WHERE vis.amount_due > 0
          ORDER BY ci.invoice_date ASC
        `);
        return res.rows;
      }

      case 'vendor_outstanding': {
        const res = await pool.query(`
          SELECT 
            vb.bill_date AS date,
            vb.number AS ref,
            'Vendor Purchase' AS desc,
            vb.total AS credit,
            (vb.total - vbs.amount_due)::numeric(14,2) AS debit,
            vbs.amount_due AS balance,
            c.name AS vendor
          FROM vendor_bills vb
          JOIN contacts c ON c.id = vb.vendor_id
          JOIN v_bill_status vbs ON vbs.bill_id = vb.id
          WHERE vbs.amount_due > 0
          ORDER BY vb.bill_date ASC
        `);
        return res.rows;
      }

      case 'general_ledger': {
        const res = await pool.query(`
          SELECT 
            v.entry_date AS date,
            v.entry_number AS entry,
            v.account_name AS account,
            v.account_type AS type,
            v.debit,
            v.credit,
            v.description
          FROM v_ledger_detail v
          ORDER BY v.entry_date ASC, v.entry_number ASC
          LIMIT 200
        `);
        return res.rows;
      }

      default:
        return [];
    }
  }

  /**
   * Save customized template to "My Templates" (scoped to userId)
   */
  static async saveUserTemplate(
    userId: number,
    templateId: number,
    name: string,
    configuration: Record<string, any>,
    customData: Record<string, any>
  ): Promise<UserTemplateItem> {
    const res = await pool.query<{
      id: number;
      user_id: number;
      template_id: number;
      name: string;
      configuration_json: any;
      custom_data_json: any;
      created_at: string;
      updated_at: string;
    }>(
      `INSERT INTO user_templates (user_id, template_id, name, configuration_json, custom_data_json)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        userId,
        templateId,
        name,
        JSON.stringify(configuration),
        JSON.stringify(customData),
      ]
    );

    const saved = res.rows[0];
    const tmpl = await this.getTemplateById(templateId);

    return {
      id: saved.id,
      userId: saved.user_id,
      templateId: saved.template_id,
      templateName: tmpl?.name || '',
      templateSlug: tmpl?.slug || '',
      categoryName: tmpl?.categoryName || '',
      name: saved.name,
      configuration: typeof saved.configuration_json === 'object' ? saved.configuration_json : JSON.parse(saved.configuration_json || '{}'),
      customData: typeof saved.custom_data_json === 'object' ? saved.custom_data_json : JSON.parse(saved.custom_data_json || '{}'),
      createdAt: saved.created_at,
      updatedAt: saved.updated_at,
    };
  }

  /**
   * Get all user templates (scoped to userId)
   */
  static async getUserTemplates(userId: number): Promise<UserTemplateItem[]> {
    const sql = `
      SELECT 
        ut.id,
        ut.user_id,
        ut.template_id,
        t.name AS template_name,
        t.slug AS template_slug,
        tc.name AS category_name,
        ut.name,
        ut.configuration_json,
        ut.custom_data_json,
        ut.created_at,
        ut.updated_at
      FROM user_templates ut
      JOIN templates t ON t.id = ut.template_id
      JOIN template_categories tc ON tc.id = t.category_id
      WHERE ut.user_id = $1
      ORDER BY ut.updated_at DESC
    `;

    const res = await pool.query(sql, [userId]);

    return res.rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      templateId: r.template_id,
      templateName: r.template_name,
      templateSlug: r.template_slug,
      categoryName: r.category_name,
      name: r.name,
      configuration: typeof r.configuration_json === 'object' ? r.configuration_json : JSON.parse(r.configuration_json || '{}'),
      customData: typeof r.custom_data_json === 'object' ? r.custom_data_json : JSON.parse(r.custom_data_json || '{}'),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  /**
   * Delete user template (scoped to userId)
   */
  static async deleteUserTemplate(userId: number, id: number): Promise<boolean> {
    const res = await pool.query(
      `DELETE FROM user_templates WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, userId]
    );
    return res.rows.length > 0;
  }

  /**
   * Duplicate user template (scoped to userId)
   */
  static async duplicateUserTemplate(userId: number, id: number): Promise<UserTemplateItem | null> {
    const existingRes = await pool.query(
      `SELECT * FROM user_templates WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    if (existingRes.rows.length === 0) return null;

    const orig = existingRes.rows[0];
    const newName = `${orig.name} (Copy)`;

    return this.saveUserTemplate(
      userId,
      orig.template_id,
      newName,
      typeof orig.configuration_json === 'object' ? orig.configuration_json : JSON.parse(orig.configuration_json || '{}'),
      typeof orig.custom_data_json === 'object' ? orig.custom_data_json : JSON.parse(orig.custom_data_json || '{}')
    );
  }

  /**
   * Admin: Toggle template active status
   */
  static async toggleTemplateActive(id: number, isActive: boolean): Promise<boolean> {
    const res = await pool.query(
      `UPDATE templates SET is_active = $1, updated_at = now() WHERE id = $2 RETURNING id`,
      [isActive, id]
    );
    return res.rows.length > 0;
  }
}
