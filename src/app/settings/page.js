'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';

export default function SettingsPage() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [logoPreview, setLogoPreview] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const res = await fetch('/api/settings');
    if (res.ok) {
      const data = await res.json();
      setSettings(data);
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setLogoPreview(ev.target.result);
      setSettings(prev => ({
        ...prev,
        logo_data: ev.target.result,
        logo_type: file.type,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setMessage('Settings saved successfully!');
        setLogoPreview(null);
        fetchSettings();
      } else {
        setMessage('Failed to save settings');
      }
    } catch {
      setMessage('Error saving settings');
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (!settings) {
    return (
      <div className="app-layout">
        <Sidebar />
        <main className="app-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: 'var(--muted)' }}>Loading settings...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <div style={{ maxWidth: '720px' }}>
          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--foreground)', marginBottom: '4px' }}>
              Company Settings
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '14px' }}>
              Configure your company profile, branding, and invoice defaults
            </p>
          </div>

          {/* Success/Error message */}
          {message && (
            <div
              className="animate-fade-in"
              style={{
                padding: '12px 16px',
                borderRadius: '10px',
                marginBottom: '20px',
                background: message.includes('success') ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                color: message.includes('success') ? 'var(--success)' : 'var(--danger)',
                fontSize: '13px',
                border: `1px solid ${message.includes('success') ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
              }}
            >
              {message}
            </div>
          )}

          <form onSubmit={handleSave}>
            {/* Company Info Card */}
            <div className="card" style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', color: 'var(--foreground)' }}>
                Company Information
              </h2>

              {/* Logo upload */}
              <div style={{ marginBottom: '20px' }}>
                <label className="label">Company Logo</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <img
                    src={logoPreview || settings.logo_path || '/logo.svg'}
                    alt="Logo"
                    style={{
                      height: '64px',
                      width: 'auto',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      padding: '8px',
                      background: '#fff',
                    }}
                  />
                  <label
                    style={{
                      cursor: 'pointer',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      fontSize: '13px',
                      color: 'var(--muted)',
                      transition: 'all 0.2s',
                    }}
                  >
                    Upload New Logo
                    <input
                      type="file"
                      accept=".png,.svg,image/svg+xml,image/png"
                      onChange={handleLogoChange}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>

              {/* Company name */}
              <div style={{ marginBottom: '16px' }}>
                <label className="label">Company Name</label>
                <input
                  className="input"
                  value={settings.company_name || ''}
                  onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                />
              </div>

              <div className="settings-grid-2">
                <div>
                  <label className="label">Website</label>
                  <input
                    className="input"
                    value={settings.website || ''}
                    onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input
                    className="input"
                    type="email"
                    value={settings.email || ''}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="label">Phone</label>
                <input
                  className="input"
                  value={settings.phone || ''}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                />
              </div>
            </div>

            {/* Branding Card */}
            <div className="card" style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', color: 'var(--foreground)' }}>
                Branding & Currency
              </h2>

              <div className="settings-grid-3">
                <div>
                  <label className="label">Brand Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="color"
                      value={settings.brand_color || '#CC19F4'}
                      onChange={(e) => setSettings({ ...settings, brand_color: e.target.value })}
                      style={{
                        width: '44px', height: '38px', border: '1px solid var(--border)',
                        borderRadius: '8px', cursor: 'pointer', padding: '2px',
                      }}
                    />
                    <input
                      className="input"
                      value={settings.brand_color || '#CC19F4'}
                      onChange={(e) => setSettings({ ...settings, brand_color: e.target.value })}
                      style={{ fontFamily: 'monospace', fontSize: '13px' }}
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Currency Symbol</label>
                  <input
                    className="input"
                    value={settings.currency_symbol || '₨'}
                    onChange={(e) => setSettings({ ...settings, currency_symbol: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Currency Name</label>
                  <input
                    className="input"
                    value={settings.currency_name || 'PKR'}
                    onChange={(e) => setSettings({ ...settings, currency_name: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Invoice Config Card */}
            <div className="card" style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', color: 'var(--foreground)' }}>
                Invoice Configuration
              </h2>

              <div className="settings-grid-2">
                <div>
                  <label className="label">Invoice Prefix</label>
                  <input
                    className="input"
                    value={settings.invoice_prefix || 'ACC-SINV'}
                    onChange={(e) => setSettings({ ...settings, invoice_prefix: e.target.value })}
                    placeholder="ACC-SINV"
                  />
                </div>
                <div>
                  <label className="label">Next Invoice Number</label>
                  <input
                    className="input"
                    type="number"
                    min="1"
                    value={settings.next_invoice_number || 1}
                    onChange={(e) => setSettings({ ...settings, next_invoice_number: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label className="label">Default Notes</label>
                <textarea
                  className="input"
                  rows="2"
                  value={settings.default_notes || ''}
                  onChange={(e) => setSettings({ ...settings, default_notes: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Default Terms & Conditions</label>
                <textarea
                  className="input"
                  rows="3"
                  value={settings.default_terms || ''}
                  onChange={(e) => setSettings({ ...settings, default_terms: e.target.value })}
                />
              </div>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={saving}
              className="btn btn-brand"
              style={{ width: '100%', padding: '14px', fontSize: '15px' }}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
