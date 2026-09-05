import { Router, Request, Response } from 'express';
import { IntegrityService, IntegrityReport } from '../services/integrityService';
import { sendSuccess, sendError } from '../utils/response';

export const integrityRouter = Router();

/**
 * GET /api/integrity
 * Runs all ten system-integrity checks against live data. Admin only
 * (enforced by requireAuth + requireRole('admin') at mount time).
 */
integrityRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const report = await IntegrityService.runAll();
    return sendSuccess(res, report);
  } catch (err: any) {
    console.error('Error in /api/integrity:', err);
    return sendError(res, 'INTEGRITY_FAILED', err.message || 'Failed to run integrity checks', 500);
  }
});

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

function renderReportHtml(report: IntegrityReport): string {
  const statusColor: Record<string, string> = {
    pass: '#5F7052',
    fail: '#9E4A38',
    unknown: '#A8836C',
  };
  const rows = report.checks
    .map((c, i) => {
      const colour = statusColor[c.status] || '#A8836C';
      return `
      <tr>
        <td style="padding:12px 14px;border-bottom:1px solid #E5DFD7;font-family:monospace;font-size:12px;color:#77574A;">${i + 1}</td>
        <td style="padding:12px 14px;border-bottom:1px solid #E5DFD7;">
          <div style="font-weight:600;font-size:13px;color:#4A3A34;">${escapeHtml(c.label)}</div>
          <div style="font-size:11px;color:#77574A;margin-top:3px;">${escapeHtml(c.detail)}</div>
        </td>
        <td style="padding:12px 14px;border-bottom:1px solid #E5DFD7;text-align:right;font-family:monospace;font-size:13px;color:#4A3A34;">${escapeHtml(c.value)}</td>
        <td style="padding:12px 14px;border-bottom:1px solid #E5DFD7;text-align:center;">
          <span style="display:inline-block;padding:3px 10px;border-radius:999px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:${colour};border:1px solid ${colour};">${c.status}</span>
        </td>
      </tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
  <html><head><meta charset="utf-8"><title>System Integrity Report</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body { font-family: -apple-system, "Segoe UI", Roboto, Arial, sans-serif; color:#26211C; background:#FFFFFF; margin:0; padding:24px; }
    h1 { font-size:22px; font-weight:800; margin:0 0 4px 0; color:#26211C; }
    .sub { color:#77574A; font-size:12px; }
    table { width:100%; border-collapse:collapse; margin-top:20px; }
    th { background:#F2ECE4; padding:10px 14px; border-bottom:2px solid #D5CCC0; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:#4A4237; text-align:left; }
    .summary { margin-top:14px; display:inline-block; padding:8px 16px; border-radius:8px; background:#F9F2E4; border:1px solid #D0AE92; font-weight:700; font-size:14px; color:#4A3A34; }
    .footer { margin-top:32px; border-top:1px solid #E5DFD7; padding-top:14px; font-size:10px; color:#77574A; text-align:center; }
  </style></head>
  <body>
    <h1>URBAN FURNITURE — System Integrity Report</h1>
    <div class="sub">Ten checks run live against the production database. Every value below is a real query result.</div>
    <div class="summary">${report.passed} / ${report.total} checks passed${report.failed ? ` &nbsp;·&nbsp; ${report.failed} failed` : ''}${report.unknown ? ` &nbsp;·&nbsp; ${report.unknown} unknown` : ''}</div>
    <div class="sub" style="margin-top:6px;">Run at ${escapeHtml(report.runAt)}</div>
    <table>
      <thead><tr><th style="width:36px;">#</th><th>Check</th><th style="text-align:right;width:120px;">Value</th><th style="text-align:center;width:90px;">Status</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="footer">Generated deterministically by the Urban Furniture Accounting Engine · Strictly Offline</div>
  </body></html>`;
}

/**
 * GET /api/integrity/pdf
 * Server-side Puppeteer render of the integrity report. Falls back to printable
 * HTML if the headless browser is unavailable.
 */
integrityRouter.get('/pdf', async (_req: Request, res: Response) => {
  try {
    const report = await IntegrityService.runAll();
    const html = renderReportHtml(report);
    const { PdfService } = await import('../services/pdfService');
    try {
      const pdf = await PdfService.renderHtmlToPdf(html);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="System-Integrity-Report.pdf"`);
      return res.send(pdf);
    } catch (pdfErr: any) {
      console.warn('Puppeteer unavailable, serving printable HTML:', pdfErr.message);
      res.setHeader('Content-Type', 'text/html');
      return res.send(html);
    }
  } catch (err: any) {
    console.error('Error in /api/integrity/pdf:', err);
    return sendError(res, 'INTEGRITY_PDF_FAILED', err.message || 'Failed to render integrity report', 500);
  }
});
