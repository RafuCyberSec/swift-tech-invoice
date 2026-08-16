'use client';

import { amountToWords } from '@/lib/numberToWords';

/**
 * InvoiceTemplate — Pixel-perfect replica matching ACC-SINV-2026-00087.pdf
 *
 * Font weight spec:
 *   - Title "Sales Invoice": Semibold (600)
 *   - Customer name, date values: Semibold (600)
 *   - Item Name in table body: Semibold (600)
 *   - Notes / Terms headers: Bold (700)
 *   - Grand Total label: Bold (700)
 *   - Company brand name: Bold (700)
 *   - Everything else: Regular (400)
 *
 * Currency: ₨ glyph (not "Rs")
 */
export default function InvoiceTemplate({ invoice = {}, settings = {}, scale = 1 }) {
  const {
    invoiceNumber = 'ACC-SINV-2026-00087',
    customerName = '',
    customerAddress = '',
    customerPhone = '',
    invoiceDate = '',
    dueDate = '',
    lineItems = [],
    shippingCharges = 0,
    shippingFree = false,
    discountAmount = 0,
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

  // Currency symbol — always use ₨ glyph
  const cs = currency_symbol || '₨';

  // Total quantity calculation
  const totalQuantity = lineItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  // Raw subtotal
  const totalRawSubtotal = lineItems.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.rate) || 0),
    0
  );

  const discountVal = Number(discountAmount) || 0;

  // Process line items with computed amounts after discount
  const processedItems = lineItems.map((item) => {
    const qty = Number(item.quantity) || 0;
    const rate = Number(item.rate) || 0;
    const itemRaw = qty * rate;

    let itemDiscount = Number(item.discount) || 0;
    if (!itemDiscount && discountVal > 0) {
      if (lineItems.length === 1) {
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
  const effectiveShipping = shippingFree ? 0 : Number(shippingCharges) || 0;
  const grandTotal = computedSubtotal + effectiveShipping;
  const inWords = amountToWords(grandTotal, currency_name);

  // Format date helper: DD-MM-YYYY
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

  return (
    <div
      className="invoice-template-root"
      style={{
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: 'top left',
      }}
    >
      <div
        className="invoice-page"
        style={{
          width: '210mm',
          minHeight: '297mm',
          padding: '12mm 15mm 10mm 15mm',
          background: '#ffffff',
          color: '#1a1a1a',
          fontFamily: "'Open Sans', 'Inter', Helvetica, Arial, sans-serif",
          fontSize: '9pt',
          lineHeight: '1.4',
          boxSizing: 'border-box',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div>
          {/* ====== 1. HEADER BAND ====== */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '24pt',
            }}
          >
            {/* Logo — inline SVG, no <img> tag, brand_color applied directly */}
            <div style={{ flexShrink: 0 }}>
              <svg
                width="120"
                height="72"
                viewBox="0 0 400 241"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M128.227 0L0 240.387L163.305 240.398L235.04 105.916L286.908 192.375L243.36 192.372L217.74 240.402L381.045 240.412L236.968 0.248474L134.49 192.365L80.0546 192.362L182.664 1.20656e-07L128.227 0Z"
                  fill={brand_color}
                />
                <path
                  d="M345.563 2.04553e-05L308.359 69.746L337.175 117.779L400 2.05292e-05L345.563 2.04553e-05Z"
                  fill={brand_color}
                />
              </svg>
            </div>

            {/* Company Info — Bold brand name (700) */}
            <div style={{ textAlign: 'left' }}>
              <div
                style={{
                  fontSize: '14pt',
                  fontWeight: 700,
                  color: brand_color,
                  lineHeight: '1.25',
                  marginBottom: '3pt',
                }}
              >
                {company_name}
              </div>
              <div style={{ color: '#707e94', fontSize: '8pt', lineHeight: '1.6' }}>
                <div>{website}</div>
                <div>{email}</div>
                <div>{phone}</div>
              </div>
            </div>
          </div>

          {/* ====== 2. DOCUMENT TITLE — Semibold (600), 18pt ====== */}
          <div
            style={{
              fontSize: '18pt',
              fontWeight: 600,
              color: '#1a1a1a',
              marginBottom: '10pt',
            }}
          >
            Sales Invoice
          </div>

          {/* ====== 3. INVOICE NUMBER — Regular (400), 9.8pt ====== */}
          <div
            style={{
              color: '#707e94',
              fontSize: '9.8pt',
              marginBottom: '10pt',
            }}
          >
            {invoiceNumber}
          </div>

          <hr
            style={{
              border: 'none',
              borderTop: '1px solid #edf2f7',
              margin: '0 0 18pt 0',
            }}
          />

          {/* ====== 4. BILL-TO / META TWO-COLUMN BLOCK ====== */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16pt',
              marginBottom: '20pt',
            }}
          >
            {/* Left Column — Customer Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10pt' }}>
              {/* Customer Name — Semibold (600) */}
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <span style={metaLabelStyle}>Customer Name:</span>
                <span style={{ ...metaValueStyle, fontWeight: 600 }}>{customerName}</span>
              </div>

              {/* Address — Regular (400) */}
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <span style={metaLabelStyle}>Address:</span>
                <span style={{ ...metaValueStyle, fontWeight: 400, whiteSpace: 'pre-line', lineHeight: '1.5' }}>
                  {customerAddress}
                </span>
              </div>

              {/* Phone No — Regular (400) */}
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <span style={metaLabelStyle}>Phone No:</span>
                <span style={{ ...metaValueStyle, fontWeight: 400 }}>{customerPhone}</span>
              </div>
            </div>

            {/* Right Column — Dates — Semibold values (600) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10pt', paddingLeft: '20pt' }}>
              {/* Date */}
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <span style={metaDateLabelStyle}>Date:</span>
                <span style={{ ...metaValueStyle, fontWeight: 600 }}>{formatDateStr(invoiceDate)}</span>
              </div>

              {/* Payment Due Date */}
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <span style={metaDateLabelStyle}>Payment Due<br />Date:</span>
                <span style={{ ...metaValueStyle, fontWeight: 600 }}>{formatDateStr(dueDate || invoiceDate)}</span>
              </div>
            </div>
          </div>

          {/* ====== 5. LINE ITEMS TABLE — fixed-pt column widths ====== */}
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              marginBottom: '16pt',
              fontSize: '9pt',
              border: '1px solid #edf2f7',
            }}
          >
            <colgroup>
              <col style={{ width: '10mm' }} />   {/* Sr */}
              <col style={{ width: '34mm' }} />   {/* Item Name */}
              <col style={{ width: '35mm' }} />   {/* Warranty */}
              <col style={{ width: '39mm' }} />   {/* Serial Number */}
              <col style={{ width: '27.5mm' }} /> {/* Quantity */}
              <col style={{ width: '15mm' }} />   {/* Rate */}
              <col style={{ width: '16mm' }} />   {/* Amount */}
            </colgroup>
            <thead>
              <tr style={{ backgroundColor: '#fafafa' }}>
                <th style={{ ...thStyle, textAlign: 'center' }}>Sr</th>
                <th style={{ ...thStyle, textAlign: 'left' }}>Item Name</th>
                <th style={{ ...thStyle, textAlign: 'left' }}>Warranty</th>
                <th style={{ ...thStyle, textAlign: 'left' }}>Serial Number</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Quantity</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Rate</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {processedItems.length > 0 ? (
                processedItems.map((item, index) => (
                  <tr key={index} style={{ borderTop: '1px solid #edf2f7' }}>
                    {/* Sr — Regular (400) */}
                    <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 400 }}>
                      {index + 1}
                    </td>

                    {/* Item Name — Semibold (600) */}
                    <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 600 }}>
                      {item.itemName || ''}
                    </td>

                    {/* Warranty — Regular (400) */}
                    <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 400 }}>
                      {item.warranty || 'N/A'}
                    </td>

                    {/* Serial Number — Regular (400) */}
                    <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 400 }}>
                      {item.serialNumber || 'N/A'}
                    </td>

                    {/* Quantity: Unit on left, number on right — Regular (400) */}
                    <td style={tdStyle}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0 2pt',
                        }}
                      >
                        <span style={{ fontSize: '8pt', color: '#1a1a1a', fontWeight: 400 }}>
                          {item.unit || 'Unit'}
                        </span>
                        <span style={{ fontWeight: 400, fontSize: '9pt' }}>
                          {item.quantity || 1}
                        </span>
                      </div>
                    </td>

                    {/* Rate: ₨ top right, rate below — Regular (400) */}
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '8pt', color: '#1a1a1a', fontWeight: 400, marginBottom: '1pt' }}>
                          {cs}
                        </div>
                        <div style={{ fontWeight: 400, fontSize: '9pt' }}>
                          {formatNum(item.rate)}
                        </div>
                      </div>
                    </td>

                    {/* Amount: ₨ top right, net amount below — Regular (400) */}
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '8pt', color: '#1a1a1a', fontWeight: 400, marginBottom: '1pt' }}>
                          {cs}
                        </div>
                        <div style={{ fontWeight: 400, fontSize: '9pt' }}>
                          {formatNum(item.computedAmount)}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    style={{
                      padding: '18pt',
                      textAlign: 'center',
                      color: '#a0aec0',
                      fontStyle: 'italic',
                      borderTop: '1px solid #edf2f7',
                    }}
                  >
                    No items in invoice
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* ====== 6. TOTALS & SUMMARY SECTION ====== */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '24pt',
            }}
          >
            {/* Left Side: Total Quantity — Regular (400) */}
            <div>
              <div style={{ color: '#707e94', fontSize: '9pt', fontWeight: 400 }}>
                Total Quantity:
              </div>
              <div style={{ fontWeight: 400, fontSize: '9.8pt', color: '#1a1a1a', marginTop: '3pt' }}>
                {totalQuantity}
              </div>
            </div>

            {/* Right Side: Totals Grid */}
            <div style={{ width: '230pt' }}>
              {/* Total — Regular (400) */}
              <div style={{ ...totalsRowStyle, marginBottom: '12pt' }}>
                <span style={totalsLabelStyle}>Total</span>
                <span style={{ ...totalsValueStyle, fontWeight: 400 }}>{cs} {formatNum(computedSubtotal)}</span>
              </div>

              {/* Shipping Charges — Semibold (600) */}
              <div style={totalsRowStyle}>
                <span style={totalsLabelStyle}>Shipping Charges</span>
                <span style={{ ...totalsValueStyle, fontWeight: 600 }}>
                  {shippingFree ? 'Free' : `${formatNum(effectiveShipping)} ${cs}`}
                </span>
              </div>

              {/* Additional Discount Amount — Semibold (600) */}
              <div style={totalsRowStyle}>
                <span style={totalsLabelStyle}>Additional<br />Discount Amount</span>
                <span style={{ ...totalsValueStyle, fontWeight: 600 }}>{discountVal} {cs}</span>
              </div>

              {/* Grand Total — Bold (700) label + Bold (700) value */}
              <div style={{ ...totalsRowStyle, marginTop: '6pt' }}>
                <span style={{ ...totalsLabelStyle, fontWeight: 700, color: '#1a1a1a' }}>
                  Grand Total:
                </span>
                <span style={{ ...totalsValueStyle, fontWeight: 700, fontSize: '9.8pt', color: '#1a1a1a' }}>
                  {cs} {formatNum(grandTotal)}
                </span>
              </div>

              {/* In Words — Semibold (600) */}
              <div style={{ ...totalsRowStyle, marginTop: '10pt', alignItems: 'flex-start' }}>
                <span style={totalsLabelStyle}>In Words:</span>
                <span
                  style={{
                    ...totalsValueStyle,
                    fontWeight: 600,
                    fontSize: '8.5pt',
                    color: '#1a1a1a',
                    lineHeight: '1.4',
                  }}
                >
                  {inWords}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: Notes & Terms */}
        <div>
          {/* ====== 7. NOTES — Bold (700) header ====== */}
          {notes && (
            <div style={{ marginBottom: '16pt' }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: '9.8pt',
                  color: '#1a1a1a',
                  marginBottom: '4pt',
                }}
              >
                Notes
              </div>
              <div style={{ color: '#2d3748', fontSize: '9pt', lineHeight: '1.5' }}>{notes}</div>
            </div>
          )}

          {/* ====== 8. TERMS AND CONDITIONS — Bold (700) header ====== */}
          {terms && (
            <div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: '9.8pt',
                  color: '#1a1a1a',
                  marginBottom: '4pt',
                }}
              >
                Terms and Conditions
              </div>
              <div
                style={{
                  color: '#2d3748',
                  fontSize: '8.5pt',
                  lineHeight: '1.55',
                  whiteSpace: 'pre-line',
                }}
              >
                {terms}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Style Helpers — calibrated to original template spec
// ============================================================

const metaLabelStyle = {
  width: '90pt',
  flexShrink: 0,
  color: '#707e94',
  fontSize: '9.8pt',
  fontWeight: 400,
};

const metaDateLabelStyle = {
  width: '95pt',
  flexShrink: 0,
  color: '#707e94',
  fontSize: '9.8pt',
  fontWeight: 400,
  lineHeight: '1.3',
};

const metaValueStyle = {
  fontSize: '9.8pt',
  color: '#1a1a1a',
  flexGrow: 1,
};

const thStyle = {
  padding: '6pt 4pt',
  fontSize: '9pt',
  fontWeight: 400,
  color: '#707e94',
  border: '1px solid #edf2f7',
  boxSizing: 'border-box',
};

const tdStyle = {
  padding: '6pt 4pt',
  fontSize: '9pt',
  color: '#1a1a1a',
  verticalAlign: 'middle',
  border: '1px solid #edf2f7',
  boxSizing: 'border-box',
};

const totalsRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '6pt',
};

const totalsLabelStyle = {
  color: '#707e94',
  fontSize: '9pt',
  fontWeight: 400,
  width: '110pt',
  lineHeight: '1.3',
};

const totalsValueStyle = {
  fontSize: '9pt',
  color: '#1a1a1a',
  textAlign: 'right',
  flexGrow: 1,
};
