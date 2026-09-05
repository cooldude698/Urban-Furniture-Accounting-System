import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';

type Role = 'accountant' | 'manager';

/**
 * Create User — Admin only.
 * Admin can set the role (Accountant or Manager).
 * Contact users are created from the Contact master, not here.
 */
export default function CreateUser() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    loginId: '',
    email: '',
    password: '',
    role: 'accountant' as Role,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/api/users', form);
      navigate('/account/users');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message;
      setError(msg ?? 'Failed to create user.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={page}>
      <div style={card}>
        <h1 style={title}>Create User</h1>
        <p style={subtitle}>Admin only — set role manually</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }} noValidate>
          <Field label="Login ID" id="loginId" type="text" value={form.loginId} onChange={set('loginId')}
            placeholder="6–12 characters" minLength={6} maxLength={12} required />
          <Field label="Email" id="email" type="email" value={form.email} onChange={set('email')} required />
          <Field label="Password" id="password" type="password" value={form.password} onChange={set('password')}
            required minLength={8} placeholder="Min 8 chars, upper + lower + special" />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label htmlFor="role" style={labelStyle}>Role</label>
            <select
              id="role"
              value={form.role}
              onChange={set('role')}
              style={{ fontFamily: 'var(--font-body)', fontSize: 14, padding: '8px 12px', border: '1px solid var(--brown-300)', borderRadius: 'var(--radius-sm)', background: 'var(--cream)', color: 'var(--brown-900)', outline: 'none' }}
            >
              <option value="accountant">Accountant</option>
              <option value="manager">Manager</option>
            </select>
          </div>

          {error && <p role="alert" style={errorStyle}>{error}</p>}

          <button type="submit" disabled={loading} style={btn}>
            {loading ? 'Creating…' : 'Create User'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, id, ...props }: { label: string; id: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label htmlFor={id} style={labelStyle}>{label}</label>
      <input id={id} {...props} style={{ fontFamily: 'var(--font-body)', fontSize: 14, padding: '8px 12px', border: '1px solid var(--brown-300)', borderRadius: 'var(--radius-sm)', background: 'var(--cream)', color: 'var(--brown-900)', outline: 'none' }} />
    </div>
  );
}

const page: React.CSSProperties = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cream)', padding: 24 };
const card: React.CSSProperties = { background: 'var(--surface)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)', padding: 40, width: '100%', maxWidth: 420 };
const title: React.CSSProperties = { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, color: 'var(--brown-900)', marginBottom: 4 };
const subtitle: React.CSSProperties = { fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--brown-700)', marginBottom: 28 };
const labelStyle: React.CSSProperties = { fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 13, color: 'var(--brown-700)' };
const errorStyle: React.CSSProperties = { fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--danger)', background: 'var(--danger-bg)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', margin: 0 };
const btn: React.CSSProperties = { fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, padding: 10, background: 'var(--brown-900)', color: 'var(--cream)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', marginTop: 4 };
