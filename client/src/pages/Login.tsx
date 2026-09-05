import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, User as UserIcon } from 'lucide-react';
import api from '../lib/axios';

export default function Login() {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Send both login_id and loginId to satisfy any schema variant
      await api.post('/api/auth/login', {
        login_id: loginId.trim(),
        loginId: loginId.trim(),
        password,
      });
      window.location.href = '/';
    } catch {
      // Exact error text from the spec/mockup — do not change this string
      setError('Invalid Login Id or Password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* App Logo Banner — matches wireframe */}
        <div style={styles.logoContainer}>
          <div style={styles.logoBadge}>
            <span style={styles.logoBadgeText}>UF</span>
          </div>
          <div>
            <span style={styles.logoTitle}>Urban Furniture</span>
            <span style={styles.logoSubtitle}>Double-Entry Accounting System</span>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={styles.title}>Sign In</h1>
          <p style={styles.subtitle}>Enter your credentials to access your workspace</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form} noValidate>
          <div style={styles.field}>
            <label htmlFor="loginId" style={styles.label}>Login ID</label>
            <div style={styles.inputWrapper}>
              <UserIcon size={16} style={styles.inputIcon} />
              <input
                id="loginId"
                type="text"
                autoComplete="username"
                value={loginId}
                onChange={e => setLoginId(e.target.value)}
                required
                minLength={6}
                maxLength={12}
                style={styles.input}
                placeholder="6–12 characters"
              />
            </div>
            <span style={styles.fieldHint}>Must be between 6 and 12 characters</span>
          </div>

          <div style={styles.field}>
            <label htmlFor="password" style={styles.label}>Password</label>
            <div style={styles.inputWrapper}>
              <Lock size={16} style={styles.inputIcon} />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={styles.input}
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.passwordToggle}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div role="alert" style={styles.errorBox}>
              <p style={styles.errorText}>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !loginId || !password}
            style={{
              ...styles.btn,
              opacity: loading || !loginId || !password ? 0.6 : 1,
              cursor: loading || !loginId || !password ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div style={styles.links}>
          <Link to="/forgot-password" style={styles.link}>Forgot password?</Link>
          <Link to="/signup" style={styles.linkBold}>Create Account</Link>
        </div>

        <div style={styles.portalDivider}>
          <span style={styles.portalText}>External Client or Customer?</span>
          <a href="/portal" style={styles.portalLink}>Go to Customer Portal &rarr;</a>
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
    padding: 24,
    fontFamily: 'var(--font-body, "DM Sans", sans-serif)',
  } as React.CSSProperties,
  card: {
    background: 'var(--surface, #FFFFFF)',
    borderRadius: 'var(--radius-md, 10px)',
    boxShadow: 'var(--shadow-md, 0 4px 12px rgba(74, 58, 52, 0.08))',
    border: '1px solid rgba(208, 174, 146, 0.4)',
    padding: '36px 36px 32px 36px',
    width: '100%',
    maxWidth: 420,
  } as React.CSSProperties,
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    background: 'rgba(235, 215, 190, 0.35)',
    border: '1px solid var(--brown-300, #D0AE92)',
    borderRadius: 'var(--radius-sm, 6px)',
    padding: '10px 16px',
    marginBottom: 24,
  } as React.CSSProperties,
  logoBadge: {
    width: 34,
    height: 34,
    borderRadius: 6,
    background: 'var(--brown-900, #4A3A34)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 1px 3px rgba(74, 58, 52, 0.2)',
  } as React.CSSProperties,
  logoBadgeText: {
    fontFamily: 'var(--font-display, "Montserrat", sans-serif)',
    fontWeight: 700,
    fontSize: 16,
    color: 'var(--cream, #F9F2E4)',
    letterSpacing: '-0.02em',
  } as React.CSSProperties,
  logoTitle: {
    display: 'block',
    fontFamily: 'var(--font-display, "Montserrat", sans-serif)',
    fontWeight: 700,
    fontSize: 15,
    color: 'var(--brown-900, #4A3A34)',
    letterSpacing: '-0.01em',
    lineHeight: 1.2,
  } as React.CSSProperties,
  logoSubtitle: {
    display: 'block',
    fontSize: 11,
    color: 'var(--brown-700, #77574A)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
    fontWeight: 500,
  } as React.CSSProperties,
  title: {
    fontFamily: 'var(--font-display, "Montserrat", sans-serif)',
    fontWeight: 700,
    fontSize: 22,
    color: 'var(--brown-900, #4A3A34)',
    marginBottom: 4,
  } as React.CSSProperties,
  subtitle: {
    fontFamily: 'var(--font-body, "DM Sans", sans-serif)',
    fontSize: 13,
    color: 'var(--brown-500, #A8836C)',
    marginBottom: 20,
  } as React.CSSProperties,
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 16,
  },
  field: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 5,
  },
  label: {
    fontFamily: 'var(--font-body, "DM Sans", sans-serif)',
    fontWeight: 600,
    fontSize: 13,
    color: 'var(--brown-700, #77574A)',
  } as React.CSSProperties,
  inputWrapper: {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute' as const,
    left: 12,
    color: 'var(--brown-500, #A8836C)',
    pointerEvents: 'none' as const,
  },
  passwordToggle: {
    position: 'absolute' as const,
    right: 12,
    background: 'none',
    border: 'none',
    color: 'var(--brown-500, #A8836C)',
    cursor: 'pointer',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    width: '100%',
    fontFamily: 'var(--font-body, "DM Sans", sans-serif)',
    fontSize: 14,
    padding: '9px 36px 9px 36px',
    border: '1px solid var(--brown-300, #D0AE92)',
    borderRadius: 'var(--radius-sm, 6px)',
    background: 'var(--cream, #F9F2E4)',
    color: 'var(--brown-900, #4A3A34)',
    outline: 'none',
    transition: 'border-color 150ms ease, box-shadow 150ms ease',
  } as React.CSSProperties,
  fieldHint: {
    fontSize: 11,
    color: 'var(--brown-500, #A8836C)',
    marginTop: 2,
  } as React.CSSProperties,
  errorBox: {
    background: 'var(--danger-bg, #F8EAE6)',
    border: '1px solid var(--danger, #9E4A38)',
    borderRadius: 'var(--radius-sm, 6px)',
    padding: '9px 12px',
  } as React.CSSProperties,
  errorText: {
    fontFamily: 'var(--font-body, "DM Sans", sans-serif)',
    fontSize: 13,
    color: 'var(--danger, #9E4A38)',
    margin: 0,
    fontWeight: 500,
  } as React.CSSProperties,
  btn: {
    fontFamily: 'var(--font-body, "DM Sans", sans-serif)',
    fontWeight: 600,
    fontSize: 14,
    padding: '11px 16px',
    background: 'var(--brown-900, #4A3A34)',
    color: 'var(--cream, #F9F2E4)',
    border: 'none',
    borderRadius: 'var(--radius-sm, 6px)',
    cursor: 'pointer',
    marginTop: 4,
    transition: 'background-color 150ms ease, transform 100ms ease',
    boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(74,58,52,.06))',
  } as React.CSSProperties,
  links: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    fontSize: 13,
  } as React.CSSProperties,
  link: {
    color: 'var(--brown-500, #A8836C)',
    textDecoration: 'none',
    transition: 'color 150ms ease',
  } as React.CSSProperties,
  linkBold: {
    color: 'var(--brown-900, #4A3A34)',
    fontWeight: 600,
    textDecoration: 'none',
  } as React.CSSProperties,
  portalDivider: {
    marginTop: 24,
    paddingTop: 16,
    borderTop: '1px solid rgba(208, 174, 146, 0.4)',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 4,
  },
  portalText: {
    fontSize: 11,
    color: 'var(--brown-500, #A8836C)',
  },
  portalLink: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--brown-700, #77574A)',
    textDecoration: 'none',
  },
};

