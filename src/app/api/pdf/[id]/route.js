import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getInvoiceById, getSettings } from '@/lib/db';
import { amountToWords } from '@/lib/numberToWords';
import fs from 'fs';
import path from 'path';

/**
 * PDF Export API
 * Generates a pixel-perfect PDF matching ACC-SINV-2026-00087.pdf
 * Single Puppeteer render path — same output regardless of client device.
 */
export async function GET(req, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const invoice = await getInvoiceById(Number(id));
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const settings = await getSettings() || {};

    // Load self-hosted fonts as base64 data URIs (no network dependency)
    const fontData = loadFontData();
    const html = buildInvoiceHtml(invoice, settings, fontData);

    try {
      const puppeteer = await import('puppeteer');
      const browser = await puppeteer.default.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      // Wait for fonts to be fully loaded and rendered
      await page.evaluateHandle('document.fonts.ready');

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        displayHeaderFooter: false,
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
      });

      await browser.close();

      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${invoice.invoice_number || 'invoice'}.pdf"`,
        },
      });
    } catch (puppeteerError) {
      console.warn('Puppeteer not available, returning HTML:', puppeteerError.message);
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `inline; filename="${invoice.invoice_number || 'invoice'}.html"`,
        },
      });
    }
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}

/**
 * Load Open Sans woff2 files from public/fonts/ and convert to base64 data URIs.
 * This eliminates the Google Fonts network dependency at PDF-generation time.
 */
function loadFontData() {
  const fontsDir = path.join(process.cwd(), 'public', 'fonts');
  const result = { latin: '', latinExt: '' };

  try {
    const latinPath = path.join(fontsDir, 'open-sans-latin.woff2');
    const latinExtPath = path.join(fontsDir, 'open-sans-latin-ext.woff2');

    if (fs.existsSync(latinPath)) {
      result.latin = `data:font/woff2;base64,${fs.readFileSync(latinPath).toString('base64')}`;
    }
    if (fs.existsSync(latinExtPath)) {
      result.latinExt = `data:font/woff2;base64,${fs.readFileSync(latinExtPath).toString('base64')}`;
    }
  } catch (err) {
    console.warn('Could not load self-hosted fonts, falling back to Google Fonts:', err.message);
  }

  return result;
}

function buildInvoiceHtml(invoice, settings, fontData) {
  const {
    invoice_number = 'ACC-SINV-2026-00087',
    customer_name = '',
    customer_address = '',
    customer_phone = '',
    invoice_date = '',
    due_date = '',
    line_items = [],
    shipping_charges = 0,
    shipping_free = false,
    discount_amount = 0,
    notes = '',
    terms = '',
  } = invoice;

  const {
    company_name = 'Swift Tech & Games',
    website = 'swifttechngames.com',
    email = 'info@swifttechngames.com',
    phone = '+92 328 0445543',
    brand_color = '#CC19F4',
    currency_symbol = '₨',
    currency_name = 'PKR',
  } = settings;

  const totalQuantity = line_items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const totalRawSubtotal = line_items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.rate) || 0),
    0
  );

  const discountVal = Number(discount_amount) || 0;

  const processedItems = line_items.map((item) => {
    const qty = Number(item.quantity) || 0;
    const rate = Number(item.rate) || 0;
    const itemRaw = qty * rate;

    let itemDiscount = Number(item.discount) || 0;
    if (!itemDiscount && discountVal > 0) {
      if (line_items.length === 1) {
        itemDiscount = discountVal;
      } else if (totalRawSubtotal > 0) {
        itemDiscount = (itemRaw / totalRawSubtotal) * discountVal;
      }
    }

    const netAmount = Math.max(0, itemRaw - itemDiscount);
    return {
      ...item,
      computedAmount: netAmount,
    };
  });

  const computedSubtotal = processedItems.reduce((sum, item) => sum + item.computedAmount, 0);
  const effectiveShipping = shipping_free ? 0 : Number(shipping_charges) || 0;
  const grandTotal = computedSubtotal + effectiveShipping;
  const inWords = amountToWords(grandTotal, currency_name);

  const formatDateStr = (dateStr) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3 && parts[0].length === 4) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return dateStr;
    }
  };

  const formatNum = (val) => {
    const num = Number(val) || 0;
    return num.toFixed(2);
  };

  // Currency symbol — use ₨ glyph, not "Rs"
  const cs = currency_symbol || '₨';

  // Inline SVG logo — no network fetch, no <img> tag, brand_color applied directly
  const logoSvg = `<svg width="120" height="72" viewBox="0 0 400 241" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M128.227 0L0 240.387L163.305 240.398L235.04 105.916L286.908 192.375L243.36 192.372L217.74 240.402L381.045 240.412L236.968 0.248474L134.49 192.365L80.0546 192.362L182.664 1.20656e-07L128.227 0Z" fill="${brand_color}"/>
    <path d="M345.563 2.04553e-05L308.359 69.746L337.175 117.779L400 2.05292e-05L345.563 2.04553e-05Z" fill="${brand_color}"/>
  </svg>`;

  // Build font-face CSS — self-hosted or fallback to Google Fonts
  let fontCss;
  if (fontData.latin || fontData.latinExt) {
    const faces = [];
    for (const weight of [400, 600, 700]) {
      if (fontData.latinExt) {
        faces.push(`@font-face {
  font-family: 'Open Sans';
  font-style: normal;
  font-weight: ${weight};
  font-stretch: 100%;
  font-display: swap;
  src: url(${fontData.latinExt}) format('woff2');
  unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
}`);
      }
      if (fontData.latin) {
        faces.push(`@font-face {
  font-family: 'Open Sans';
  font-style: normal;
  font-weight: ${weight};
  font-stretch: 100%;
  font-display: swap;
  src: url(${fontData.latin}) format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}`);
      }
    }
    fontCss = faces.join('\n');
  } else {
    // Fallback: fetch from Google Fonts if self-hosted files are missing
    fontCss = `@import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap');`;
  }

  // Line items HTML
  const lineItemsHtml = processedItems.length > 0
    ? processedItems.map((item, i) => `
      <tr>
        <td style="padding:6pt 4pt;font-size:9pt;font-weight:400;text-align:center;border:1px solid #edf2f7">${i + 1}</td>
        <td style="padding:6pt 4pt;font-size:9pt;font-weight:600;text-align:left;border:1px solid #edf2f7">${item.itemName || ''}</td>
        <td style="padding:6pt 4pt;font-size:9pt;font-weight:400;text-align:left;border:1px solid #edf2f7">${item.warranty || 'N/A'}</td>
        <td style="padding:6pt 4pt;font-size:9pt;font-weight:400;text-align:left;border:1px solid #edf2f7">${item.serialNumber || 'N/A'}</td>
        <td style="padding:6pt 4pt;font-size:9pt;border:1px solid #edf2f7">
          <div style="display:flex;justify-content:space-between;align-items:center;padding:0 2pt">
            <span style="font-size:8pt;color:#1a1a1a;font-weight:400">${item.unit || 'Unit'}</span>
            <span style="font-weight:400;font-size:9pt">${item.quantity || 1}</span>
          </div>
        </td>
        <td style="padding:6pt 4pt;font-size:9pt;text-align:right;border:1px solid #edf2f7">
          <div style="font-size:8pt;color:#1a1a1a;font-weight:400;margin-bottom:1pt">${cs}</div>
          <div style="font-weight:400;font-size:9pt">${formatNum(item.rate)}</div>
        </td>
        <td style="padding:6pt 4pt;font-size:9pt;text-align:right;border:1px solid #edf2f7">
          <div style="font-size:8pt;color:#1a1a1a;font-weight:400;margin-bottom:1pt">${cs}</div>
          <div style="font-weight:400;font-size:9pt">${formatNum(item.computedAmount)}</div>
        </td>
      </tr>
    `).join('')
    : `<tr><td colspan="7" style="padding:18pt;text-align:center;color:#a0aec0;font-style:italic;border:1px solid #edf2f7">No items in invoice</td></tr>`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    ${fontCss}
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Open Sans', Helvetica, Arial, sans-serif;
      font-size: 9pt;
      color: #1a1a1a;
      line-height: 1.4;
      background: #ffffff;
    }
    @page { size: A4 portrait; margin: 0; }
  </style>
</head>
<body>
  <div style="width:210mm;height:297mm;padding:12mm 15mm 10mm 15mm;background:#fff;display:flex;flex-direction:column;justify-content:space-between;overflow:hidden">
    <div>
      <!-- Header -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24pt">
        <div>${logoSvg}</div>
        <div style="text-align:left">
          <div style="font-size:14pt;font-weight:700;color:${brand_color};line-height:1.25;margin-bottom:3pt">${company_name}</div>
          <div style="color:#707e94;font-size:8pt;line-height:1.6">
            <div>${website}</div>
            <div>${email}</div>
            <div>${phone}</div>
          </div>
        </div>
      </div>

      <!-- Title: Sales Invoice — Semibold 18pt per spec -->
      <div style="font-size:18pt;font-weight:600;color:#1a1a1a;margin-bottom:10pt">Sales Invoice</div>

      <!-- Invoice Number — Regular 9.8pt -->
      <div style="color:#707e94;font-size:9.8pt;margin-bottom:10pt">${invoice_number}</div>
      <hr style="border:none;border-top:1px solid #edf2f7;margin:0 0 18pt 0">

      <!-- Customer / Meta — two-column grid -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16pt;margin-bottom:20pt">
        <!-- Left Column: Customer Info -->
        <div style="display:flex;flex-direction:column;gap:10pt">
          <!-- Customer Name: Semibold value -->
          <div style="display:flex;align-items:flex-start">
            <span style="width:90pt;flex-shrink:0;color:#707e94;font-size:9.8pt;font-weight:400">Customer Name:</span>
            <span style="font-weight:600;font-size:9.8pt;color:#1a1a1a">${customer_name}</span>
          </div>
          <!-- Address: Regular value -->
          <div style="display:flex;align-items:flex-start">
            <span style="width:90pt;flex-shrink:0;color:#707e94;font-size:9.8pt;font-weight:400">Address:</span>
            <span style="font-weight:400;font-size:9.8pt;color:#1a1a1a;white-space:pre-line;line-height:1.5">${customer_address}</span>
          </div>
          <!-- Phone: Regular value -->
          <div style="display:flex;align-items:flex-start">
            <span style="width:90pt;flex-shrink:0;color:#707e94;font-size:9.8pt;font-weight:400">Phone No:</span>
            <span style="font-weight:400;font-size:9.8pt;color:#1a1a1a">${customer_phone}</span>
          </div>
        </div>

        <!-- Right Column: Dates — starts ~x=308pt -->
        <div style="display:flex;flex-direction:column;gap:10pt;padding-left:20pt">
          <div style="display:flex;align-items:flex-start">
            <span style="width:95pt;flex-shrink:0;color:#707e94;font-size:9.8pt;font-weight:400">Date:</span>
            <span style="font-weight:600;font-size:9.8pt;color:#1a1a1a">${formatDateStr(invoice_date)}</span>
          </div>
          <div style="display:flex;align-items:flex-start">
            <span style="width:95pt;flex-shrink:0;color:#707e94;font-size:9.8pt;font-weight:400;line-height:1.3">Payment Due<br>Date:</span>
            <span style="font-weight:600;font-size:9.8pt;color:#1a1a1a">${formatDateStr(due_date || invoice_date)}</span>
          </div>
        </div>
      </div>

      <!-- Table — fixed-pt column widths via colgroup -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:16pt;font-size:9pt;border:1px solid #edf2f7">
        <colgroup>
          <col style="width:10mm">   <!-- Sr: ~28.5pt -->
          <col style="width:34mm">   <!-- Item Name: ~96pt -->
          <col style="width:35mm">   <!-- Warranty: ~99.5pt -->
          <col style="width:39mm">   <!-- Serial Number: ~111pt -->
          <col style="width:27.5mm"> <!-- Quantity: ~78pt -->
          <col style="width:15mm">   <!-- Rate: ~43pt -->
          <col style="width:16mm">   <!-- Amount: ~45pt -->
        </colgroup>
        <thead>
          <tr style="background:#fafafa">
            <th style="padding:6pt 4pt;font-size:9pt;font-weight:400;color:#707e94;border:1px solid #edf2f7;text-align:center">Sr</th>
            <th style="padding:6pt 4pt;font-size:9pt;font-weight:400;color:#707e94;border:1px solid #edf2f7;text-align:left">Item Name</th>
            <th style="padding:6pt 4pt;font-size:9pt;font-weight:400;color:#707e94;border:1px solid #edf2f7;text-align:left">Warranty</th>
            <th style="padding:6pt 4pt;font-size:9pt;font-weight:400;color:#707e94;border:1px solid #edf2f7;text-align:left">Serial Number</th>
            <th style="padding:6pt 4pt;font-size:9pt;font-weight:400;color:#707e94;border:1px solid #edf2f7;text-align:center">Quantity</th>
            <th style="padding:6pt 4pt;font-size:9pt;font-weight:400;color:#707e94;border:1px solid #edf2f7;text-align:right">Rate</th>
            <th style="padding:6pt 4pt;font-size:9pt;font-weight:400;color:#707e94;border:1px solid #edf2f7;text-align:right">Amount</th>
          </tr>
        </thead>
        <tbody>${lineItemsHtml}</tbody>
      </table>

      <!-- Totals Section -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24pt">
        <!-- Left: Total Quantity -->
        <div>
          <div style="color:#707e94;font-size:9pt;font-weight:400">Total Quantity:</div>
          <div style="font-weight:400;font-size:9.8pt;color:#1a1a1a;margin-top:3pt">${totalQuantity}</div>
        </div>

        <!-- Right: Totals Grid -->
        <div style="width:230pt">
          <!-- Total -->
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12pt">
            <span style="color:#707e94;font-size:9pt;font-weight:400;width:110pt">Total</span>
            <span style="font-weight:400;font-size:9pt;color:#1a1a1a;text-align:right">${cs} ${formatNum(computedSubtotal)}</span>
          </div>
          <!-- Shipping Charges -->
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6pt">
            <span style="color:#707e94;font-size:9pt;font-weight:400;width:110pt">Shipping Charges</span>
            <span style="font-weight:600;font-size:9pt;color:#1a1a1a;text-align:right">${shipping_free ? 'Free' : `${formatNum(effectiveShipping)} ${cs}`}</span>
          </div>
          <!-- Additional Discount Amount -->
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6pt">
            <span style="color:#707e94;font-size:9pt;font-weight:400;width:110pt">Additional<br>Discount Amount</span>
            <span style="font-weight:600;font-size:9pt;color:#1a1a1a;text-align:right">${discountVal} ${cs}</span>
          </div>
          <!-- Grand Total: Bold label + Bold value -->
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6pt;margin-top:6pt">
            <span style="color:#1a1a1a;font-size:9pt;font-weight:700;width:110pt">Grand Total:</span>
            <span style="font-weight:700;font-size:9.8pt;color:#1a1a1a;text-align:right">${cs} ${formatNum(grandTotal)}</span>
          </div>
          <!-- In Words -->
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-top:10pt">
            <span style="color:#707e94;font-size:9pt;font-weight:400;width:110pt">In Words:</span>
            <span style="font-weight:600;font-size:8.5pt;color:#1a1a1a;text-align:right;line-height:1.4">${inWords}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Section: Notes & Terms -->
    <div>
      ${notes ? `
        <div style="margin-bottom:16pt">
          <div style="font-weight:700;font-size:9.8pt;color:#1a1a1a;margin-bottom:4pt">Notes</div>
          <div style="color:#2d3748;font-size:9pt;line-height:1.5">${notes}</div>
        </div>
      ` : ''}

      ${terms ? `
        <div>
          <div style="font-weight:700;font-size:9.8pt;color:#1a1a1a;margin-bottom:4pt">Terms and Conditions</div>
          <div style="color:#2d3748;font-size:8.5pt;line-height:1.55;white-space:pre-line">${terms}</div>
        </div>
      ` : ''}
    </div>
  </div>
</body>
</html>`;
}
