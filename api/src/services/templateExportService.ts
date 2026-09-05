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
      <Row ss:Height="22">
        ${cols.map(c => `<Cell ss:StyleID="ColHeaderStyle"><Data ss:Type="String">${escapeXml(c.label)}</Data></Cell>`).join('')}
      </Row>
    `);

    // Data Rows
    for (const r of rows) {
      const itemVal = String(r[cols[0]?.key] || r.item || r.component || '');
      const isHeader = r.classification === 'Header' || /^[A-Z\s&’',()-]{3,}:?$/.test(itemVal.trim()) || itemVal.trim().endsWith(':');
      const isTotal = r.classification === 'Total' || r.classification === 'Subtotal' || /TOTAL\s/i.test(itemVal) || /^Total\s/i.test(itemVal);

      const cellXml = cols.map(c => {
        const val = r[c.key];
        const isNum = c.type === 'currency' || c.type === 'number';
        const numVal = parseFloat(String(val || '0'));

        if (isHeader) {
          return `<Cell ss:StyleID="SectionHeaderStyle"><Data ss:Type="String">${escapeXml(String(val ?? ''))}</Data></Cell>`;
        }
        if (isTotal && isNum && !isNaN(numVal)) {
          return `<Cell ss:StyleID="TotalNumberStyle"><Data ss:Type="Number">${numVal.toFixed(2)}</Data></Cell>`;
        }
        if (isTotal) {
          return `<Cell ss:StyleID="TotalTextStyle"><Data ss:Type="String">${escapeXml(String(val ?? ''))}</Data></Cell>`;
        }
        if (isNum && !isNaN(numVal)) {
          return `<Cell ss:StyleID="NumberCellStyle"><Data ss:Type="Number">${numVal.toFixed(2)}</Data></Cell>`;
        }
        return `<Cell ss:StyleID="TextCellStyle"><Data ss:Type="String">${escapeXml(String(val ?? ''))}</Data></Cell>`;
      }).join('');

      xmlRows.push(`<Row ss:Height="${isHeader ? '22' : isTotal ? '20' : '18'}">${cellXml}</Row>`);
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
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Color="#000000"/>
   <Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="HeaderStyle">
   <Font ss:FontName="Segoe UI" ss:Size="14" ss:Bold="1" ss:Color="#000000"/>
   <Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#000000"/>
   </Borders>
  </Style>
  <Style ss:ID="SubheaderStyle">
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Italic="1" ss:Color="#333333"/>
   <Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="ColHeaderStyle">
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#000000"/>
   <Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
   </Borders>
  </Style>
  <Style ss:ID="SectionHeaderStyle">
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#000000"/>
   <Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
   </Borders>
  </Style>
  <Style ss:ID="TextCellStyle">
   <Font ss:FontName="Segoe UI" ss:Size="9.5" ss:Color="#000000"/>
   <Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E5E5"/>
   </Borders>
  </Style>
  <Style ss:ID="NumberCellStyle">
   <Font ss:FontName="Consolas" ss:Size="9.5" ss:Color="#000000"/>
   <Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E5E5"/>
   </Borders>
  </Style>
  <Style ss:ID="TotalTextStyle">
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#000000"/>
   <Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="2" ss:Color="#000000"/>
   </Borders>
  </Style>
  <Style ss:ID="TotalNumberStyle">
   <Font ss:FontName="Consolas" ss:Size="10" ss:Bold="1" ss:Color="#000000"/>
   <Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="2" ss:Color="#000000"/>
   </Borders>
  </Style>
  <Style ss:ID="NoteStyle">
   <Font ss:FontName="Segoe UI" ss:Size="8.5" ss:Italic="1" ss:Color="#555555"/>
   <Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/>
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
      .map((r) => {
        const itemVal = String(r[cols[0]?.key] || r.item || r.component || '');
        const isHeader = r.classification === 'Header' || /^[A-Z\s&’',()-]{3,}:?$/.test(itemVal.trim()) || itemVal.trim().endsWith(':');
        const isSubtotal = r.classification === 'Subtotal' || /^TOTAL\s/i.test(itemVal.trim()) || /^Total\s/i.test(itemVal.trim());
        const isGrandTotal = r.classification === 'Total' || /TOTAL\s+ASSETS/i.test(itemVal) || /TOTAL\s+LIABILITIES\s+&/i.test(itemVal) || /TOTAL\s+LIABILITIES\s+AND\s+STOCKHOLDERS/i.test(itemVal);
        const isCheck = r.classification === 'Check' || /Check/i.test(itemVal);

        if (isHeader) {
          return `
            <tr style="background-color: #FFFFFF;">
              <td colspan="${cols.length}" style="padding: 12px 6px 4px 6px; font-weight: 800; font-size: 11px; text-transform: uppercase; color: #000000; border-bottom: 1px solid #000000;">
                ${escapeXml(itemVal)}
              </td>
            </tr>
          `;
        }

        const trStyle = isGrandTotal 
          ? 'background-color: #FFFFFF; font-weight: 700;' 
          : isSubtotal 
            ? 'background-color: #FFFFFF; font-weight: 600;' 
            : isCheck 
              ? 'background-color: #FFFFFF; font-style: italic; color: #444444;' 
              : 'background-color: #FFFFFF;';

        const rowBorderTop = (isGrandTotal || isSubtotal) ? 'border-top: 1px solid #000000;' : '';
        const rowBorderBottom = isGrandTotal 
          ? 'border-bottom: 3px double #000000;' 
          : isSubtotal 
            ? 'border-bottom: 1px solid #000000;' 
            : 'border-bottom: 1px solid #E5E5E5;';

        return `
          <tr style="${trStyle}">
            ${cols.map((c, colIdx) => {
              const val = r[c.key] ?? '';
              const isNum = c.type === 'currency' || c.type === 'number';
              const textIndent = (colIdx === 0 && !isHeader && !isSubtotal && !isGrandTotal && !isCheck) ? 'padding-left: 18px;' : '';
              return `
                <td style="padding: 6px 8px; ${rowBorderTop} ${rowBorderBottom} ${textIndent} font-size: 11px; color: #000000; ${
                  isNum 
                    ? 'text-align: right; font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, monospace; font-variant-numeric: tabular-nums;' 
                    : 'text-align: left;'
                }">
                  ${escapeXml(String(val || '—'))}
                </td>
              `;
            }).join('')}
          </tr>
        `;
      })
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
            color: #000000;
            background: #FFFFFF;
            margin: 0;
            padding: 14px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            border-bottom: 2px solid #000000;
            padding-bottom: 10px;
            margin-bottom: 16px;
          }
          .brand {
            font-size: 22px;
            font-weight: 800;
            color: #000000;
            letter-spacing: -0.5px;
          }
          .subtitle {
            font-size: 13px;
            font-weight: 600;
            color: #222222;
            margin-top: 3px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .doc-meta {
            text-align: right;
            font-size: 11px;
            color: #333333;
            line-height: 1.5;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
            background-color: #FFFFFF;
          }
          th {
            background-color: #FFFFFF;
            color: #000000;
            padding: 8px 8px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-top: 1px solid #000000;
            border-bottom: 1px solid #000000;
          }
          .footer {
            margin-top: 24px;
            padding-top: 10px;
            border-top: 1px solid #000000;
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            color: #444444;
          }
          .formula-box {
            background-color: #F8F9FA;
            border-left: 3px solid #000000;
            padding: 8px 12px;
            font-size: 11px;
            color: #111111;
            margin-top: 12px;
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
            <div class="subtitle">${escapeXml(template.name)}</div>
          </div>
          <div class="doc-meta">
            <div>Financial Period: <strong>${escapeXml(config.financialYear || '2026-27')}</strong></div>
            <div>Date: <strong>${new Date().toLocaleDateString('en-IN')}</strong></div>
            <div>Standard: <em>${escapeXml(template.sourceType)}</em></div>
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
