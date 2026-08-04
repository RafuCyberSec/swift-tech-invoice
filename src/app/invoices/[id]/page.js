'use client';

import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import InvoiceTemplate from '@/components/InvoiceTemplate';

export default function InvoiceDetailPage({ params }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const router = useRouter();
  const [invoice, setInvoice] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInvoice();
    fetchSettings();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      const res = await fetch(`/api/invoices/${id}`);
      if (res.ok) {
        const data = await res.json();
        setInvoice(data);
      } else {
        setError('Invoice not found');
      }
    } catch {
      setError('Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/company');
      if (res.ok) {
        setSettings(await res.json());
      }
    } catch {
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

  const handlePrint = () => {
    window.print();
  };

  const handleDuplicate = async () => {
    if (!invoice) return;
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: invoice.customer_name,
          customer_address: invoice.customer_address,
          customer_phone: invoice.customer_phone,
          invoice_date: new Date().toISOString().split('T')[0],
          due_date: '',
          line_items: invoice.line_items,
          shipping_charges: invoice.shipping_charges,
          shipping_free: invoice.shipping_free,
          discount_amount: invoice.discount_amount,
          notes: invoice.notes,
          terms: invoice.terms,
          status: 'draft',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/invoices/${data.invoiceId}`);
      }
    } catch {
      alert('Failed to duplicate invoice');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete');
      }
    } catch {
      alert('Failed to delete invoice');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: 'var(--muted)' }}>Loading invoice...</div>
        </main>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>{error || 'Invoice not found'}</div>
            <button className="btn btn-outline" onClick={() => router.push('/')}>Back to Dashboard</button>
          </div>
        </main>
      </div>
    );
  }

  const canEdit =
    session?.user?.role === 'admin' ||
    String(invoice.created_by) === String(session?.user?.id);

  const canDelete =
    session?.user?.role === 'admin' ||
    (String(invoice.created_by) === String(session?.user?.id) && invoice.status === 'draft');

  const templateInvoice = {
    invoiceNumber: invoice.invoice_number,
    customerName: invoice.customer_name,
    customerAddress: invoice.customer_address,
    customerPhone: invoice.customer_phone,
    invoiceDate: invoice.invoice_date,
    dueDate: invoice.due_date,
    lineItems: invoice.line_items || [],
    shippingCharges: invoice.shipping_charges,
    shippingFree: !!invoice.shipping_free,
    discountAmount: invoice.discount_amount,
    notes: invoice.notes,
    terms: invoice.terms,
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, overflow: 'auto', background: 'var(--surface)' }}>
        {/* Action bar */}
        <div
          className="no-print"
          style={{
            padding: '16px 32px',
            borderBottom: '1px solid var(--border)',
            background: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button className="btn btn-ghost" onClick={() => router.push('/')}>
              ← Back
            </button>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 600 }}>{invoice.invoice_number}</h2>
              <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                {invoice.customer_name} • Created by {invoice.creator_name}
              </div>
            </div>
            <span
              style={{
                padding: '3px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 500,
                background: invoice.status === 'final' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
                color: invoice.status === 'final' ? 'var(--success)' : 'var(--warning)',
              }}
            >
              {invoice.status}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <a
              href={`/api/pdf/${id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-brand btn-sm"
              style={{ textDecoration: 'none' }}
            >
              📥 Download PDF
            </a>
            <button className="btn btn-outline btn-sm" onClick={handlePrint}>
              🖨 Print
            </button>
            <button className="btn btn-outline btn-sm" onClick={handleDuplicate}>
              📋 Duplicate
            </button>
            {canDelete && (
              <button className="btn btn-ghost btn-sm" onClick={handleDelete} style={{ color: 'var(--danger)' }}>
                🗑 Delete
              </button>
            )}
          </div>
        </div>

        {/* Invoice preview */}
        <div
          style={{
            padding: '40px',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
              borderRadius: '4px',
              overflow: 'hidden',
            }}
          >
            <InvoiceTemplate
              invoice={templateInvoice}
              settings={settings || {}}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
