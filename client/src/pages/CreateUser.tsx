import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import api from '../lib/axios';

export default function CreateUser() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    loginId: '',
    email: '',
    role: 'Administrator' as 'User' | 'Administrator',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [createHover, setCreateHover] = useState(false);
  const [cancelHover, setCancelHover] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  // Validation rules directly from wireframe notes:
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
    form.name.trim().length > 0 &&
    isLoginIdValid &&
    isEmailValid &&
    isPasswordValid &&
    doPasswordsMatch;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) {
      setError('Please enter a Name.');
      return;
    }
    if (!isLoginIdValid) {
      setError('Login Id must be between 6 and 12 characters.');
      return;
    }
    if (!isEmailValid) {
      setError('Please enter a valid Email Id.');
      return;
    }
    if (!isPasswordValid) {
      setError('Password must contain a lowercase, uppercase, special character, and be more than 8 characters.');
      return;
    }
    if (!doPasswordsMatch) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const backendRole = form.role === 'Administrator' ? 'admin' : 'accountant';
      await api.post('/api/auth/signup', {
        login_id: form.loginId.trim(),
        loginId: form.loginId.trim(),
        full_name: form.name.trim(),
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: backendRole,
      });
      navigate('/login');
    } catch (err: unknown) {
      const errObj = (err as { response?: { data?: { error?: { message?: string; fields?: Record<string, string> } } } })?.response?.data?.error;
      const fieldError = errObj?.fields ? Object.values(errObj.fields)[0] : null;
      setError(fieldError || errObj?.message || 'Failed to create user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.pageWrapper}>
        {/* Left Column: Form Card with Create User header */}
        <div style={styles.leftCol}>
          <h2 style={styles.pageTitle}>Create User</h2>

          <div style={styles.card}>
            {/* App LoGo box matching wireframe */}
            <div style={styles.appLogoBox}>
              <div style={styles.logoBadge}>UF</div>
              <div style={styles.logoTextCol}>
                <span style={styles.appLogoText}>App LoGo</span>
                <span style={styles.appLogoSub}>Urban Furniture</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} style={styles.form} noValidate>
              {/* Name */}
              <div style={styles.row}>
                <label htmlFor="name" style={styles.rowLabel}>
                  Name
                </label>
                <div style={styles.inputContainer}>
                  <input
                    id="name"
                    type="text"
                    value={form.name}
                    onChange={set('name')}
                    required
                    style={styles.lineInput}
                  />
                </div>
              </div>

              {/* Login id */}
              <div style={styles.row}>
                <label htmlFor="loginId" style={styles.rowLabel}>
                  Login id
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

              {/* E-mail id */}
              <div style={styles.row}>
                <label htmlFor="email" style={styles.rowLabel}>
                  E-mail id
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

              {/* Role: User | Administrator radio buttons */}
              <div style={styles.row}>
                <label style={styles.rowLabel}>
                  Role
                </label>
                <div style={styles.radioGroup}>
                  <label style={styles.radioOption}>
                    <input
                      type="radio"
                      name="role"
                      value="User"
                      checked={form.role === 'User'}
                      onChange={() => setForm(f => ({ ...f, role: 'User' }))}
                      style={styles.radioInput}
                    />
                    <span style={styles.radioText}>User</span>
                  </label>

                  <label style={styles.radioOption}>
                    <input
                      type="radio"
                      name="role"
                      value="Administrator"
                      checked={form.role === 'Administrator'}
                      onChange={() => setForm(f => ({ ...f, role: 'Administrator' }))}
                      style={styles.radioInput}
                    />
                    <span style={styles.radioText}>Administrator</span>
                  </label>
                </div>
              </div>

              {/* Password */}
              <div style={styles.row}>
                <label htmlFor="password" style={styles.rowLabel}>
                  Password
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

              {/* Re-Enter Password */}
              <div style={styles.row}>
                <label htmlFor="confirmPassword" style={styles.rowLabel}>
                  Re-Enter Password
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

              {/* Wireframe Button Row: Create | Cancel */}
              <div style={styles.btnRow}>
                <button
                  type="submit"
                  disabled={loading || !isFormValid}
                  onMouseEnter={() => setCreateHover(true)}
                  onMouseLeave={() => setCreateHover(false)}
                  style={{
                    ...styles.wireframeBtn,
                    background: createHover ? 'var(--brown-900, #4A3A34)' : 'transparent',
                    color: createHover ? 'var(--cream, #F9F2E4)' : 'var(--brown-900, #4A3A34)',
                    opacity: loading || !isFormValid ? 0.6 : 1,
                    cursor: loading || !isFormValid ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading ? 'Creating…' : 'Create'}
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  onMouseEnter={() => setCancelHover(true)}
                  onMouseLeave={() => setCancelHover(false)}
                  style={{
                    ...styles.wireframeBtn,
                    background: cancelHover ? 'var(--brown-900, #4A3A34)' : 'transparent',
                    color: cancelHover ? 'var(--cream, #F9F2E4)' : 'var(--brown-900, #4A3A34)',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Wireframe Notes */}
        <div style={styles.rightCol}>
          <div style={styles.notesSection}>
            <p style={styles.notesHeader}>For create user page check creds as follows</p>
            <ol style={styles.rulesList}>
              <li style={styles.ruleItem}>Login Id should be unique and must be between 6-12 characters</li>
              <li style={styles.ruleItem}>Email should not be a duplicate in database</li>
              <li style={styles.ruleItem}>Password must be unique and must contain a small case, a large case and a special character and must have more than 8 characters</li>
            </ol>
          </div>

          <div style={{ ...styles.notesSection, marginTop: 40 }}>
            <p style={styles.notesHeader}>Role</p>
            <div style={styles.roleDescList}>
              <p style={styles.roleDescItem}>
                <strong style={styles.roleTitle}>Admin -</strong> Have all access rights
              </p>
              <p style={styles.roleDescItem}>
                <strong style={styles.roleTitle}>User -</strong> can only see his invoices/bills in paid/unpaid status and can directly pay his dues from portal
              </p>
              <div style={styles.roleDescItem}>
                <p style={{ margin: 0 }}>
                  <strong style={styles.roleTitle}>Accountant -</strong> Create Master data, record Transactions and View reports.
                </p>
                <p style={{ margin: '4px 0 0 0', paddingLeft: 12 }}>
                  Can manage customers/vendors, access accounting dashboard, create journal entries,
                </p>
                <p style={{ margin: '2px 0 0 0', paddingLeft: 12 }}>
                  Can create and manage invoices, bills, and payments
                </p>
              </div>
            </div>
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
    padding: '36px 24px',
    fontFamily: 'var(--font-body, "DM Sans", sans-serif)',
  } as React.CSSProperties,
  pageWrapper: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 48,
    width: '100%',
    maxWidth: 1040,
    flexWrap: 'wrap' as const,
  },
  leftCol: {
    display: 'flex',
    flexDirection: 'column' as const,
    width: '100%',
    maxWidth: 490,
  },
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
  } as React.CSSProperties,
  appLogoBox: {
    width: 175,
    height: 56,
    margin: '0 auto 32px auto',
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
    gap: 20,
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
    minWidth: 140,
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
  radioGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 24,
    flex: 1,
    padding: '4px 0',
  } as React.CSSProperties,
  radioOption: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
  } as React.CSSProperties,
  radioInput: {
    accentColor: 'var(--brown-900, #4A3A34)',
    cursor: 'pointer',
    width: 16,
    height: 16,
  } as React.CSSProperties,
  radioText: {
    fontFamily: 'var(--font-body, "DM Sans", sans-serif)',
    fontSize: 14,
    color: 'var(--brown-900, #4A3A34)',
    fontWeight: 500,
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
  btnRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 20,
    marginTop: 16,
  } as React.CSSProperties,
  wireframeBtn: {
    flex: 1,
    padding: '9px 20px',
    border: '1.5px solid var(--brown-900, #4A3A34)',
    borderRadius: 12,
    fontFamily: 'var(--font-display, "Montserrat", sans-serif)',
    fontWeight: 700,
    fontSize: 13,
    letterSpacing: '0.04em',
    textAlign: 'center' as const,
    transition: 'all 150ms ease',
  } as React.CSSProperties,
  rightCol: {
    flex: '1 1 360px',
    maxWidth: 480,
    paddingTop: 48,
  } as React.CSSProperties,
  notesSection: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  notesHeader: {
    fontFamily: 'var(--font-body, "DM Sans", sans-serif)',
    fontSize: 15,
    fontWeight: 700,
    color: 'var(--brown-900, #4A3A34)',
    margin: '0 0 12px 0',
  } as React.CSSProperties,
  rulesList: {
    margin: 0,
    paddingLeft: 20,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  } as React.CSSProperties,
  ruleItem: {
    fontFamily: 'var(--font-body, "DM Sans", sans-serif)',
    fontSize: 13,
    color: 'var(--brown-800, #5C463B)',
    lineHeight: 1.45,
  } as React.CSSProperties,
  roleDescList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
  },
  roleDescItem: {
    fontFamily: 'var(--font-body, "DM Sans", sans-serif)',
    fontSize: 13,
    color: 'var(--brown-800, #5C463B)',
    margin: 0,
    lineHeight: 1.45,
  } as React.CSSProperties,
  roleTitle: {
    color: 'var(--brown-900, #4A3A34)',
    fontWeight: 700,
  } as React.CSSProperties,
};
