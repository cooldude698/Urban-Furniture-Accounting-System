import puppeteer from 'puppeteer';
import fs from 'fs';
import { CustomerInvoiceDTO } from './invoiceService';

export class PdfService {
  static generateInvoiceHtml(invoice: CustomerInvoiceDTO): string {
    const linesHtml = invoice.lines
      .map(
        (line, index) => `
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #E5DFD7; text-align: center; font-size: 13px;">${index + 1}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #E5DFD7; font-size: 13px;">
            <strong>${line.productName}</strong>
            <div style="font-size: 11px; color: #7B7267;">SKU: ${line.productSku || '-'}</div>
          </td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #E5DFD7; font-size: 12px; color: #574F45;">${line.analyticAccountName || 'General'}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #E5DFD7; text-align: right; font-family: monospace; font-size: 13px;">${line.qty}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #E5DFD7; text-align: right; font-family: monospace; font-size: 13px;">₹${parseFloat(line.unitPrice).toFixed(2)}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #E5DFD7; text-align: right; font-family: monospace; font-size: 13px;">${line.taxRate}%</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #E5DFD7; text-align: right; font-family: monospace; font-weight: 600; font-size: 13px;">₹${parseFloat(line.total).toFixed(2)}</td>
        </tr>
      `
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice - ${invoice.number}</title>
        <style>
          @page {
            size: A4;
            margin: 15mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #26211C;
            background: #FFFFFF;
            margin: 0;
            padding: 24px;
            font-size: 13px;
            line-height: 1.5;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #26211C;
            padding-bottom: 16px;
            margin-bottom: 24px;
          }
          .brand {
            font-size: 22px;
            font-weight: 800;
            letter-spacing: -0.5px;
            color: #26211C;
          }
          .badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .badge-confirmed { background: #E6F4EA; color: #137333; }
          .badge-draft { background: #F1F3F4; color: #5F6368; }
          .badge-paid { background: #E6F4EA; color: #137333; }
          .badge-partial { background: #FEF7E0; color: #B06000; }
          .badge-not_paid { background: #FCE8E6; color: #C5221F; }
          .meta-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
            margin-bottom: 28px;
          }
          .meta-box {
            background: #FAF8F5;
            border: 1px solid #E5DFD7;
            border-radius: 8px;
            padding: 14px 16px;
          }
          .meta-title {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            color: #7B7267;
            margin-bottom: 6px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
          }
          th {
            background: #F2ECE4;
            padding: 10px 12px;
            border-bottom: 2px solid #D5CCC0;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #4A4237;
          }
          .totals-section {
            display: flex;
            justify-content: flex-end;
          }
          .totals-box {
            width: 300px;
            background: #FAF8F5;
            border: 1px solid #E5DFD7;
            border-radius: 8px;
            padding: 16px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 4px 0;
            font-size: 13px;
          }
          .grand-total {
            border-top: 2px solid #26211C;
            margin-top: 8px;
            padding-top: 8px;
            font-size: 16px;
            font-weight: 800;
          }
          .footer {
            margin-top: 40px;
            border-top: 1px solid #E5DFD7;
            padding-top: 16px;
            font-size: 11px;
            color: #7B7267;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="display: flex; align-items: center; gap: 12px;">
            <svg width="36" height="36" viewBox="0 0 1024 1024" fill="#26211C" xmlns="http://www.w3.org/2000/svg">
              <path d="M 268 162 L 270 163 L 279 163 L 280 164 L 280 176 L 281 177 L 281 198 L 282 199 L 282 205 L 283 206 L 283 221 L 284 222 L 284 239 L 285 240 L 285 249 L 286 250 L 286 262 L 287 263 L 287 280 L 288 281 L 288 290 L 289 291 L 289 304 L 290 305 L 290 325 L 291 326 L 291 333 L 292 334 L 292 347 L 293 348 L 293 366 L 294 367 L 294 377 L 295 378 L 295 388 L 296 389 L 296 395 L 299 401 L 299 405 L 302 409 L 302 412 L 304 414 L 305 416 L 305 418 L 307 420 L 308 423 L 311 426 L 312 429 L 315 432 L 315 433 L 318 436 L 318 437 L 320 438 L 321 440 L 323 441 L 324 443 L 326 444 L 327 446 L 329 447 L 331 450 L 332 450 L 339 456 L 342 457 L 345 460 L 348 461 L 350 463 L 352 463 L 356 466 L 358 466 L 362 469 L 366 469 L 371 472 L 375 472 L 376 473 L 378 473 L 379 474 L 383 474 L 384 475 L 639 475 L 640 476 L 647 476 L 648 477 L 652 477 L 653 478 L 661 478 L 662 479 L 665 479 L 669 481 L 673 481 L 674 482 L 676 482 L 680 484 L 683 484 L 684 485 L 686 485 L 688 487 L 691 487 L 695 490 L 697 490 L 705 494 L 707 496 L 709 496 L 712 499 L 715 500 L 722 506 L 723 506 L 726 509 L 727 509 L 738 520 L 738 521 L 747 531 L 748 534 L 750 536 L 754 544 L 756 546 L 756 548 L 759 552 L 759 555 L 762 558 L 762 562 L 763 563 L 763 565 L 765 567 L 766 574 L 768 578 L 768 583 L 769 584 L 769 588 L 770 589 L 770 592 L 771 593 L 771 602 L 772 603 L 772 627 L 771 628 L 771 646 L 770 647 L 770 656 L 769 657 L 769 670 L 768 671 L 768 691 L 767 692 L 767 701 L 766 702 L 766 718 L 765 719 L 765 736 L 764 737 L 764 744 L 763 745 L 763 758 L 762 759 L 762 783 L 761 784 L 761 793 L 760 794 L 760 804 L 759 805 L 759 824 L 758 825 L 758 837 L 757 838 L 757 849 L 756 850 L 756 859 L 754 860 L 753 859 L 743 859 L 743 857 L 742 856 L 742 838 L 741 837 L 741 830 L 740 829 L 740 814 L 739 813 L 739 796 L 738 795 L 738 787 L 737 786 L 737 771 L 736 770 L 736 754 L 735 753 L 735 745 L 734 744 L 734 731 L 733 730 L 733 711 L 732 710 L 732 701 L 731 700 L 731 689 L 730 688 L 730 668 L 729 667 L 729 658 L 728 657 L 728 641 L 727 640 L 727 631 L 726 630 L 726 628 L 724 624 L 724 620 L 721 616 L 721 613 L 718 609 L 717 606 L 712 600 L 712 599 L 702 589 L 701 589 L 697 585 L 694 584 L 691 581 L 689 580 L 687 580 L 685 578 L 680 577 L 677 575 L 670 574 L 667 572 L 661 572 L 660 571 L 649 571 L 648 570 L 384 570 L 383 569 L 375 569 L 374 568 L 369 568 L 368 567 L 365 567 L 364 566 L 355 565 L 349 562 L 346 562 L 344 560 L 342 560 L 341 559 L 339 559 L 337 557 L 332 556 L 330 554 L 328 553 L 326 553 L 323 550 L 321 550 L 318 547 L 316 547 L 313 544 L 312 544 L 309 541 L 308 541 L 305 538 L 304 538 L 303 536 L 301 535 L 288 522 L 288 521 L 286 520 L 286 519 L 282 515 L 279 509 L 276 506 L 272 498 L 270 496 L 270 494 L 268 492 L 267 490 L 267 488 L 265 486 L 264 484 L 264 482 L 261 477 L 261 473 L 258 468 L 257 461 L 255 457 L 255 451 L 254 450 L 254 447 L 252 443 L 252 431 L 251 430 L 251 405 L 252 404 L 252 385 L 253 384 L 253 376 L 254 375 L 254 362 L 255 361 L 255 338 L 256 337 L 256 326 L 257 325 L 257 308 L 258 307 L 258 287 L 259 286 L 259 277 L 260 276 L 260 260 L 261 259 L 261 235 L 262 234 L 262 225 L 263 224 L 263 213 L 264 212 L 264 188 L 265 187 L 265 175 L 266 174 L 266 164 L 268 162 Z" />
              <path d="M 252 637 L 254 637 L 255 638 L 259 638 L 260 637 L 262 637 L 263 638 L 291 638 L 293 637 L 295 638 L 295 642 L 294 643 L 294 654 L 293 655 L 293 673 L 292 674 L 292 688 L 291 689 L 291 697 L 290 698 L 290 717 L 289 718 L 289 732 L 288 733 L 288 742 L 287 743 L 287 758 L 286 759 L 286 773 L 285 774 L 285 784 L 284 785 L 284 803 L 283 804 L 283 818 L 282 819 L 282 828 L 281 829 L 281 848 L 280 849 L 280 858 L 279 859 L 271 859 L 270 860 L 268 860 L 266 857 L 266 846 L 265 845 L 265 837 L 264 836 L 264 814 L 263 813 L 263 805 L 262 804 L 262 793 L 261 792 L 261 773 L 260 772 L 260 757 L 259 756 L 259 750 L 258 749 L 258 731 L 257 730 L 257 716 L 256 715 L 256 705 L 255 704 L 255 685 L 254 684 L 254 672 L 253 671 L 253 664 L 252 663 L 252 648 L 251 647 L 251 644 L 252 643 L 251 642 L 251 638 L 252 637 Z" />
            </svg>
            <div>
              <div class="brand">URBAN FURNITURE</div>
              <div style="color: #7B7267; font-size: 12px; margin-top: 4px;">Accounting System &amp; Enterprise Ledger</div>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 20px; font-weight: 800; font-family: monospace;">${invoice.number}</div>
            <div style="margin-top: 6px;">
              <span class="badge badge-${invoice.status}">${invoice.status}</span>
              <span class="badge badge-${invoice.paymentStatus}" style="margin-left: 6px;">${invoice.paymentStatus.replace('_', ' ')}</span>
            </div>
          </div>
        </div>

        <div class="meta-grid">
          <div class="meta-box">
            <div class="meta-title">Billed To</div>
            <div style="font-size: 15px; font-weight: 700; color: #26211C;">${invoice.customerName}</div>
            <div style="color: #574F45; font-size: 12px; margin-top: 4px;">Customer ID: #${invoice.customerId}</div>
            ${invoice.soNumber ? `<div style="color: #574F45; font-size: 12px; margin-top: 2px;">Originating SO: <strong>${invoice.soNumber}</strong></div>` : ''}
          </div>

          <div class="meta-box">
            <div class="meta-title">Invoice Details</div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="color: #574F45;">Invoice Date:</span>
              <strong style="font-family: monospace;">${invoice.invoiceDate}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="color: #574F45;">Due Date:</span>
              <strong style="font-family: monospace;">${invoice.dueDate || '-'}</strong>
            </div>
            ${invoice.journalEntryNumber ? `
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #574F45;">Journal Entry:</span>
              <strong style="font-family: monospace;">${invoice.journalEntryNumber}</strong>
            </div>` : ''}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;">#</th>
              <th style="text-align: left;">Product / Item</th>
              <th style="text-align: left;">Analytics</th>
              <th style="width: 60px; text-align: right;">Qty</th>
              <th style="width: 90px; text-align: right;">Unit Price</th>
              <th style="width: 60px; text-align: right;">Tax</th>
              <th style="width: 100px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${linesHtml}
          </tbody>
        </table>

        <div class="totals-section">
          <div class="totals-box">
            <div class="total-row">
              <span>Subtotal:</span>
              <span style="font-family: monospace;">₹${parseFloat(invoice.subtotal).toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>Tax Total:</span>
              <span style="font-family: monospace;">₹${parseFloat(invoice.taxTotal).toFixed(2)}</span>
            </div>
            <div class="total-row grand-total">
              <span>Total:</span>
              <span style="font-family: monospace;">₹${parseFloat(invoice.total).toFixed(2)}</span>
            </div>
            <div class="total-row" style="margin-top: 8px; color: #137333;">
              <span>Amount Paid:</span>
              <span style="font-family: monospace;">- ₹${parseFloat(invoice.amountPaid).toFixed(2)}</span>
            </div>
            <div class="total-row" style="font-weight: 700; color: ${parseFloat(invoice.amountDue) > 0 ? '#C5221F' : '#137333'};">
              <span>Amount Due:</span>
              <span style="font-family: monospace;">₹${parseFloat(invoice.amountDue).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div class="footer">
          Generated deterministically by Urban Furniture Accounting Engine · Strictly Offline &amp; Immutable
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generic HTML -> PDF renderer using the same server-side Puppeteer pipeline
   * that backs invoice export. Callers own the HTML (including <style>).
   */
  static async renderHtmlToPdf(html: string): Promise<Buffer> {
    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH ||
      (fs.existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);

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
        printBackground: true,
        margin: { top: '12mm', right: '12mm', bottom: '12mm', left: '12mm' },
      });
      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  static async generateInvoicePdf(invoice: CustomerInvoiceDTO): Promise<Buffer> {
    const html = this.generateInvoiceHtml(invoice);
    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH ||
      (fs.existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);

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
        printBackground: true,
        margin: {
          top: '12mm',
          right: '12mm',
          bottom: '12mm',
          left: '12mm',
        },
      });
      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }
}
