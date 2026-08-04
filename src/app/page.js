'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { formatCurrency } from '@/lib/numberToWords';

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('error=access_denied')) {
      setAccessDenied(true);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async (searchQuery = '') => {
    try {
      const res = await fetch(`/api/invoices${searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : ''}`);
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setLoading(true);
    fetchInvoices(search);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchInvoices(search);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete');
      }
    } catch {
      alert('Failed to delete invoice');
    }
  };

  // Calculate dashboard stats
  const totalInvoices = invoices.length;
  const totalRevenue = invoices.reduce((sum, inv) => {
    const items = inv.line_items || [];
    const subtotal = items.reduce((s, item) => s + (Number(item.quantity) || 0) * (Number(item.rate) || 0), 0);
    const shipping = inv.shipping_free ? 0 : Number(inv.shipping_charges) || 0;
    return sum + subtotal + shipping - (Number(inv.discount_amount) || 0);
  }, 0);
  const draftCount = invoices.filter(i => i.status === 'draft').length;
  const finalCount = invoices.filter(i => i.status === 'final').length;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, overflow: 'auto', background: 'var(--surface)', padding: '32px 40px' }}>
        {/* Access denied banner */}
        {accessDenied && (
          <div
            className="animate-fade-in"
            style={{
              padding: '12px 16px',
              borderRadius: '10px',
              marginBottom: '20px',
              background: 'rgba(239,68,68,0.1)',
              color: 'var(--danger)',
              fontSize: '13px',
              border: '1px solid rgba(239,68,68,0.2)',
            }}
          >
            Access denied. You don't have permission to access that page.
          </div>
        )}

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px' }}>
              Dashboard
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '14px' }}>
              Welcome back, {session?.user?.name}
            </p>
          </div>
          <Link href="/invoices/new" className="btn btn-brand" style={{ textDecoration: 'none' }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Invoice
          </Link>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
          <div className="card animate-fade-in" style={{ padding: '20px' }}>
            <div style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              Total Invoices
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--foreground)' }}>
              {totalInvoices}
            </div>
          </div>
          <div className="card animate-fade-in" style={{ padding: '20px', animationDelay: '0.05s' }}>
            <div style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              Total Revenue
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--foreground)' }}>
              {formatCurrency(totalRevenue)}
            </div>
          </div>
          <div className="card animate-fade-in" style={{ padding: '20px', animationDelay: '0.1s' }}>
            <div style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              Finalized
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--success)' }}>
              {finalCount}
            </div>
          </div>
          <div className="card animate-fade-in" style={{ padding: '20px', animationDelay: '0.15s' }}>
            <div style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              Drafts
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--warning)' }}>
              {draftCount}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="card" style={{ padding: '0' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600 }}>All Invoices</h2>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
              <input
                className="input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by customer or invoice #"
                style={{ width: '280px', padding: '8px 14px', fontSize: '13px' }}
              />
              <button type="submit" className="btn btn-outline btn-sm">Search</button>
            </form>
          </div>

          {/* Table */}
          <div style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={thStyle}>Invoice #</th>
                  <th style={thStyle}>Customer</th>
                  <th style={thStyle}>Date</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Amount</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Created By</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const items = inv.line_items || [];
                  const subtotal = items.reduce((s, item) => s + (Number(item.quantity) || 0) * (Number(item.rate) || 0), 0);
                  const shipping = inv.shipping_free ? 0 : Number(inv.shipping_charges) || 0;
                  const grandTotal = subtotal + shipping - (Number(inv.discount_amount) || 0);

                  const canEdit =
                    session?.user?.role === 'admin' ||
                    String(inv.created_by) === String(session?.user?.id);
                  const canDelete =
                    session?.user?.role === 'admin' ||
                    (String(inv.created_by) === String(session?.user?.id) && inv.status === 'draft');

                  return (
                    <tr
                      key={inv.id}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f9fafb')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      onClick={() => router.push(`/invoices/${inv.id}`)}
                    >
                      <td style={tdStyle}>
                        <span style={{ fontWeight: 600, color: '#CC19F4', fontSize: '13px' }}>
                          {inv.invoice_number}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 500 }}>{inv.customer_name || '—'}</div>
                      </td>
                      <td style={{ ...tdStyle, color: 'var(--muted)', fontSize: '13px' }}>
                        {inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>
                        {formatCurrency(grandTotal)}
                      </td>
                      <td style={tdStyle}>
                        <span
                          style={{
                            padding: '3px 10px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: 500,
                            background: inv.status === 'final' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
                            color: inv.status === 'final' ? 'var(--success)' : 'var(--warning)',
                          }}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, color: 'var(--muted)', fontSize: '13px' }}>
                        {inv.creator_name || '—'}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="btn btn-ghost btn-sm"
                          style={{ textDecoration: 'none', marginRight: '4px' }}
                        >
                          View
                        </Link>
                        {canDelete && (
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleDelete(inv.id)}
                            style={{ color: 'var(--danger)' }}
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Empty state */}
          {!loading && invoices.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
                No invoices yet
              </h3>
              <p style={{ color: 'var(--muted)', marginBottom: '20px' }}>
                Create your first invoice to get started
              </p>
              <Link href="/invoices/new" className="btn btn-brand" style={{ textDecoration: 'none' }}>
                Create Invoice
              </Link>
            </div>
          )}

          {loading && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
              Loading invoices...
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const thStyle = {
  padding: '14px 16px',
  fontSize: '11px',
  fontWeight: 600,
  color: 'var(--muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  textAlign: 'left',
  whiteSpace: 'nowrap',
};

const tdStyle = {
  padding: '14px 16px',
  fontSize: '14px',
};
