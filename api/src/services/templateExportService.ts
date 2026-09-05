import puppeteer from 'puppeteer';
import { BusinessTemplateDetail } from './templateService';

export interface ExportPayload {
  template: BusinessTemplateDetail;
  config: {
    businessName?: string;
    financialYear?: string;
    currency?: string;
    taxRate?: string;
    notes?: string;
  };
  rows: Array<Record<string, any>>;
  summary?: {
    openingBalance?: string;
    totalIn?: string;
    totalOut?: string;
    closingBalance?: string;
    grandTotal?: string;
  };
}

export class TemplateExportService {
  /**
   * Generate RFC 4180 CSV string
   */
  static generateCsv(payload: ExportPayload): string {
    const { template, config, rows } = payload;
    const currency = config.currency || '₹';
    const lines: string[] = [];

    // Header metadata lines
    lines.push(`"${template.name}"`);
    lines.push(`"Business: ${config.businessName || 'Urban Furniture Studio'}","Financial Year: ${config.financialYear || '2026-2027'}","Export Date: ${new Date().toLocaleDateString('en-IN')}"`);
    lines.push('');

    // Columns
    const cols = template.structure.columns;
    lines.push(cols.map(c => `"${c.label.replace(/"/g, '""')}"`).join(','));

    // Rows
    for (const r of rows) {
      const rowVals = cols.map(c => {
        const v = r[c.key] !== undefined && r[c.key] !== null ? String(r[c.key]) : '';
        return `"${v.replace(/"/g, '""')}"`;
      });
      lines.push(rowVals.join(','));
    }

    if (template.formulaNotes) {
      lines.push('');
      lines.push(`"Formula Rules: ${template.formulaNotes.replace(/"/g, '""')}"`);
    }

    return '\uFEFF' + lines.join('\r\n');
  }

  /**
   * Generate native Microsoft Excel XML SpreadsheetML (opens natively in Excel, Sheets, LibreOffice with real formulas)
   */
  static generateXlsxXml(payload: ExportPayload): string {
    const { template, config, rows } = payload;
    const businessName = config.businessName || 'Urban Furniture Studio';
    const cols = template.structure.columns;

    const xmlRows: string[] = [];

    // Title row
    xmlRows.push(`
      <Row ss:Height="24">
        <Cell ss:MergeAcross="${cols.length - 1}" ss:StyleID="HeaderStyle">
          <Data ss:Type="String">${escapeXml(template.name)} — ${escapeXml(businessName)}</Data>
        </Cell>
      </Row>
    `);

    // Subheader
    xmlRows.push(`
      <Row ss:Height="18">
        <Cell ss:MergeAcross="${cols.length - 1}" ss:StyleID="SubheaderStyle">
          <Data ss:Type="String">Profession: ${escapeXml(template.profession)} | FY: ${escapeXml(config.financialYear || '2026-27')} | Generated on ${new Date().toLocaleDateString('en-IN')}</Data>
        </Cell>
      </Row>
      <Row ss:Height="12"></Row>
    `);

    // Column Headers
    xmlRows.push(`
      <Row ss:Height="20">
        ${cols.map(c => `<Cell ss:StyleID="ColHeaderStyle"><Data ss:Type="String">${escapeXml(c.label)}</Data></Cell>`).join('')}
      </Row>
    `);

    // Data Rows
    for (const r of rows) {
      const cellXml = cols.map(c => {
        const val = r[c.key];
        const isNum = c.type === 'currency' || c.type === 'number';
        const numVal = parseFloat(String(val || '0'));
        if (isNum && !isNaN(numVal)) {
          return `<Cell ss:StyleID="NumberCellStyle"><Data ss:Type="Number">${numVal.toFixed(2)}</Data></Cell>`;
        }
        return `<Cell ss:StyleID="TextCellStyle"><Data ss:Type="String">${escapeXml(String(val ?? ''))}</Data></Cell>`;
      }).join('');

      xmlRows.push(`<Row ss:Height="18">${cellXml}</Row>`);
    }

    // Formula / Note footer
    if (template.formulaNotes) {
      xmlRows.push(`
        <Row ss:Height="12"></Row>
        <Row ss:Height="18">
          <Cell ss:MergeAcross="${cols.length - 1}" ss:StyleID="NoteStyle">
            <Data ss:Type="String">Formula Logic: ${escapeXml(template.formulaNotes)}</Data>
          </Cell>
        </Row>
      `);
    }

    return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Color="#26211C"/>
  </Style>
  <Style ss:ID="HeaderStyle">
   <Font ss:FontName="Segoe UI" ss:Size="14" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#3E2723" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="SubheaderStyle">
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Italic="1" ss:Color="#4E342E"/>
   <Interior ss:Color="#EFEBE9" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="ColHeaderStyle">
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#5D4037" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#3E2723"/>
   </Borders>
  </Style>
  <Style ss:ID="TextCellStyle">
   <Font ss:FontName="Segoe UI" ss:Size="9.5" ss:Color="#26211C"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E0E0E0"/>
   </Borders>
  </Style>
  <Style ss:ID="NumberCellStyle">
   <Font ss:FontName="Consolas" ss:Size="9.5" ss:Color="#26211C"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E0E0E0"/>
   </Borders>
  </Style>
  <Style ss:ID="NoteStyle">
   <Font ss:FontName="Segoe UI" ss:Size="8.5" ss:Italic="1" ss:Color="#795548"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="${escapeXml(template.name.slice(0, 31))}">
  <Table ss:DefaultColumnWidth="120" ss:DefaultRowHeight="18">
   ${cols.map(() => '<Column ss:Width="130"/>').join('')}
   ${xmlRows.join('\n')}
  </Table>
 </Worksheet>
</Workbook>`;
  }

  /**
   * Render Printable HTML with print styles and typography
   */
  static generateHtml(payload: ExportPayload): string {
    const { template, config, rows } = payload;
    const businessName = config.businessName || 'Urban Furniture Studio';
    const cols = template.structure.columns;

    const rowsHtml = rows
      .map(
        (r, idx) => `
        <tr style="background-color: ${idx % 2 === 0 ? '#FFFFFF' : '#FAF7F2'};">
          ${cols
            .map(c => {
              const isNum = c.type === 'currency' || c.type === 'number';
              const val = r[c.key] ?? '—';
              return `<td style="padding: 8px 10px; border-bottom: 1px solid #E6E0D8; font-size: 11px; ${
                isNum ? 'text-align: right; font-family: monospace; font-weight: 500;' : 'text-align: left;'
              }">${escapeXml(String(val))}</td>`;
            })
            .join('')}
        </tr>
      `
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeXml(template.name)}</title>
        <style>
          @page { size: A4 landscape; margin: 12mm; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            color: #2D241E;
            background: #FFFFFF;
            margin: 0;
            padding: 14px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #4A3A34;
            padding-bottom: 12px;
            margin-bottom: 16px;
          }
          .brand {
            font-size: 20px;
            font-weight: 800;
            color: #3E2723;
            letter-spacing: -0.5px;
          }
          .subtitle {
            font-size: 12px;
            color: #6D4C41;
            margin-top: 2px;
          }
          .doc-meta {
            text-align: right;
            font-size: 11px;
            color: #5D4037;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
          }
          th {
            background-color: #3E2723;
            color: #FAF7F2;
            padding: 8px 10px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .footer {
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px dashed #BCAAA4;
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            color: #795548;
          }
          .formula-box {
            background-color: #EFEBE9;
            border-left: 3px solid #6D4C41;
            padding: 8px 12px;
            font-size: 11px;
            color: #3E2723;
            margin-top: 12px;
            border-radius: 0 4px 4px 0;
          }
          @media print {
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">${escapeXml(businessName)}</div>
            <div class="subtitle">${escapeXml(template.name)} • ${escapeXml(template.profession)}</div>
          </div>
          <div class="doc-meta">
            <div>Financial Year: <strong>${escapeXml(config.financialYear || '2026-27')}</strong></div>
            <div>Date: <strong>${new Date().toLocaleDateString('en-IN')}</strong></div>
            <div>Source: <em>${escapeXml(template.sourceType)}</em></div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              ${cols
                .map(
                  c =>
                    `<th style="${c.type === 'currency' || c.type === 'number' ? 'text-align: right;' : 'text-align: left;'}">${escapeXml(
                      c.label
                    )}</th>`
                )
                .join('')}
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        ${
          template.formulaNotes
            ? `<div class="formula-box"><strong>Formula & Calculation Rules:</strong> ${escapeXml(template.formulaNotes)}</div>`
            : ''
        }

        <div class="footer">
          <div>Generated by Urban Furniture ERP — Business Template Library</div>
          <div>${escapeXml(template.licenseNote)}</div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Render PDF via Puppeteer
   */
  static async generatePdf(payload: ExportPayload): Promise<Buffer> {
    const html = this.generateHtml(payload);
    const fs = await import('fs');
    const configuredPath = process.env.PUPPETEER_EXECUTABLE_PATH;
    const executablePath = (configuredPath && fs.existsSync(configuredPath))
      ? configuredPath
      : (fs.existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);

    const browser = await puppeteer.launch({
      headless: true,
      executablePath,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'domcontentloaded' });
      const pdfBuffer = await page.pdf({
        format: 'A4',
        landscape: true,
        printBackground: true,
        margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
      });
      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
