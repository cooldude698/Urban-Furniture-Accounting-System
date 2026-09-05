import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/axios';

/**
 * Signup — creates Accountant role ONLY.
 * No role selector is shown. Per spec: public signup → Accountant.
 */
export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ loginId: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/auth/signup', {
        loginId: form.loginId,
        email: form.email,
        password: form.password,
        role: 'accountant', // hardcoded — public signup always accountant
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
    <div style={page}>
      <div style={card}>
        <h1 style={title}>Create Account</h1>
        <p style={subtitle}>You'll be registered as an Accountant</p>

        <form onSubmit={handleSubmit} style={form_} noValidate>
          <Field label="Login ID" id="loginId" type="text" value={form.loginId} onChange={set('loginId')}
            placeholder="6–12 characters" minLength={6} maxLength={12} required />
          <Field label="Email" id="email" type="email" value={form.email} onChange={set('email')} required />
          <Field label="Password" id="password" type="password" value={form.password} onChange={set('password')}
            placeholder="Min 8 chars, upper + lower + special" required minLength={8} />
          <Field label="Confirm Password" id="confirmPassword" type="password"
            value={form.confirmPassword} onChange={set('confirmPassword')} required />

          {error && <p role="alert" style={errorStyle}>{error}</p>}

          <button type="submit" disabled={loading} style={btn}>
            {loading ? 'Creating…' : 'Create Account'}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <Link to="/login" style={link}>Already have an account? Sign in</Link>
        </div>
      </div>
    </div>
  );
}

function Field({ label, id, ...props }: { label: string; id: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label htmlFor={id} style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 13, color: 'var(--brown-700)' }}>{label}</label>
      <input id={id} {...props} style={{ fontFamily: 'var(--font-body)', fontSize: 14, padding: '8px 12px', border: '1px solid var(--brown-300)', borderRadius: 'var(--radius-sm)', background: 'var(--cream)', color: 'var(--brown-900)', outline: 'none' }} />
    </div>
  );
}

const page: React.CSSProperties = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cream)', padding: 24 };
const card: React.CSSProperties = { background: 'var(--surface)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)', padding: 40, width: '100%', maxWidth: 420 };
const title: React.CSSProperties = { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, color: 'var(--brown-900)', marginBottom: 4 };
const subtitle: React.CSSProperties = { fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--brown-700)', marginBottom: 28 };
const form_: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 16 };
const errorStyle: React.CSSProperties = { fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--danger)', background: 'var(--danger-bg)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', margin: 0 };
const btn: React.CSSProperties = { fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, padding: 10, background: 'var(--brown-900)', color: 'var(--cream)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', marginTop: 4 };
const link: React.CSSProperties = { fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--brown-700)', textDecoration: 'none' };
