import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChairIcon } from '../../components/ui/BrandLogo';

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

    try {
      const res = await fetch('/api/portal/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login_id: loginId, password }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error?.message || 'Invalid Login ID or Password');
      }

      navigate('/portal/invoices', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Login failed');
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

          {/* ── Error banner ── */}
          {error && (
            <div
              style={{
                padding: '10px 14px',
                background: 'var(--danger-bg)',
                border: '1px solid var(--danger)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--danger)',
                fontSize: '12px',
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
                marginBottom: '20px',
              }}
            >
              {error}
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
        </div>
      </div>
    </div>
  );
};
