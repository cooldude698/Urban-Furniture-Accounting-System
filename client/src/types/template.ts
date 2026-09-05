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
  configuration: {
    businessName?: string;
    financialYear?: string;
    currency?: string;
    dateFormat?: string;
    openingBalance?: string;
    budget?: string;
    taxRate?: string;
    notes?: string;
    useLiveErpData?: boolean;
    [key: string]: any;
  };
  customData: {
    rows: Array<Record<string, any>>;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}
