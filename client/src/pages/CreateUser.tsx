import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Shield, Mail, Lock } from 'lucide-react';
import api from '../lib/axios';

export default function CreateUser() {
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

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  // Validation rules directly from wireframe notes
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
  // Re-enter password must match
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
      setError('Password must be greater than 8 characters and contain lowercase, uppercase, and a special character.');
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
      <div style={{ width: '100%', maxWidth: 420 }}>
        <h2 style={styles.pageTitle}>Sign Up Page</h2>

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

          <form onSubmit={handleSubmit} style={styles.form} noValidate>
            {/* Enter Login Id - */}
            <div style={styles.field}>
              <label htmlFor="loginId" style={styles.label}>Enter Login Id -</label>
              <div style={styles.inputWrapper}>
                <Shield size={16} style={styles.inputIcon} />
                <input
                  id="loginId"
                  type="text"
                  autoComplete="username"
                  value={form.loginId}
                  onChange={set('loginId')}
                  required
                  minLength={6}
                  maxLength={12}
                  style={styles.input}
                  placeholder="Enter Login Id"
                />
              </div>
              <span style={styles.fieldHint}>Must be 6–12 characters</span>
            </div>

            {/* Enter Email Id - */}
            <div style={styles.field}>
              <label htmlFor="email" style={styles.label}>Enter Email Id -</label>
              <div style={styles.inputWrapper}>
                <Mail size={16} style={styles.inputIcon} />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={set('email')}
                  required
                  style={styles.input}
                  placeholder="Enter Email Id"
                />
              </div>
            </div>

            {/* Enter Password - */}
            <div style={styles.field}>
              <label htmlFor="password" style={styles.label}>Enter Password -</label>
              <div style={styles.inputWrapper}>
                <Lock size={16} style={styles.inputIcon} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={set('password')}
                  required
                  minLength={8}
                  style={styles.input}
                  placeholder="Enter Password"
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
              <span style={styles.fieldHint}>&gt; 8 chars, uppercase, lowercase, special char</span>
            </div>

            {/* Re-Enter Password - */}
            <div style={styles.field}>
              <label htmlFor="confirmPassword" style={styles.label}>Re-Enter Password -</label>
              <div style={styles.inputWrapper}>
                <Lock size={16} style={styles.inputIcon} />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={set('confirmPassword')}
                  required
                  style={styles.input}
                  placeholder="Re-Enter Password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.passwordToggle}
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.confirmPassword.length > 0 && !doPasswordsMatch && (
                <span style={{ ...styles.fieldHint, color: 'var(--danger, #9E4A38)' }}>Passwords do not match</span>
              )}
            </div>

            {error && (
              <div role="alert" style={styles.errorBox}>
                <p style={styles.errorText}>{error}</p>
              </div>
            )}

            {/* SIGN UP Button */}
            <button
              type="submit"
              disabled={loading || !isFormValid}
              style={{
                ...styles.btn,
                opacity: loading || !isFormValid ? 0.6 : 1,
                cursor: loading || !isFormValid ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'SIGNING UP…' : 'SIGN UP'}
            </button>

            {/* Forgot Password | Sign In */}
            <div style={styles.linksRow}>
              <Link to="/forgot-password" style={styles.link}>Forgot Password</Link>
              <span style={styles.linkDivider}>|</span>
              <Link to="/login" style={styles.link}>Sign In</Link>
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
    padding: 24,
    fontFamily: 'var(--font-body, "DM Sans", sans-serif)',
  } as React.CSSProperties,
  pageTitle: {
    fontFamily: 'var(--font-display, "Montserrat", sans-serif)',
    fontWeight: 700,
    fontSize: 24,
    color: 'var(--brown-900, #4A3A34)',
    textAlign: 'center' as const,
    marginBottom: 16,
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
  linksRow: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: 18,
    fontSize: 13,
  } as React.CSSProperties,
  link: {
    color: 'var(--brown-500, #A8836C)',
    textDecoration: 'none',
    transition: 'color 150ms ease',
  } as React.CSSProperties,
  linkDivider: {
    color: 'var(--brown-300, #D0AE92)',
    fontWeight: 300,
  } as React.CSSProperties,
};
