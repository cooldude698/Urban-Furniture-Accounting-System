import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/axios';

export default function Login() {
  const [loginId, setLoginId] = useState('adminuf');
  const [password, setPassword] = useState('Admin@12345');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/api/auth/login', { loginId, password });
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
        <h1 style={styles.title}>Urban Furniture</h1>
        <p style={styles.subtitle}>Sign in to your account</p>

        <div style={{ padding: '8px 12px', background: '#F5EFEB', borderRadius: 6, marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, border: '1px solid #E5DFD7' }}>
          <div>
            <strong style={{ color: '#4A3B32' }}>🔑 Demo Admin:</strong> <span style={{ fontFamily: 'monospace', color: '#7B7267' }}>adminuf / Admin@12345</span>
          </div>
          <button
            type="button"
            onClick={() => { setLoginId('adminuf'); setPassword('Admin@12345'); }}
            style={{ fontSize: 11, background: '#4A3B32', color: '#fff', border: 'none', borderRadius: 4, padding: '3px 8px', cursor: 'pointer', fontWeight: 600 }}
          >
            Auto-Fill
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form} noValidate>
          <div style={styles.field}>
            <label htmlFor="loginId" style={styles.label}>Login ID</label>
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

          <div style={styles.field}>
            <label htmlFor="password" style={styles.label}>Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={styles.input}
            />
          </div>

          {error && (
            <p role="alert" style={styles.error}>
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div style={styles.links}>
          <Link to="/forgot-password" style={styles.link}>Forgot password?</Link>
          <Link to="/signup" style={styles.link}>Create account</Link>
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
    background: 'var(--cream)',
    padding: 24,
  } as React.CSSProperties,
  card: {
    background: 'var(--surface)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-md)',
    padding: 40,
    width: '100%',
    maxWidth: 400,
  } as React.CSSProperties,
  title: {
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: 24,
    color: 'var(--brown-900)',
    marginBottom: 4,
  } as React.CSSProperties,
  subtitle: {
    fontFamily: 'var(--font-body)',
    fontSize: 14,
    color: 'var(--brown-500)',
    marginBottom: 28,
  } as React.CSSProperties,
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 16,
  },
  field: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
  },
  label: {
    fontFamily: 'var(--font-body)',
    fontWeight: 500,
    fontSize: 13,
    color: 'var(--brown-700)',
  } as React.CSSProperties,
  input: {
    fontFamily: 'var(--font-body)',
    fontSize: 14,
    padding: '8px 12px',
    border: '1px solid var(--brown-300)',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--cream)',
    color: 'var(--brown-900)',
    outline: 'none',
  } as React.CSSProperties,
  error: {
    fontFamily: 'var(--font-body)',
    fontSize: 13,
    color: 'var(--danger)',
    background: 'var(--danger-bg)',
    padding: '8px 12px',
    borderRadius: 'var(--radius-sm)',
    margin: 0,
  } as React.CSSProperties,
  btn: {
    fontFamily: 'var(--font-body)',
    fontWeight: 600,
    fontSize: 14,
    padding: '10px',
    background: 'var(--brown-900)',
    color: 'var(--cream)',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    marginTop: 4,
  } as React.CSSProperties,
  links: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: 20,
  } as React.CSSProperties,
  link: {
    fontFamily: 'var(--font-body)',
    fontSize: 13,
    color: 'var(--brown-700)',
    textDecoration: 'none',
  } as React.CSSProperties,
};
