import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import api from '../lib/axios';

export default function Login() {
  const navigate = useNavigate();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [btnHover, setBtnHover] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', {
        login_id: loginId.trim(),
        loginId: loginId.trim(),
        password,
      });
      localStorage.setItem('urban_logged_in', 'true');
      if (res.data?.data?.user) {
        localStorage.setItem('urban_user', JSON.stringify(res.data.data.user));
      }
      navigate('/dashboard', { replace: true });
    } catch {
      // Exact error text from the spec/mockup
      setError('Invalid Login Id or Password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        <h2 style={styles.pageTitle}>Login Page</h2>

        <div style={styles.card}>
          {/* App LoGo container — exact wireframe box */}
          <div style={styles.appLogoBox}>
            <div style={styles.logoBadge}>UF</div>
            <div style={styles.logoTextCol}>
              <span style={styles.appLogoText}>App LoGo</span>
              <span style={styles.appLogoSub}>Urban Furniture</span>
            </div>
          </div>

          {/* Navigation Tabs: Sign In / Create Account */}
          <div style={styles.tabHeader}>
            <span style={styles.activeTab}>Sign In</span>
            <Link to="/create-user" style={styles.inactiveTab}>Create Account</Link>
          </div>

          <form onSubmit={handleSubmit} style={styles.form} noValidate>
            {/* Login Id - */}
            <div style={styles.row}>
              <label htmlFor="loginId" style={styles.rowLabel}>
                Login Id -
              </label>
              <div style={styles.inputContainer}>
                <input
                  id="loginId"
                  type="text"
                  autoComplete="username"
                  value={loginId}
                  onChange={e => setLoginId(e.target.value)}
                  required
                  minLength={6}
                  maxLength={12}
                  style={styles.lineInput}
                />
              </div>
            </div>

            {/* Password - */}
            <div style={styles.row}>
              <label htmlFor="password" style={styles.rowLabel}>
                Password -
              </label>
              <div style={styles.inputContainer}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={styles.lineInput}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.toggleBtn}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div role="alert" style={styles.errorBox}>
                <p style={styles.errorText}>{error}</p>
              </div>
            )}

            {/* Wireframe Centered Button: SIGN IN */}
            <div style={styles.btnWrapper}>
              <button
                type="submit"
                disabled={loading || !loginId || !password}
                onMouseEnter={() => setBtnHover(true)}
                onMouseLeave={() => setBtnHover(false)}
                style={{
                  ...styles.wireframeBtn,
                  background: btnHover ? 'var(--brown-900, #4A3A34)' : 'transparent',
                  color: btnHover ? 'var(--cream, #F9F2E4)' : 'var(--brown-900, #4A3A34)',
                  opacity: loading || !loginId || !password ? 0.6 : 1,
                  cursor: loading || !loginId || !password ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'SIGNING IN…' : 'SIGN IN'}
              </button>
            </div>

            {/* Forgot Password | Sign Up | Create Account footer */}
            <div style={styles.linksRow}>
              <Link to="/forgot-password" style={styles.link}>Forgot Password</Link>
              <span style={styles.linkDivider}>|</span>
              <Link to="/signup" style={styles.link}>Sign Up</Link>
              <span style={styles.linkDivider}>|</span>
              <Link to="/create-user" style={styles.link}>Create Account</Link>
            </div>
          </form>

          <div style={styles.portalDivider}>
            <span style={styles.portalText}>External Client or Customer?</span>
            <a href="/portal" style={styles.portalLink}>Go to Customer Portal &rarr;</a>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--cream, #F9F2E4)',
    padding: '32px 20px',
    fontFamily: 'var(--font-body, "DM Sans", sans-serif)',
  } as React.CSSProperties,
  pageTitle: {
    fontFamily: 'var(--font-display, "Montserrat", sans-serif)',
    fontWeight: 700,
    fontSize: 22,
    color: 'var(--brown-900, #4A3A34)',
    textAlign: 'center' as const,
    marginBottom: 16,
  } as React.CSSProperties,
  card: {
    background: 'var(--surface, #FFFFFF)',
    borderRadius: 22,
    border: '1.5px solid var(--brown-400, #B8977E)',
    boxShadow: '0 8px 28px rgba(74, 58, 52, 0.08)',
    padding: '36px 40px 32px 40px',
    width: '100%',
    maxWidth: 480,
  } as React.CSSProperties,
  appLogoBox: {
    width: 175,
    height: 56,
    margin: '0 auto 36px auto',
    border: '1.5px solid var(--brown-700, #77574A)',
    borderRadius: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    background: 'rgba(235, 215, 190, 0.3)',
  } as React.CSSProperties,
  logoBadge: {
    width: 30,
    height: 30,
    borderRadius: 6,
    background: 'var(--brown-900, #4A3A34)',
    color: 'var(--cream, #F9F2E4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-display, "Montserrat", sans-serif)',
    fontWeight: 700,
    fontSize: 14,
  } as React.CSSProperties,
  logoTextCol: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  appLogoText: {
    fontFamily: 'var(--font-display, "Montserrat", sans-serif)',
    fontWeight: 700,
    fontSize: 14,
    color: 'var(--brown-900, #4A3A34)',
    lineHeight: 1.1,
  } as React.CSSProperties,
  appLogoSub: {
    fontSize: 10,
    color: 'var(--brown-600, #8C6A58)',
    fontWeight: 500,
    letterSpacing: '0.02em',
  } as React.CSSProperties,
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 22,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  } as React.CSSProperties,
  rowLabel: {
    fontFamily: 'var(--font-body, "DM Sans", sans-serif)',
    fontWeight: 600,
    fontSize: 14,
    color: 'var(--brown-900, #4A3A34)',
    whiteSpace: 'nowrap' as const,
    minWidth: 155,
  } as React.CSSProperties,
  inputContainer: {
    flex: 1,
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
  },
  lineInput: {
    width: '100%',
    border: 'none',
    borderBottom: '1.5px solid var(--brown-700, #77574A)',
    borderRadius: 0,
    background: 'transparent',
    padding: '6px 24px 6px 4px',
    fontFamily: 'var(--font-body, "DM Sans", sans-serif)',
    fontSize: 14,
    color: 'var(--brown-900, #4A3A34)',
    outline: 'none',
    transition: 'border-color 150ms ease',
  } as React.CSSProperties,
  toggleBtn: {
    position: 'absolute' as const,
    right: 2,
    background: 'none',
    border: 'none',
    color: 'var(--brown-500, #A8836C)',
    cursor: 'pointer',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: {
    background: 'var(--danger-bg, #F8EAE6)',
    border: '1px solid var(--danger, #9E4A38)',
    borderRadius: 8,
    padding: '8px 12px',
    marginTop: -4,
  } as React.CSSProperties,
  errorText: {
    fontFamily: 'var(--font-body, "DM Sans", sans-serif)',
    fontSize: 12,
    color: 'var(--danger, #9E4A38)',
    margin: 0,
    fontWeight: 500,
  } as React.CSSProperties,
  btnWrapper: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: 8,
  } as React.CSSProperties,
  wireframeBtn: {
    minWidth: 150,
    padding: '9px 24px',
    border: '1.5px solid var(--brown-900, #4A3A34)',
    borderRadius: 12,
    fontFamily: 'var(--font-display, "Montserrat", sans-serif)',
    fontWeight: 700,
    fontSize: 13,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    transition: 'all 150ms ease',
  } as React.CSSProperties,
  linksRow: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
    fontSize: 13,
  } as React.CSSProperties,
  link: {
    color: 'var(--brown-700, #77574A)',
    textDecoration: 'none',
    fontWeight: 500,
    fontSize: 13,
    transition: 'color 150ms ease',
  } as React.CSSProperties,
  linkDivider: {
    color: 'var(--brown-300, #D0AE92)',
    fontWeight: 300,
  } as React.CSSProperties,
  portalDivider: {
    marginTop: 24,
    paddingTop: 16,
    borderTop: '1px solid rgba(208, 174, 146, 0.4)',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 4,
  } as React.CSSProperties,
  portalText: {
    fontSize: 11,
    color: 'var(--brown-500, #A8836C)',
  } as React.CSSProperties,
  portalLink: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--brown-700, #77574A)',
    textDecoration: 'none',
  } as React.CSSProperties,
  tabHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    background: 'rgba(235, 215, 190, 0.45)',
    border: '1px solid var(--brown-300, #D0AE92)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  } as React.CSSProperties,
  activeTab: {
    flex: 1,
    textAlign: 'center' as const,
    padding: '7px 14px',
    background: 'var(--brown-900, #4A3A34)',
    color: 'var(--cream, #F9F2E4)',
    borderRadius: 8,
    fontWeight: 700,
    fontSize: 13,
    fontFamily: 'var(--font-display, "Montserrat", sans-serif)',
    letterSpacing: '0.02em',
    boxShadow: '0 1px 3px rgba(74, 58, 52, 0.15)',
  } as React.CSSProperties,
  inactiveTab: {
    flex: 1,
    textAlign: 'center' as const,
    padding: '7px 14px',
    color: 'var(--brown-700, #77574A)',
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 13,
    fontFamily: 'var(--font-display, "Montserrat", sans-serif)',
    letterSpacing: '0.02em',
    textDecoration: 'none',
    transition: 'background-color 150ms ease, color 150ms ease',
  } as React.CSSProperties,
};
