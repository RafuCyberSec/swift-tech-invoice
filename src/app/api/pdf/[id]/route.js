import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getInvoiceById, getSettings } from '@/lib/db';
import { amountToWords } from '@/lib/numberToWords';

/**
 * PDF Export API
 * Generates a pixel-perfect PDF matching ACC-SINV-2026-00084.pdf
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
    const html = buildInvoiceHtml(invoice, settings);

    try {
      const puppeteer = await import('puppeteer');
      const browser = await puppeteer.default.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
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

function buildInvoiceHtml(invoice, settings) {
  const {
    invoice_number = 'ACC-SINV-2026-00084',
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

  const logoSvg = `<svg width="400" height="241" viewBox="0 0 400 241" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M128.227 0L0 240.387L163.305 240.398L235.04 105.916L286.908 192.375L243.36 192.372L217.74 240.402L381.045 240.412L236.968 0.248474L134.49 192.365L80.0546 192.362L182.664 1.20656e-07L128.227 0Z" fill="${brand_color}"/>
    <path d="M345.563 2.04553e-05L308.359 69.746L337.175 117.779L400 2.05292e-05L345.563 2.04553e-05Z" fill="${brand_color}"/>
  </svg>`;

  const lineItemsHtml = processedItems.length > 0
    ? processedItems.map((item, i) => `
      <tr style="border-top:1px solid #edf2f7">
        <td style="padding:8px 6px;font-size:11.5px;font-weight:400;text-align:center;border:1px solid #edf2f7">${i + 1}</td>
        <td style="padding:8px 6px;font-size:11.5px;font-weight:700;text-align:left;border:1px solid #edf2f7">${item.itemName || ''}</td>
        <td style="padding:8px 6px;font-size:11.5px;font-weight:400;text-align:left;border:1px solid #edf2f7">${item.warranty || 'N/A'}</td>
        <td style="padding:8px 6px;font-size:11.5px;font-weight:400;text-align:left;border:1px solid #edf2f7">${item.serialNumber || 'N/A'}</td>
        <td style="padding:8px 6px;font-size:11.5px;border:1px solid #edf2f7">
          <div style="display:flex;justify-content:space-between;align-items:center;padding:0 4px">
            <span style="font-size:10.5px;color:#1a1a1a;font-weight:400">${item.unit || 'Unit'}</span>
            <span style="font-weight:400;font-size:11.5px">${item.quantity || 1}</span>
          </div>
        </td>
        <td style="padding:8px 6px;font-size:11.5px;text-align:right;border:1px solid #edf2f7">
          <div style="font-size:10.5px;color:#1a1a1a;font-weight:400;margin-bottom:2px">Rs</div>
          <div style="font-weight:400;font-size:11.5px">${formatNum(item.rate)}</div>
        </td>
        <td style="padding:8px 6px;font-size:11.5px;text-align:right;border:1px solid #edf2f7">
          <div style="font-size:10.5px;color:#1a1a1a;font-weight:400;margin-bottom:2px">Rs</div>
          <div style="font-weight:400;font-size:11.5px">${formatNum(item.computedAmount)}</div>
        </td>
      </tr>
    `).join('')
    : `<tr><td colSpan="7" style="padding:24px;text-align:center;color:#a0aec0;font-style:italic;border:1px solid #edf2f7">No items in invoice</td></tr>`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300..800;1,300..800&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Open Sans', Helvetica, Arial, sans-serif; font-size: 11.5px; color: #1a1a1a; line-height: 1.5; background: #ffffff; }
    @page { size: A4 portrait; margin: 0; }
  </style>
</head>
<body>
  <div style="width:210mm;min-height:297mm;padding:16mm 16mm 16mm 16mm;background:#fff;display:flex;flex-direction:column;justify-content:space-between">
    <div>
      <!-- Header -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:36px">
        <div>${logoSvg.replace(/width="400" height="241"/, 'width="155" height="95"')}</div>
        <div style="text-align:left">
          <div style="font-size:20px;font-weight:700;color:${brand_color};line-height:1.25;margin-bottom:4px">${company_name}</div>
          <div style="color:#707e94;font-size:10.5px;line-height:1.6">
            <div>${website}</div>
            <div>${email}</div>
            <div>${phone}</div>
          </div>
        </div>
      </div>
      
      <!-- Title -->
      <div style="font-size:26px;font-weight:700;color:#1a1a1a;margin-bottom:16px">Sales Invoice</div>
      <div style="color:#707e94;font-size:11.5px;margin-bottom:16px">${invoice_number}</div>
      <hr style="border:none;border-top:1px solid #edf2f7;margin:0 0 28px 0">
      
      <!-- Customer / Meta -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:32px">
        <div style="display:flex;flex-direction:column;gap:14px">
          <div style="display:flex;align-items:flex-start">
            <span style="width:120px;flex-shrink:0;color:#707e94;font-size:11.5px;font-weight:400">Customer Name:</span>
            <span style="font-weight:700;font-size:12px;color:#1a1a1a">${customer_name}</span>
          </div>
          <div style="display:flex;align-items:flex-start">
            <span style="width:120px;flex-shrink:0;color:#707e94;font-size:11.5px;font-weight:400">Address:</span>
            <span style="font-weight:400;font-size:12px;color:#1a1a1a;white-space:pre-line;line-height:1.6">${customer_address}</span>
          </div>
          <div style="display:flex;align-items:flex-start">
            <span style="width:120px;flex-shrink:0;color:#707e94;font-size:11.5px;font-weight:400">Phone No:</span>
            <span style="font-weight:400;font-size:12px;color:#1a1a1a">${customer_phone}</span>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:14px">
          <div style="display:flex;align-items:flex-start">
            <span style="width:125px;flex-shrink:0;color:#707e94;font-size:11.5px;font-weight:400">Date:</span>
            <span style="font-weight:400;font-size:12px;color:#1a1a1a">${formatDateStr(invoice_date)}</span>
          </div>
          <div style="display:flex;align-items:flex-start">
            <span style="width:125px;flex-shrink:0;color:#707e94;font-size:11.5px;font-weight:400;line-height:1.35">Payment Due<br>Date:</span>
            <span style="font-weight:400;font-size:12px;color:#1a1a1a">${formatDateStr(due_date || invoice_date)}</span>
          </div>
        </div>
      </div>
      
      <!-- Table -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:11.5px;border:1px solid #edf2f7">
        <thead>
          <tr style="background:#fafafa">
            <th style="padding:8px 6px;font-size:11px;font-weight:400;color:#707e94;border:1px solid #edf2f7;text-align:center;width:5%">Sr</th>
            <th style="padding:8px 6px;font-size:11px;font-weight:400;color:#707e94;border:1px solid #edf2f7;text-align:left;width:40%">Item Name</th>
            <th style="padding:8px 6px;font-size:11px;font-weight:400;color:#707e94;border:1px solid #edf2f7;text-align:left;width:14%">Warranty</th>
            <th style="padding:8px 6px;font-size:11px;font-weight:400;color:#707e94;border:1px solid #edf2f7;text-align:left;width:15%">Serial Number</th>
            <th style="padding:8px 6px;font-size:11px;font-weight:400;color:#707e94;border:1px solid #edf2f7;text-align:center;width:10%">Quantity</th>
            <th style="padding:8px 6px;font-size:11px;font-weight:400;color:#707e94;border:1px solid #edf2f7;text-align:right;width:8%">Rate</th>
            <th style="padding:8px 6px;font-size:11px;font-weight:400;color:#707e94;border:1px solid #edf2f7;text-align:right;width:8%">Amount</th>
          </tr>
        </thead>
        <tbody>${lineItemsHtml}</tbody>
      </table>
      
      <!-- Totals -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px">
        <div>
          <div style="color:#707e94;font-size:11.5px;font-weight:400">Total Quantity:</div>
          <div style="font-weight:400;font-size:12px;color:#1a1a1a;margin-top:4px">${totalQuantity}</div>
        </div>
        <div style="width:310px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:50px">
            <span style="color:#707e94;font-size:11px;font-weight:400;width:150px">Total</span>
            <span style="font-weight:400;font-size:11.5px;color:#1a1a1a;text-align:right">Rs ${formatNum(computedSubtotal)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <span style="color:#707e94;font-size:11px;font-weight:400;width:150px">Shipping Charges</span>
            <span style="font-weight:700;font-size:11.5px;color:#1a1a1a;text-align:right">${shipping_free ? 'Free' : `${formatNum(effectiveShipping)} Rs`}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <span style="color:#707e94;font-size:11px;font-weight:400;width:150px">Additional<br>Discount Amount</span>
            <span style="font-weight:700;font-size:11.5px;color:#1a1a1a;text-align:right">${discountVal} Rs</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;margin-top:8px">
            <span style="color:#1a1a1a;font-size:11px;font-weight:700;width:150px">Grand Total:</span>
            <span style="font-weight:700;font-size:12px;color:#1a1a1a;text-align:right">Rs ${formatNum(grandTotal)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-top:14px">
            <span style="color:#707e94;font-size:11px;font-weight:400;width:150px">In Words:</span>
            <span style="font-weight:700;font-size:11px;color:#1a1a1a;text-align:right;line-height:1.45">${inWords}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Section: Notes & Terms -->
    <div style="margin-top:auto;padding-top:20px">
      ${notes ? `
        <div style="margin-bottom:24px">
          <div style="font-weight:700;font-size:12.5px;color:#1a1a1a;margin-bottom:6px">Notes</div>
          <div style="color:#2d3748;font-size:11px;line-height:1.6">${notes}</div>
        </div>
      ` : ''}

      ${terms ? `
        <div>
          <div style="font-weight:700;font-size:12.5px;color:#1a1a1a;margin-bottom:6px">Terms and Conditions</div>
          <div style="color:#2d3748;font-size:10.5px;line-height:1.65;white-space:pre-line">${terms}</div>
        </div>
      ` : ''}
    </div>
  </div>
</body>
</html>`;
}
