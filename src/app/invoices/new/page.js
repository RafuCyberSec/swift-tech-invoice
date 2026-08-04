'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import InvoiceTemplate from '@/components/InvoiceTemplate';

export default function NewInvoicePage() {
  const router = useRouter();
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    customerName: '',
    customerAddress: '',
    customerPhone: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    lineItems: [{ itemName: '', warranty: '', serialNumber: '', quantity: 1, unit: 'Unit', rate: 0 }],
    shippingCharges: 0,
    shippingFree: false,
    discountAmount: 0,
    notes: '',
    terms: '',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/company');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        // Set default notes and terms from settings
        const savedNotes = localStorage.getItem('default_invoice_notes');
        setFormData(prev => ({
          ...prev,
          notes: prev.notes || savedNotes || data.default_notes || '',
          terms: prev.terms || data.default_terms || '',
        }));
      }
    } catch {
      // Settings API might be admin-only, use defaults
      setSettings({
        company_name: 'Swift Tech & Games',
        website: 'swifttechngames.com',
        email: 'info@swifttechngames.com',
        phone: '+92 328 0445543',
        brand_color: '#CC19F4',
        currency_symbol: '₨',
        currency_name: 'PKR',
        logo_path: '/logo.svg',
      });
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Line items management
  const addLineItem = () => {
    setFormData(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, { itemName: '', warranty: '', serialNumber: '', quantity: 1, unit: 'Unit', rate: 0 }],
    }));
  };

  const removeLineItem = (index) => {
    setFormData(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter((_, i) => i !== index),
    }));
  };

  const updateLineItem = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      lineItems: prev.lineItems.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleSave = async (status = 'draft') => {
    setSaving(true);
    setMessage('');

    // Save notes to localStorage to persist across new invoices
    localStorage.setItem('default_invoice_notes', formData.notes);

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: formData.customerName,
          customer_address: formData.customerAddress,
          customer_phone: formData.customerPhone,
          invoice_date: formData.invoiceDate,
          due_date: formData.dueDate,
          line_items: formData.lineItems,
          shipping_charges: formData.shippingFree ? 0 : formData.shippingCharges,
          shipping_free: formData.shippingFree,
          discount_amount: formData.discountAmount,
          notes: formData.notes,
          terms: formData.terms,
          status,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        router.push(`/invoices/${data.invoiceId}`);
      } else {
        setMessage(data.error || 'Failed to save invoice');
      }
    } catch {
      setMessage('Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  // Build the invoice object for the preview
  const previewInvoice = {
    invoiceNumber: 'Auto-generated on save',
    customerName: formData.customerName,
    customerAddress: formData.customerAddress,
    customerPhone: formData.customerPhone,
    invoiceDate: formData.invoiceDate,
    dueDate: formData.dueDate,
    lineItems: formData.lineItems,
    shippingCharges: formData.shippingCharges,
    shippingFree: formData.shippingFree,
    discountAmount: formData.discountAmount,
    notes: formData.notes,
    terms: formData.terms,
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', overflow: 'hidden', background: 'var(--surface)' }}>
        {/* LEFT: Form Panel */}
        <div
          style={{
            width: '460px',
            flexShrink: 0,
            overflow: 'auto',
            padding: '32px 28px',
            borderRight: '1px solid var(--border)',
            background: '#fff',
          }}
        >
          <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>
            New Invoice
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '28px' }}>
            Fill in the details and preview your invoice in real-time
          </p>

          {message && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                marginBottom: '16px',
                background: 'rgba(239,68,68,0.1)',
                color: 'var(--danger)',
                fontSize: '13px',
              }}
            >
              {message}
            </div>
          )}

          {/* Customer Info */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={sectionHeaderStyle}>Customer Information</h3>
            <div style={{ marginBottom: '12px' }}>
              <label className="label">Customer Name</label>
              <input
                className="input"
                value={formData.customerName}
                onChange={(e) => updateField('customerName', e.target.value)}
                placeholder="Enter customer name"
              />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label className="label">Address</label>
              <textarea
                className="input"
                rows="3"
                value={formData.customerAddress}
                onChange={(e) => updateField('customerAddress', e.target.value)}
                placeholder="Street address, city, country"
              />
            </div>
            <div>
              <label className="label">Phone</label>
              <input
                className="input"
                value={formData.customerPhone}
                onChange={(e) => updateField('customerPhone', e.target.value)}
                placeholder="+92 300 1234567"
              />
            </div>
          </div>

          {/* Dates */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={sectionHeaderStyle}>Dates</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="label">Invoice Date</label>
                <input
                  className="input"
                  type="date"
                  value={formData.invoiceDate}
                  onChange={(e) => updateField('invoiceDate', e.target.value)}
                />
              </div>
              <div>
                <label className="label">Due Date</label>
                <input
                  className="input"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => updateField('dueDate', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ ...sectionHeaderStyle, marginBottom: 0 }}>Line Items</h3>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={addLineItem}
              >
                + Add Item
              </button>
            </div>

            {formData.lineItems.map((item, index) => (
              <div
                key={index}
                className="animate-fade-in"
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '14px',
                  marginBottom: '10px',
                  position: 'relative',
                  background: '#fafafa',
                }}
              >
                {formData.lineItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLineItem(index)}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--danger)',
                      cursor: 'pointer',
                      fontSize: '18px',
                      lineHeight: '1',
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}
                    title="Remove item"
                  >
                    ×
                  </button>
                )}

                <div style={{ marginBottom: '8px' }}>
                  <label className="label">Item Name</label>
                  <input
                    className="input"
                    value={item.itemName}
                    onChange={(e) => updateLineItem(index, 'itemName', e.target.value)}
                    placeholder="Product name"
                    style={{ fontSize: '13px', padding: '8px 12px' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                  <div>
                    <label className="label">Warranty</label>
                    <input
                      className="input"
                      value={item.warranty}
                      onChange={(e) => updateLineItem(index, 'warranty', e.target.value)}
                      placeholder="e.g. 10 Month"
                      style={{ fontSize: '13px', padding: '8px 12px' }}
                    />
                  </div>
                  <div>
                    <label className="label">Serial Number</label>
                    <input
                      className="input"
                      value={item.serialNumber}
                      onChange={(e) => updateLineItem(index, 'serialNumber', e.target.value)}
                      placeholder="S/N"
                      style={{ fontSize: '13px', padding: '8px 12px' }}
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <div>
                    <label className="label">Qty</label>
                    <input
                      className="input"
                      type="number"
                      min="0"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(index, 'quantity', Number(e.target.value))}
                      style={{ fontSize: '13px', padding: '8px 12px' }}
                    />
                  </div>
                  <div>
                    <label className="label">Unit</label>
                    <input
                      className="input"
                      value={item.unit}
                      onChange={(e) => updateLineItem(index, 'unit', e.target.value)}
                      placeholder="Unit"
                      style={{ fontSize: '13px', padding: '8px 12px' }}
                    />
                  </div>
                  <div>
                    <label className="label">Rate</label>
                    <input
                      className="input"
                      type="number"
                      min="0"
                      value={item.rate}
                      onChange={(e) => updateLineItem(index, 'rate', Number(e.target.value))}
                      style={{ fontSize: '13px', padding: '8px 12px' }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Shipping & Discount */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={sectionHeaderStyle}>Charges & Discounts</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="label">Shipping Charges</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    value={formData.shippingCharges}
                    onChange={(e) => updateField('shippingCharges', Number(e.target.value))}
                    disabled={formData.shippingFree}
                    style={{ opacity: formData.shippingFree ? 0.5 : 1 }}
                  />
                </div>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginTop: '6px',
                    fontSize: '12px',
                    color: 'var(--muted)',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.shippingFree}
                    onChange={(e) => updateField('shippingFree', e.target.checked)}
                    style={{ accentColor: '#CC19F4' }}
                  />
                  Free shipping
                </label>
              </div>
              <div>
                <label className="label">Discount Amount</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  value={formData.discountAmount}
                  onChange={(e) => updateField('discountAmount', Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Notes & Terms */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={sectionHeaderStyle}>Notes & Terms</h3>
            <div style={{ marginBottom: '12px' }}>
              <label className="label">Notes</label>
              <textarea
                className="input"
                rows="2"
                value={formData.notes}
                onChange={(e) => updateField('notes', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Terms & Conditions</label>
              <textarea
                className="input"
                rows="3"
                value={formData.terms}
                onChange={(e) => updateField('terms', e.target.value)}
              />
            </div>
          </div>

          {/* Save Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '40px' }}>
            <button
              className="btn btn-brand"
              onClick={() => handleSave('final')}
              disabled={saving}
              style={{ flex: 1 }}
            >
              {saving ? 'Saving...' : 'Save & Finalize'}
            </button>
            <button
              className="btn btn-outline"
              onClick={() => handleSave('draft')}
              disabled={saving}
              style={{ flex: 1 }}
            >
              Save as Draft
            </button>
          </div>
        </div>

        {/* RIGHT: Live Preview */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '32px',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <div style={{ transformOrigin: 'top center' }}>
            <div
              style={{
                boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              <InvoiceTemplate
                invoice={previewInvoice}
                settings={settings || {}}
                scale={0.75}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

const sectionHeaderStyle = {
  fontSize: '13px',
  fontWeight: 600,
  color: 'var(--foreground)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '12px',
  paddingBottom: '8px',
  borderBottom: '1px solid var(--border)',
};
