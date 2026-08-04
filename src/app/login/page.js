'use client';

import { signIn } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('error=access_denied')) {
      setAccessDenied(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f0f14 0%, #1a1a2e 50%, #0f0f14 100%)',
        padding: '20px',
      }}
    >
      {/* Decorative background orbs */}
      <div
        style={{
          position: 'fixed',
          top: '-20%',
          right: '-10%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(204,25,244,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'fixed',
          bottom: '-20%',
          left: '-10%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(204,25,244,0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        className="animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '420px',
          background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '20px',
          padding: '48px 40px',
          position: 'relative',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img
            src="/logo.svg"
            alt="Swift Tech & Games"
            style={{ height: '56px', width: 'auto', margin: '0 auto 16px' }}
          />
          <h1
            style={{
              color: '#CC19F4',
              fontSize: '22px',
              fontWeight: 700,
              marginBottom: '4px',
            }}
          >
            Swift Tech & Games
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
            Sign in to your invoice manager
          </p>
        </div>

        {/* Error message */}
        {(error || accessDenied) && (
          <div
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: '10px',
              padding: '12px 16px',
              marginBottom: '20px',
              color: '#fca5a5',
              fontSize: '13px',
              textAlign: 'center',
            }}
          >
            {error || 'Access denied. Admin permissions required.'}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '18px' }}>
            <label
              style={{
                display: 'block',
                color: 'rgba(255,255,255,0.5)',
                fontSize: '12px',
                fontWeight: 500,
                marginBottom: '6px',
              }}
            >
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@swifttechngames.com"
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                color: 'white',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#CC19F4';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255,255,255,0.1)';
              }}
            />
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label
              style={{
                display: 'block',
                color: 'rgba(255,255,255,0.5)',
                fontSize: '12px',
                fontWeight: 500,
                marginBottom: '6px',
              }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                color: 'white',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#CC19F4';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255,255,255,0.1)';
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '13px',
              background: loading
                ? 'rgba(204,25,244,0.5)'
                : 'linear-gradient(135deg, #CC19F4 0%, #a014c3 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 16px rgba(204,25,244,0.25)',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 6px 24px rgba(204,25,244,0.35)';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 16px rgba(204,25,244,0.25)';
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
