'use client';

import { signIn } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('error=access_denied')) {
      setAccessDenied(true);
    }
    // Restore remember me preference
    const saved = localStorage.getItem('rememberMe');
    if (saved === 'true') {
      setRememberMe(true);
      const savedEmail = localStorage.getItem('rememberedEmail');
      if (savedEmail) setEmail(savedEmail);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Save remember me preference
    if (rememberMe) {
      localStorage.setItem('rememberMe', 'true');
      localStorage.setItem('rememberedEmail', email);
    } else {
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('rememberedEmail');
    }

    try {
      const result = await signIn('credentials', {
        email,
        password,
        rememberMe: String(rememberMe),
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
    <div className="login-page-wrapper">
      {/* Decorative background orbs */}
      <div className="login-orb login-orb-top" />
      <div className="login-orb login-orb-bottom" />

      <div className="login-card animate-scale-in">
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
          <div className="login-error animate-fade-in">
            {error || 'Access denied. Admin permissions required.'}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '18px' }}>
            <label className="login-label">
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@swifttechngames.com"
              className="login-input"
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label className="login-label">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="login-input"
            />
          </div>

          {/* Remember Me */}
          <div style={{ marginBottom: '24px' }}>
            <label className="remember-me-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="remember-me-checkbox"
              />
              <span className="remember-me-custom" />
              Remember me for 30 days
            </label>
          </div>

          <button
            id="login-submit"
            type="submit"
            disabled={loading}
            className="login-submit-btn"
          >
            <span className="login-btn-content">
              {loading && <span className="login-spinner" />}
              {loading ? 'Signing in...' : 'Sign In'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
