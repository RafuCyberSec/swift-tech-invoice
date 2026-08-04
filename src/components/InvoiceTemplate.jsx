'use client';

import { amountToWords } from '@/lib/numberToWords';

/**
 * InvoiceTemplate — 1:1 Finalized Replica matching ACC-SINV-2026-00084.pdf
 */
export default function InvoiceTemplate({ invoice = {}, settings = {}, scale = 1 }) {
  const {
    invoiceNumber = 'ACC-SINV-2026-00084',
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
    currency_name = 'PKR',
    logo_path = '/logo.svg',
  } = settings;

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
          padding: '16mm 16mm 16mm 16mm',
          background: '#ffffff',
          color: '#1a1a1a',
          fontFamily: "'Open Sans', 'Inter', Helvetica, Arial, sans-serif",
          fontSize: '12px',
          lineHeight: '1.5',
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
              marginBottom: '36px',
            }}
          >
            {/* Logo */}
            <div style={{ flexShrink: 0 }}>
              <img
                src={logo_path}
                alt={company_name}
                style={{
                  height: '95px',
                  width: 'auto',
                  objectFit: 'contain',
                }}
              />
            </div>

            {/* Company Info — LEFT-ALIGNED inside right block */}
            <div style={{ textAlign: 'left' }}>
              <div
                style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: brand_color,
                  lineHeight: '1.25',
                  marginBottom: '4px',
                }}
              >
                {company_name}
              </div>
              <div style={{ color: '#707e94', fontSize: '10.5px', lineHeight: '1.6' }}>
                <div>{website}</div>
                <div>{email}</div>
                <div>{phone}</div>
              </div>
            </div>
          </div>

          {/* ====== 2. DOCUMENT TITLE ====== */}
          <div
            style={{
              fontSize: '26px',
              fontWeight: 700,
              color: '#1a1a1a',
              marginBottom: '16px',
            }}
          >
            Sales Invoice
          </div>

          {/* ====== 3. INVOICE NUMBER ====== */}
          <div
            style={{
              color: '#707e94',
              fontSize: '11.5px',
              marginBottom: '16px',
            }}
          >
            {invoiceNumber}
          </div>

          <hr
            style={{
              border: 'none',
              borderTop: '1px solid #edf2f7',
              margin: '0 0 28px 0',
            }}
          />

          {/* ====== 4. BILL-TO / META TWO-COLUMN BLOCK ====== */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '24px',
              marginBottom: '32px',
            }}
          >
            {/* Left Column — Customer Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Customer Name — BOLD */}
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <span style={metaLabelStyle}>Customer Name:</span>
                <span style={{ ...metaValueStyle, fontWeight: 700 }}>{customerName}</span>
              </div>

              {/* Address — NOT BOLD */}
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <span style={metaLabelStyle}>Address:</span>
                <span style={{ ...metaValueStyle, fontWeight: 400, whiteSpace: 'pre-line', lineHeight: '1.6' }}>
                  {customerAddress}
                </span>
              </div>

              {/* Phone No — NOT BOLD */}
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <span style={metaLabelStyle}>Phone No:</span>
                <span style={{ ...metaValueStyle, fontWeight: 400 }}>{customerPhone}</span>
              </div>
            </div>

            {/* Right Column — Dates — NOT BOLD */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Date */}
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <span style={metaDateLabelStyle}>Date:</span>
                <span style={{ ...metaValueStyle, fontWeight: 400 }}>{formatDateStr(invoiceDate)}</span>
              </div>

              {/* Payment Due Date */}
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <span style={metaDateLabelStyle}>Payment Due<br />Date:</span>
                <span style={{ ...metaValueStyle, fontWeight: 400 }}>{formatDateStr(dueDate || invoiceDate)}</span>
              </div>
            </div>
          </div>

          {/* ====== 5. LINE ITEMS TABLE ====== */}
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              marginBottom: '24px',
              fontSize: '11.5px',
              border: '1px solid #edf2f7',
            }}
          >
            <thead>
              <tr style={{ backgroundColor: '#fafafa' }}>
                <th style={{ ...thStyle, width: '5%', textAlign: 'center' }}>Sr</th>
                <th style={{ ...thStyle, width: '35%', textAlign: 'left' }}>Item Name</th>
                <th style={{ ...thStyle, width: '14%', textAlign: 'left' }}>Warranty</th>
                <th style={{ ...thStyle, width: '15%', textAlign: 'left' }}>Serial Number</th>
                <th style={{ ...thStyle, width: '11%', textAlign: 'center' }}>Quantity</th>
                <th style={{ ...thStyle, width: '10%', textAlign: 'right' }}>Rate</th>
                <th style={{ ...thStyle, width: '10%', textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {processedItems.length > 0 ? (
                processedItems.map((item, index) => (
                  <tr key={index} style={{ borderTop: '1px solid #edf2f7' }}>
                    {/* Sr — NOT BOLD */}
                    <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 400 }}>
                      {index + 1}
                    </td>

                    {/* Item Name — BOLD */}
                    <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 700 }}>
                      {item.itemName || ''}
                    </td>

                    {/* Warranty — LEFT-ALIGNED, NOT BOLD */}
                    <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 400 }}>
                      {item.warranty || 'N/A'}
                    </td>

                    {/* Serial Number — LEFT-ALIGNED, NOT BOLD */}
                    <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 400 }}>
                      {item.serialNumber || 'N/A'}
                    </td>

                    {/* Quantity: Unit on left, number on right — NOT BOLD */}
                    <td style={tdStyle}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0 4px',
                        }}
                      >
                        <span style={{ fontSize: '10.5px', color: '#1a1a1a', fontWeight: 400 }}>
                          {item.unit || 'Unit'}
                        </span>
                        <span style={{ fontWeight: 400, fontSize: '11.5px' }}>
                          {item.quantity || 1}
                        </span>
                      </div>
                    </td>

                    {/* Rate: Rs top right, rate below — NOT BOLD */}
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '10.5px', color: '#1a1a1a', fontWeight: 400, marginBottom: '2px' }}>
                          Rs
                        </div>
                        <div style={{ fontWeight: 400, fontSize: '11.5px' }}>
                          {formatNum(item.rate)}
                        </div>
                      </div>
                    </td>

                    {/* Amount: Rs top right, net amount below — NOT BOLD */}
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '10.5px', color: '#1a1a1a', fontWeight: 400, marginBottom: '2px' }}>
                          Rs
                        </div>
                        <div style={{ fontWeight: 400, fontSize: '11.5px' }}>
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
                      padding: '24px',
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
              marginBottom: '40px',
            }}
          >
            {/* Left Side: Total Quantity (Label on top, Value on line below — NOT BOLD) */}
            <div>
              <div style={{ color: '#707e94', fontSize: '11.5px', fontWeight: 400 }}>
                Total Quantity:
              </div>
              <div style={{ fontWeight: 400, fontSize: '12px', color: '#1a1a1a', marginTop: '4px' }}>
                {totalQuantity}
              </div>
            </div>

            {/* Right Side: Totals Grid */}
            <div style={{ width: '310px' }}>
              {/* Total — NOT BOLD */}
              <div style={{ ...totalsRowStyle, marginBottom: '50px' }}>
                <span style={totalsLabelStyle}>Total</span>
                <span style={{ ...totalsValueStyle, fontWeight: 400 }}>Rs {formatNum(computedSubtotal)}</span>
              </div>

              {/* Shipping Charges — BOLD */}
              <div style={totalsRowStyle}>
                <span style={totalsLabelStyle}>Shipping Charges</span>
                <span style={{ ...totalsValueStyle, fontWeight: 700 }}>
                  {shippingFree ? 'Free' : `${formatNum(effectiveShipping)} Rs`}
                </span>
              </div>

              {/* Additional Discount Amount — BOLD */}
              <div style={totalsRowStyle}>
                <span style={totalsLabelStyle}>Additional<br />Discount Amount</span>
                <span style={{ ...totalsValueStyle, fontWeight: 700 }}>{discountVal} Rs</span>
              </div>

              {/* Grand Total — BOLD */}
              <div style={{ ...totalsRowStyle, marginTop: '10px' }}>
                <span style={{ ...totalsLabelStyle, fontWeight: 700, color: '#1a1a1a' }}>
                  Grand Total:
                </span>
                <span style={{ ...totalsValueStyle, fontWeight: 700, fontSize: '12px', color: '#1a1a1a' }}>
                  Rs {formatNum(grandTotal)}
                </span>
              </div>

              {/* In Words — BOLD */}
              <div style={{ ...totalsRowStyle, marginTop: '14px', alignItems: 'flex-start' }}>
                <span style={totalsLabelStyle}>In Words:</span>
                <span
                  style={{
                    ...totalsValueStyle,
                    fontWeight: 700,
                    fontSize: '11px',
                    color: '#1a1a1a',
                    lineHeight: '1.45',
                  }}
                >
                  {inWords}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: Notes & Terms (pushed down to fill A4 page gracefully) */}
        <div style={{ marginTop: '40px' }}>
          {/* ====== 7. NOTES ====== */}
          {notes && (
            <div style={{ marginBottom: '24px' }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: '12.5px',
                  color: '#1a1a1a',
                  marginBottom: '6px',
                }}
              >
                Notes
              </div>
              <div style={{ color: '#2d3748', fontSize: '11px', lineHeight: '1.6' }}>{notes}</div>
            </div>
          )}

          {/* ====== 8. TERMS AND CONDITIONS ====== */}
          {terms && (
            <div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: '12.5px',
                  color: '#1a1a1a',
                  marginBottom: '6px',
                }}
              >
                Terms and Conditions
              </div>
              <div
                style={{
                  color: '#2d3748',
                  fontSize: '10.5px',
                  lineHeight: '1.65',
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
// Style Helpers
// ============================================================

const metaLabelStyle = {
  width: '120px',
  flexShrink: 0,
  color: '#707e94',
  fontSize: '11.5px',
  fontWeight: 400,
};

const metaDateLabelStyle = {
  width: '125px',
  flexShrink: 0,
  color: '#707e94',
  fontSize: '11.5px',
  fontWeight: 400,
  lineHeight: '1.35',
};

const metaValueStyle = {
  fontSize: '12px',
  color: '#1a1a1a',
  flexGrow: 1,
};

const thStyle = {
  padding: '8px 6px',
  fontSize: '11px',
  fontWeight: 400,
  color: '#707e94',
  border: '1px solid #edf2f7',
  boxSizing: 'border-box',
};

const tdStyle = {
  padding: '8px 6px',
  fontSize: '11.5px',
  color: '#1a1a1a',
  verticalAlign: 'middle',
  border: '1px solid #edf2f7',
  boxSizing: 'border-box',
};

const totalsRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '8px',
};

const totalsLabelStyle = {
  color: '#707e94',
  fontSize: '11px',
  fontWeight: 400,
  width: '150px',
  lineHeight: '1.35',
};

const totalsValueStyle = {
  fontSize: '11.5px',
  color: '#1a1a1a',
  textAlign: 'right',
  flexGrow: 1,
};
