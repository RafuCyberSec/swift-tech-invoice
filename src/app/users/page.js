'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';

export default function UsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'staff' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const res = await fetch('/api/users');
    if (res.ok) {
      const data = await res.json();
      setUsers(data);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const method = editingUser ? 'PUT' : 'POST';
      const body = editingUser
        ? { id: editingUser.id, ...formData }
        : formData;

      // Don't send empty password on edit
      if (editingUser && !body.password) {
        delete body.password;
      }

      const res = await fetch('/api/users', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(editingUser ? 'User updated!' : 'User created!');
        setShowForm(false);
        setEditingUser(null);
        setFormData({ name: '', email: '', password: '', role: 'staff' });
        fetchUsers();
      } else {
        setMessage(data.error || 'Operation failed');
      }
    } catch {
      setMessage('Something went wrong');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await fetch(`/api/users?id=${userId}`, { method: 'DELETE' });
      if (res.ok) {
        setMessage('User deleted');
        fetchUsers();
      } else {
        const data = await res.json();
        setMessage(data.error || 'Failed to delete');
      }
    } catch {
      setMessage('Failed to delete user');
    }
    setTimeout(() => setMessage(''), 3000);
  };

  const startEdit = (user) => {
    setEditingUser(user);
    setFormData({ name: user.name, email: user.email, password: '', role: user.role });
    setShowForm(true);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '40px', background: 'var(--surface)', overflow: 'auto' }}>
        <div style={{ maxWidth: '800px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--foreground)', marginBottom: '4px' }}>
                User Management
              </h1>
              <p style={{ color: 'var(--muted)', fontSize: '14px' }}>
                Manage team members and their access roles
              </p>
            </div>
            <button
              className="btn btn-brand"
              onClick={() => {
                setEditingUser(null);
                setFormData({ name: '', email: '', password: '', role: 'staff' });
                setShowForm(!showForm);
              }}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add User
            </button>
          </div>

          {/* Message */}
          {message && (
            <div
              className="animate-fade-in"
              style={{
                padding: '12px 16px',
                borderRadius: '10px',
                marginBottom: '20px',
                background: message.includes('deleted') || message.includes('failed') || message.includes('error')
                  ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
                color: message.includes('deleted') || message.includes('failed') || message.includes('error')
                  ? 'var(--danger)' : 'var(--success)',
                fontSize: '13px',
              }}
            >
              {message}
            </div>
          )}

          {/* Add/Edit Form */}
          {showForm && (
            <div className="card animate-fade-in" style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>
                {editingUser ? 'Edit User' : 'Add New User'}
              </h2>
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label className="label">Full Name</label>
                    <input
                      className="input"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <input
                      className="input"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <label className="label">
                      Password {editingUser && '(leave blank to keep current)'}
                    </label>
                    <input
                      className="input"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required={!editingUser}
                      minLength={6}
                    />
                  </div>
                  <div>
                    <label className="label">Role</label>
                    <select
                      className="input"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="submit" className="btn btn-brand" disabled={loading}>
                    {loading ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => { setShowForm(false); setEditingUser(null); }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Users List */}
          <div className="card">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Role</th>
                  <th style={thStyle}>Created</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 500 }}>{user.name}</div>
                    </td>
                    <td style={{ ...tdStyle, color: 'var(--muted)' }}>{user.email}</td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          padding: '3px 10px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 500,
                          background: user.role === 'admin' ? 'rgba(204,25,244,0.1)' : 'rgba(107,114,128,0.1)',
                          color: user.role === 'admin' ? '#CC19F4' : 'var(--muted)',
                        }}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, color: 'var(--muted)', fontSize: '13px' }}>
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : ''}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => startEdit(user)}
                        style={{ marginRight: '4px' }}
                      >
                        Edit
                      </button>
                      {String(user.id) !== String(session?.user?.id) && (
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleDelete(user.id)}
                          style={{ color: 'var(--danger)' }}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
                No users found
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

const thStyle = {
  padding: '12px 16px',
  fontSize: '12px',
  fontWeight: 600,
  color: 'var(--muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  textAlign: 'left',
};

const tdStyle = {
  padding: '14px 16px',
  fontSize: '14px',
};
