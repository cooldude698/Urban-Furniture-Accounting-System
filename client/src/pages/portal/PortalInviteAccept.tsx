import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChairIcon } from '../../components/ui/BrandLogo';
import api from '../../lib/axios';

export const PortalInviteAccept: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [token, setToken] = useState(() => searchParams.get('token') ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  /* focus-ring helpers — same pattern as PortalLogin */
  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = 'var(--brown-700)';
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(74, 58, 52, 0.18)';
    e.currentTarget.style.background = 'var(--surface)';
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = 'var(--brown-300)';
    e.currentTarget.style.boxShadow = 'none';
    e.currentTarget.style.background = 'var(--cream)';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/api/portal/accept-invite', { token, password });
      if (res.data?.error) {
        throw new Error(res.data.error.message || 'Failed to accept invitation');
      }

      setSuccess('Password set successfully! Redirecting to login…');
      setTimeout(() => {
        navigate('/login?portal=customer', { replace: true });
      }, 1200);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err.message || 'Invitation acceptance failed');
    } finally {
      setLoading(false);
    }
  };

  /* ─── shared input style ─────────────────────────────────────────── */
  const inputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    background: 'var(--cream)',
    border: '1px solid var(--brown-300)',
    borderRadius: 'var(--radius-sm)',
    padding: '9px 13px',
    fontSize: 14,
    fontFamily: 'var(--font-body)',
    color: 'var(--brown-900)',
    outline: 'none',
    transition: 'border-color 120ms ease-out, box-shadow 120ms ease-out, background 120ms ease-out',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 11,
    fontFamily: 'var(--font-body)',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    color: 'var(--brown-700)',
    marginBottom: 6,
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--cream)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-body)',
        padding: '24px 16px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Card */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--brown-300)',
            borderRadius: 'var(--radius-lg)',
            padding: '36px 32px',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {/* Brand mark */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div
              style={{
                width: 48,
                height: 48,
                background: 'var(--brown-700)',
                color: 'var(--cream)',
                borderRadius: 'var(--radius-md)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <ChairIcon size={30} color="var(--cream)" />
            </div>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 22,
                color: 'var(--brown-900)',
                margin: '0 0 6px',
              }}
            >
              Activate Portal Account
            </h1>
            <p
              style={{
                fontSize: 12,
                fontFamily: 'var(--font-body)',
                color: 'var(--brown-600)',
                margin: 0,
              }}
            >
              Set your password to access the Urban Furniture Customer Portal
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div
              style={{
                padding: '10px 13px',
                background: 'var(--danger-bg)',
                border: '1px solid var(--danger)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--danger)',
                fontSize: 12,
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
                marginBottom: 18,
              }}
            >
              {error}
            </div>
          )}

          {/* Success banner */}
          {success && (
            <div
              style={{
                padding: '10px 13px',
                background: 'var(--posted-bg)',
                border: '1px solid var(--posted)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--posted)',
                fontSize: 12,
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
                marginBottom: 18,
              }}
            >
              ✓ {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Token field */}
            <div>
              <label style={labelStyle}>Invitation Token *</label>
              <input
                type="text"
                required
                value={token}
                onChange={e => setToken(e.target.value)}
                placeholder="Paste invitation token…"
                style={{ ...inputStyle, fontFamily: 'var(--font-mono)', fontSize: 13 }}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>

            {/* New password */}
            <div>
              <label style={labelStyle}>New Password *</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>

            {/* Confirm password */}
            <div>
              <label style={labelStyle}>Confirm Password *</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 4,
                width: '100%',
                padding: '10px 0',
                background: loading ? 'var(--brown-700)' : 'var(--brown-900)',
                color: 'var(--cream)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                cursor: loading ? 'wait' : 'pointer',
                opacity: loading ? 0.72 : 1,
                boxShadow: 'var(--shadow-sm)',
                transition: 'background 120ms ease-out, opacity 120ms ease-out',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'var(--brown-700)'; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = 'var(--brown-900)'; }}
            >
              {loading ? 'Setting Password…' : 'Activate Portal Account'}
            </button>
          </form>

          {/* Back to login */}
          <div style={{ marginTop: 22, textAlign: 'center' }}>
            <button
              onClick={() => navigate('/login?portal=customer')}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                fontSize: 12,
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                color: 'var(--brown-700)',
                textDecoration: 'underline',
              }}
            >
              ← Back to Portal Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
