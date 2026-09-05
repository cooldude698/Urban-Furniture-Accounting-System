import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Check, X, Shield, User as UserIcon, Mail, Lock } from 'lucide-react';
import api from '../lib/axios';

type RoleOption = 'user' | 'admin' | 'accountant';

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    loginId: '',
    email: '',
    role: 'accountant' as RoleOption,
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  // Validation checks based on wireframe requirements
  const isLoginIdValid = form.loginId.length >= 6 && form.loginId.length <= 12;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
  const hasLower = /[a-z]/.test(form.password);
  const hasUpper = /[A-Z]/.test(form.password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password);
  const isLengthValid = form.password.length > 8;
  const isPasswordValid = hasLower && hasUpper && hasSpecial && isLengthValid;
  const doPasswordsMatch = form.password.length > 0 && form.password === form.confirmPassword;

  const isFormValid =
    form.name.trim().length > 0 &&
    isLoginIdValid &&
    isEmailValid &&
    isPasswordValid &&
    doPasswordsMatch;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isLoginIdValid) {
      setError('Login ID must be between 6 and 12 characters.');
      return;
    }
    if (!isEmailValid) {
      setError('Please provide a valid email address.');
      return;
    }
    if (!isPasswordValid) {
      setError('Password must be greater than 8 characters and contain lowercase, uppercase, and special characters.');
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
        full_name: form.name.trim(),
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
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
      <div style={{ width: '100%', maxWidth: 880, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h2 style={styles.pageTitle}>Sign Up Page</h2>

        <div style={styles.container}>
          {/* Main Create User Card */}
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
              {/* Name */}
              <div style={styles.field}>
                <label htmlFor="name" style={styles.label}>Name -</label>
                <div style={styles.inputWrapper}>
                  <UserIcon size={16} style={styles.inputIcon} />
                  <input
                    id="name"
                    type="text"
                    value={form.name}
                    onChange={set('name')}
                    required
                    style={styles.input}
                    placeholder="Full Name"
                  />
                </div>
              </div>

              {/* Enter Login Id */}
              <div style={styles.field}>
                <div style={styles.labelRow}>
                  <label htmlFor="loginId" style={styles.label}>Enter Login Id -</label>
                  {form.loginId.length > 0 && (
                    <span style={{ fontSize: 11, color: isLoginIdValid ? 'var(--posted, #5F7052)' : 'var(--danger, #9E4A38)', fontWeight: 600 }}>
                      {form.loginId.length}/12 chars {isLoginIdValid ? '✓' : '(6–12 required)'}
                    </span>
                  )}
                </div>
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
              </div>

              {/* Enter Email Id */}
              <div style={styles.field}>
                <div style={styles.labelRow}>
                  <label htmlFor="email" style={styles.label}>Enter Email Id -</label>
                  {form.email.length > 0 && (
                    <span style={{ fontSize: 11, color: isEmailValid ? 'var(--posted, #5F7052)' : 'var(--danger, #9E4A38)', fontWeight: 600 }}>
                      {isEmailValid ? 'Valid email ✓' : 'Invalid format'}
                    </span>
                  )}
                </div>
                <div style={styles.inputWrapper}>
                  <Mail size={16} style={styles.inputIcon} />
                  <input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={set('email')}
                    required
                    style={styles.input}
                    placeholder="Enter Email Id"
                  />
                </div>
              </div>

              {/* Role Selector */}
              <div style={styles.field}>
                <label style={styles.label}>Role -</label>
                <div style={styles.roleRadioGroup}>
                  <label style={{ ...styles.radioLabel, borderColor: form.role === 'user' ? 'var(--brown-700)' : 'var(--brown-300)' }}>
                    <input
                      type="radio"
                      name="role"
                      value="user"
                      checked={form.role === 'user'}
                      onChange={() => setForm(f => ({ ...f, role: 'user' }))}
                      style={styles.radioInput}
                    />
                    <span>User</span>
                  </label>

                  <label style={{ ...styles.radioLabel, borderColor: form.role === 'admin' ? 'var(--brown-700)' : 'var(--brown-300)' }}>
                    <input
                      type="radio"
                      name="role"
                      value="admin"
                      checked={form.role === 'admin'}
                      onChange={() => setForm(f => ({ ...f, role: 'admin' }))}
                      style={styles.radioInput}
                    />
                    <span>Administrator</span>
                  </label>

                  <label style={{ ...styles.radioLabel, borderColor: form.role === 'accountant' ? 'var(--brown-700)' : 'var(--brown-300)' }}>
                    <input
                      type="radio"
                      name="role"
                      value="accountant"
                      checked={form.role === 'accountant'}
                      onChange={() => setForm(f => ({ ...f, role: 'accountant' }))}
                      style={styles.radioInput}
                    />
                    <span>Accountant</span>
                  </label>
                </div>
              </div>

              {/* Enter Password */}
              <div style={styles.field}>
                <label htmlFor="password" style={styles.label}>Enter Password -</label>
                <div style={styles.inputWrapper}>
                  <Lock size={16} style={styles.inputIcon} />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
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
              </div>

              {/* Re-Enter Password */}
              <div style={styles.field}>
                <div style={styles.labelRow}>
                  <label htmlFor="confirmPassword" style={styles.label}>Re-Enter Password -</label>
                  {form.confirmPassword.length > 0 && (
                    <span style={{ fontSize: 11, color: doPasswordsMatch ? 'var(--posted, #5F7052)' : 'var(--danger, #9E4A38)', fontWeight: 600 }}>
                      {doPasswordsMatch ? 'Passwords match ✓' : 'Does not match'}
                    </span>
                  )}
                </div>
                <div style={styles.inputWrapper}>
                  <Lock size={16} style={styles.inputIcon} />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
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
              </div>

              {error && (
                <div role="alert" style={styles.errorBox}>
                  <p style={styles.errorText}>{error}</p>
                </div>
              )}

              {/* Button: SIGN UP matching wireframe */}
              <button
                type="submit"
                disabled={loading || !isFormValid}
                style={{
                  ...styles.createBtn,
                  opacity: loading || !isFormValid ? 0.6 : 1,
                  cursor: loading || !isFormValid ? 'not-allowed' : 'pointer',
                  width: '100%',
                  marginTop: 8,
                }}
              >
                {loading ? 'CREATING…' : 'SIGN UP'}
              </button>

              {/* Forgot Password | Sign In row matching wireframe */}
              <div style={styles.linksRow}>
                <Link to="/forgot-password" style={styles.link}>Forgot Password</Link>
                <span style={styles.linkDivider}>|</span>
                <Link to="/login" style={styles.link}>Sign In</Link>
              </div>
            </form>
          </div>

        {/* Credentials & Role Guidelines sidebar matching wireframe notes */}
        <div style={styles.infoCard}>
          <h2 style={styles.infoTitle}>Credential Rules</h2>
          <ul style={styles.rulesList}>
            <li style={{ ...styles.ruleItem, color: isLoginIdValid ? 'var(--posted)' : 'var(--brown-700)' }}>
              <span style={styles.ruleIcon}>{isLoginIdValid ? <Check size={14} /> : '1.'}</span>
              <span><strong>Login Id:</strong> Unique, 6–12 characters</span>
            </li>
            <li style={{ ...styles.ruleItem, color: isEmailValid ? 'var(--posted)' : 'var(--brown-700)' }}>
              <span style={styles.ruleIcon}>{isEmailValid ? <Check size={14} /> : '2.'}</span>
              <span><strong>Email:</strong> Valid & not duplicate in database</span>
            </li>
            <li style={{ ...styles.ruleItem, color: isPasswordValid ? 'var(--posted)' : 'var(--brown-700)' }}>
              <span style={styles.ruleIcon}>{isPasswordValid ? <Check size={14} /> : '3.'}</span>
              <span><strong>Password:</strong> More than 8 characters, lowercase, uppercase, and special character</span>
            </li>
          </ul>

          <div style={styles.roleGuideContainer}>
            <h3 style={styles.roleGuideTitle}>Role Privileges:</h3>
            <div style={styles.roleItem}>
              <strong>Admin:</strong> Have all access rights across system.
            </div>
            <div style={styles.roleItem}>
              <strong>Accountant:</strong> Create Master data, record Transactions, and View reports. Can manage customers/vendors, access accounting dashboard, create journal entries, invoices, bills, and payments.
            </div>
            <div style={styles.roleItem}>
              <strong>User:</strong> Customer portal access — can view invoices/bills in paid/unpaid status and pay dues.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}

const styles = {
  pageTitle: {
    fontFamily: 'var(--font-display, "Montserrat", sans-serif)',
    fontWeight: 700,
    fontSize: 24,
    color: 'var(--brown-900, #4A3A34)',
    textAlign: 'center' as const,
    marginBottom: 16,
  } as React.CSSProperties,
  linksRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 6,
  } as React.CSSProperties,
  link: {
    fontFamily: 'var(--font-body, "DM Sans", sans-serif)',
    fontSize: 13,
    color: 'var(--brown-700, #77574A)',
    textDecoration: 'none',
    fontWeight: 500,
  } as React.CSSProperties,
  linkDivider: {
    color: 'var(--brown-300, #D0AE92)',
    fontSize: 13,
  } as React.CSSProperties,
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--cream, #F9F2E4)',
    padding: '32px 20px',
    fontFamily: 'var(--font-body, "DM Sans", sans-serif)',
  } as React.CSSProperties,
  container: {
    display: 'flex',
    flexDirection: 'row' as const,
    gap: 24,
    width: '100%',
    maxWidth: 880,
    alignItems: 'flex-start',
    justifyContent: 'center',
    flexWrap: 'wrap' as const,
  },
  card: {
    background: 'var(--surface, #FFFFFF)',
    borderRadius: 'var(--radius-md, 10px)',
    boxShadow: 'var(--shadow-md, 0 4px 12px rgba(74, 58, 52, 0.08))',
    border: '1px solid rgba(208, 174, 146, 0.4)',
    padding: '32px 36px',
    width: '100%',
    maxWidth: 460,
    flex: '1 1 420px',
  } as React.CSSProperties,
  infoCard: {
    background: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 'var(--radius-md, 10px)',
    border: '1px solid var(--brown-300, #D0AE92)',
    padding: '28px 24px',
    width: '100%',
    maxWidth: 360,
    flex: '1 1 300px',
    boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(74, 58, 52, 0.06))',
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
    marginBottom: 20,
  } as React.CSSProperties,
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 6,
    background: 'var(--brown-900, #4A3A34)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as React.CSSProperties,
  logoBadgeText: {
    fontFamily: 'var(--font-display, "Montserrat", sans-serif)',
    fontWeight: 700,
    fontSize: 15,
    color: 'var(--cream, #F9F2E4)',
  } as React.CSSProperties,
  logoTitle: {
    display: 'block',
    fontFamily: 'var(--font-display, "Montserrat", sans-serif)',
    fontWeight: 700,
    fontSize: 14,
    color: 'var(--brown-900, #4A3A34)',
    lineHeight: 1.2,
  } as React.CSSProperties,
  logoSubtitle: {
    display: 'block',
    fontSize: 10,
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
  } as React.CSSProperties,
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 14,
  },
  field: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
  },
  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  } as React.CSSProperties,
  roleRadioGroup: {
    display: 'flex',
    gap: 8,
    marginTop: 4,
  } as React.CSSProperties,
  radioLabel: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 10px',
    background: 'var(--cream, #F9F2E4)',
    border: '1px solid var(--brown-300)',
    borderRadius: 'var(--radius-sm, 6px)',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--brown-900)',
    cursor: 'pointer',
  } as React.CSSProperties,
  radioInput: {
    accentColor: 'var(--brown-700, #77574A)',
    cursor: 'pointer',
  },
  buttonRow: {
    display: 'flex',
    gap: 12,
    marginTop: 10,
  } as React.CSSProperties,
  createBtn: {
    flex: 1,
    fontFamily: 'var(--font-body, "DM Sans", sans-serif)',
    fontWeight: 600,
    fontSize: 14,
    padding: '11px 16px',
    background: 'var(--brown-900, #4A3A34)',
    color: 'var(--cream, #F9F2E4)',
    border: 'none',
    borderRadius: 'var(--radius-sm, 6px)',
    cursor: 'pointer',
    boxShadow: 'var(--shadow-sm)',
  } as React.CSSProperties,
  cancelBtn: {
    flex: 1,
    fontFamily: 'var(--font-body, "DM Sans", sans-serif)',
    fontWeight: 600,
    fontSize: 14,
    padding: '11px 16px',
    background: 'var(--surface, #FFFFFF)',
    color: 'var(--brown-700, #77574A)',
    border: '1px solid var(--brown-300, #D0AE92)',
    borderRadius: 'var(--radius-sm, 6px)',
    cursor: 'pointer',
  } as React.CSSProperties,
  errorBox: {
    background: 'var(--danger-bg, #F8EAE6)',
    border: '1px solid var(--danger, #9E4A38)',
    borderRadius: 'var(--radius-sm, 6px)',
    padding: '8px 12px',
  } as React.CSSProperties,
  errorText: {
    fontSize: 12,
    color: 'var(--danger, #9E4A38)',
    margin: 0,
    fontWeight: 500,
  } as React.CSSProperties,
  loginLink: {
    fontSize: 13,
    color: 'var(--brown-700, #77574A)',
    textDecoration: 'none',
  },
  infoTitle: {
    fontFamily: 'var(--font-display, "Montserrat", sans-serif)',
    fontSize: 15,
    fontWeight: 700,
    color: 'var(--brown-900, #4A3A34)',
    marginBottom: 12,
  } as React.CSSProperties,
  rulesList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 10,
  },
  ruleItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    fontSize: 12,
    lineHeight: 1.4,
  },
  ruleIcon: {
    fontWeight: 700,
    minWidth: 16,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleGuideContainer: {
    marginTop: 20,
    paddingTop: 16,
    borderTop: '1px solid var(--brown-300, #D0AE92)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 10,
  },
  roleGuideTitle: {
    fontFamily: 'var(--font-display, "Montserrat", sans-serif)',
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--brown-900, #4A3A34)',
    margin: 0,
  } as React.CSSProperties,
  roleItem: {
    fontSize: 11,
    lineHeight: 1.4,
    color: 'var(--brown-700, #77574A)',
    background: 'rgba(235, 215, 190, 0.4)',
    padding: '8px 10px',
    borderRadius: 6,
  },
};

