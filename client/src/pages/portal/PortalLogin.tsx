import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChairIcon } from '../../components/ui/BrandLogo';
import api from '../../lib/axios';

/* ─── tiny shared style objects — avoids repeating var(--token) strings ─── */
const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--cream)',
  border: '1px solid var(--brown-300)',
  borderRadius: 'var(--radius-sm)',
  padding: '9px 14px',
  fontSize: '13px',
  lineHeight: '20px',
  color: 'var(--brown-900)',
  fontFamily: 'var(--font-body)',
  outline: 'none',
  transition: 'border-color 150ms ease-out, box-shadow 150ms ease-out',
};

const inputFocusStyle: React.CSSProperties = {
  borderColor: 'var(--brown-700)',
  boxShadow: '0 0 0 2px rgba(119, 87, 74, 0.18)',
  background: 'var(--surface)',
};

function FocusInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      style={{ ...inputStyle, ...(focused ? inputFocusStyle : {}) }}
      onFocus={e => { setFocused(true); props.onFocus?.(e); }}
      onBlur={e => { setFocused(false); props.onBlur?.(e); }}
    />
  );
}

export const PortalLogin: React.FC = () => {
  const navigate = useNavigate();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [btnHover, setBtnHover] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const trimmedLogin = loginId.trim();
    if (!trimmedLogin) {
      setError('Please enter your Login ID or Email');
      setLoading(false);
      return;
    }
    if (!password) {
      setError('Please enter your password');
      setLoading(false);
      return;
    }

    try {
      const res = await api.post('/api/portal/login', {
        login_id: trimmedLogin,
        loginId: trimmedLogin,
        password,
      });

      if (res.data?.data?.user) {
        localStorage.setItem('urban_portal_user', JSON.stringify(res.data.data.user));
      }
      if (res.data?.data?.token) {
        localStorage.setItem('urban_portal_token', res.data.data.token);
      }

      navigate('/portal/invoices', { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || err?.message || 'Invalid Login ID or Password';
      setError(msg);
    } finally {
      setLoading(false);
    }
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
        padding: '16px',
      }}
    >
      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* ── Card ── */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--brown-300)',
            borderRadius: 'var(--radius-lg)',
            padding: '40px 36px',
            boxShadow: 'var(--shadow-md)',
          }}
        >

          {/* ── Brand mark ── */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                background: 'var(--brown-700)',
                color: 'var(--cream)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <ChairIcon size={34} color="var(--cream)" />
            </div>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '22px',
                fontWeight: 700,
                color: 'var(--brown-900)',
                margin: 0,
              }}
            >
              Contact Portal
            </h1>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '11px',
                color: 'var(--brown-600)',
                marginTop: '6px',
              }}
            >
              Restricted to invited customer contacts only
            </p>
          </div>

          {/* ── Demo Customer Credentials Helper ── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              background: 'var(--cream)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '18px',
              border: '1px dashed var(--brown-300)',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brown-900)', fontFamily: 'var(--font-display)' }}>
                Demo Customer Account
              </div>
              <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--brown-700)', marginTop: 2 }}>
                clientuf / Client@12345
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setLoginId('clientuf');
                setPassword('Client@12345');
                setError(null);
              }}
              style={{
                background: 'var(--brown-900)',
                color: 'var(--cream)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: 700,
                fontFamily: 'var(--font-display)',
                cursor: 'pointer',
                transition: 'opacity 120ms ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Auto-Fill
            </button>
          </div>

          {/* ── Error banner ── */}
          {error && (
            <div
              style={{
                padding: '12px 14px',
                background: 'var(--danger-bg)',
                border: '1px solid var(--danger)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--danger)',
                fontSize: '12px',
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
                marginBottom: '20px',
                lineHeight: '18px',
              }}
            >
              <div>{error}</div>
              {error.toLowerCase().includes('restricted') && (
                <div
                  style={{
                    marginTop: 10,
                    paddingTop: 8,
                    borderTop: '1px dashed rgba(200, 50, 50, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 11 }}>Switch to demo customer:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginId('clientuf');
                      setPassword('Client@12345');
                      setError(null);
                    }}
                    style={{
                      background: 'var(--brown-900)',
                      color: 'var(--cream)',
                      border: 'none',
                      borderRadius: 4,
                      padding: '4px 10px',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Fill clientuf
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Form ── */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

            {/* Login ID */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  color: 'var(--brown-700)',
                  marginBottom: '6px',
                }}
              >
                Login ID / Email
              </label>
              <FocusInput
                type="text"
                name="loginId"
                id="portal-login-id"
                autoComplete="username"
                required
                value={loginId}
                onChange={e => setLoginId(e.target.value)}
                placeholder="e.g. rohit or rohit@sharma.in"
              />
            </div>

            {/* Password */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  color: 'var(--brown-700)',
                  marginBottom: '6px',
                }}
              >
                Password
              </label>
              <FocusInput
                type="password"
                name="password"
                id="portal-password"
                autoComplete="current-password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              onMouseEnter={() => setBtnHover(true)}
              onMouseLeave={() => setBtnHover(false)}
              style={{
                width: '100%',
                padding: '11px 16px',
                background: loading
                  ? 'var(--brown-600)'
                  : btnHover
                    ? 'var(--brown-700)'
                    : 'var(--brown-900)',
                color: 'var(--cream)',
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: '11px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: 'var(--shadow-sm)',
                transition: 'background 150ms ease-out',
                opacity: loading ? 0.72 : 1,
              }}
            >
              {loading ? 'AUTHENTICATING…' : 'SIGN IN TO PORTAL'}
            </button>
          </form>

          {/* ── Invite token link ── */}
          <div
            style={{
              marginTop: '28px',
              paddingTop: '22px',
              borderTop: '1px solid rgba(208, 174, 146, 0.40)', /* brown-300 @ 40% */
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontSize: '11px',
                color: 'var(--brown-600)',
                fontFamily: 'var(--font-body)',
                marginBottom: '8px',
              }}
            >
              Have an invitation token?
            </p>
            <button
              onClick={() => navigate('/portal/accept-invite')}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                fontSize: '12px',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                color: 'var(--brown-700)',
                textDecoration: 'underline',
                cursor: 'pointer',
              }}
              onMouseEnter={e =>
                ((e.currentTarget as HTMLButtonElement).style.color = 'var(--brown-900)')
              }
              onMouseLeave={e =>
                ((e.currentTarget as HTMLButtonElement).style.color = 'var(--brown-700)')
              }
            >
              Activate Account with Token →
            </button>
          </div>

          {/* ── Public & Staff Navigation Links ── */}
          <div
            style={{
              marginTop: '20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <button
              type="button"
              onClick={() => navigate('/portal/catalogue')}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                fontSize: '12px',
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                color: 'var(--brown-900)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span>Browse Furniture Catalogue (No login needed)</span>
              <span>→</span>
            </button>

            <a
              href="/dashboard"
              style={{
                fontSize: '11px',
                fontFamily: 'var(--font-body)',
                color: 'var(--brown-500)',
                textDecoration: 'none',
                marginTop: 4,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--brown-900)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--brown-500)')}
            >
              ← Back to Internal ERP
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
