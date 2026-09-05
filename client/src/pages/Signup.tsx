import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import api from '../lib/axios';

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    loginId: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [btnHover, setBtnHover] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  // Validation rules directly from wireframe:
  // 1. Login Id between 6-12 chars
  const isLoginIdValid = form.loginId.length >= 6 && form.loginId.length <= 12;
  // 2. Email valid format
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
  // 3. Password > 8 characters, lowercase, uppercase, and special character
  const hasLower = /[a-z]/.test(form.password);
  const hasUpper = /[A-Z]/.test(form.password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password);
  const isLengthValid = form.password.length > 8;
  const isPasswordValid = hasLower && hasUpper && hasSpecial && isLengthValid;
  // Passwords match
  const doPasswordsMatch = form.password.length > 0 && form.password === form.confirmPassword;

  const isFormValid =
    isLoginIdValid &&
    isEmailValid &&
    isPasswordValid &&
    doPasswordsMatch;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isLoginIdValid) {
      setError('Login Id must be between 6 and 12 characters.');
      return;
    }
    if (!isEmailValid) {
      setError('Please provide a valid Email Id.');
      return;
    }
    if (!isPasswordValid) {
      setError('Password must be greater than 8 characters and contain a lowercase, uppercase, and special character.');
      return;
    }
    if (!doPasswordsMatch) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/auth/signup', {
        login_id: form.loginId.trim(),
        loginId: form.loginId.trim(),
        email: form.email.trim(),
        password: form.password,
        full_name: form.loginId.trim(),
        name: form.loginId.trim(),
      });
      navigate('/login');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message;
      setError(msg ?? 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        <h2 style={styles.pageTitle}>Sign Up Page</h2>

        <div style={styles.card}>
          {/* App LoGo container — exact wireframe box */}
          <div style={styles.appLogoBox}>
            <div style={styles.logoBadge}>UF</div>
            <div style={styles.logoTextCol}>
              <span style={styles.appLogoText}>App LoGo</span>
              <span style={styles.appLogoSub}>Urban Furniture</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={styles.form} noValidate>
            {/* Enter Login Id - */}
            <div style={styles.row}>
              <label htmlFor="loginId" style={styles.rowLabel}>
                Enter Login Id -
              </label>
              <div style={styles.inputContainer}>
                <input
                  id="loginId"
                  type="text"
                  autoComplete="username"
                  value={form.loginId}
                  onChange={set('loginId')}
                  required
                  minLength={6}
                  maxLength={12}
                  style={styles.lineInput}
                />
              </div>
            </div>

            {/* Enter Email Id - */}
            <div style={styles.row}>
              <label htmlFor="email" style={styles.rowLabel}>
                Enter Email Id -
              </label>
              <div style={styles.inputContainer}>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={set('email')}
                  required
                  style={styles.lineInput}
                />
              </div>
            </div>

            {/* Enter Password - */}
            <div style={styles.row}>
              <label htmlFor="password" style={styles.rowLabel}>
                Enter Password -
              </label>
              <div style={styles.inputContainer}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={set('password')}
                  required
                  minLength={8}
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

            {/* Re-Enter Password - */}
            <div style={styles.row}>
              <label htmlFor="confirmPassword" style={styles.rowLabel}>
                Re-Enter Password -
              </label>
              <div style={styles.inputContainer}>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={set('confirmPassword')}
                  required
                  style={styles.lineInput}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.toggleBtn}
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div role="alert" style={styles.errorBox}>
                <p style={styles.errorText}>{error}</p>
              </div>
            )}

            {/* Wireframe Centered Button: SIGN OUT */}
            <div style={styles.btnWrapper}>
              <button
                type="submit"
                disabled={loading || !isFormValid}
                onMouseEnter={() => setBtnHover(true)}
                onMouseLeave={() => setBtnHover(false)}
                style={{
                  ...styles.wireframeBtn,
                  background: btnHover ? 'var(--brown-900, #4A3A34)' : 'transparent',
                  color: btnHover ? 'var(--cream, #F9F2E4)' : 'var(--brown-900, #4A3A34)',
                  opacity: loading || !isFormValid ? 0.6 : 1,
                  cursor: loading || !isFormValid ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'SUBMITTING…' : 'SIGN OUT'}
              </button>
            </div>

            {/* Forgot Password | Sign Up footer matching exact wireframe */}
            <div style={styles.linksRow}>
              <Link to="/forgot-password" style={styles.link}>Forgot Password</Link>
              <span style={styles.linkDivider}>|</span>
              <Link to="/signup" style={styles.link}>Sign Up</Link>
            </div>
          </form>
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
};
