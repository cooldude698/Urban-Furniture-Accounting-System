import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/axios';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/api/auth/forgot-password', { email });
      setSent(true);
    } catch {
      setError('Could not process request. Please check the email address.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={page}>
      <div style={card}>
        <h1 style={title}>Reset Password</h1>

        {sent ? (
          <div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--posted)', marginBottom: 20 }}>
              If that email is registered, you'll receive reset instructions shortly.
            </p>
            <Link to="/login" style={link}>← Back to sign in</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }} noValidate>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label htmlFor="email" style={labelStyle}>Email address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={input}
                placeholder="you@example.com"
              />
            </div>

            {error && <p role="alert" style={errorStyle}>{error}</p>}

            <button type="submit" disabled={loading} style={btn}>
              {loading ? 'Sending…' : 'Send Reset Link'}
            </button>

            <Link to="/login" style={{ ...link, textAlign: 'center' }}>← Back to sign in</Link>
          </form>
        )}
      </div>
    </div>
  );
}

const page: React.CSSProperties = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cream)', padding: 24 };
const card: React.CSSProperties = { background: 'var(--surface)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)', padding: 40, width: '100%', maxWidth: 400 };
const title: React.CSSProperties = { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, color: 'var(--brown-900)', marginBottom: 24 };
const labelStyle: React.CSSProperties = { fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 13, color: 'var(--brown-700)' };
const input: React.CSSProperties = { fontFamily: 'var(--font-body)', fontSize: 14, padding: '8px 12px', border: '1px solid var(--brown-300)', borderRadius: 'var(--radius-sm)', background: 'var(--cream)', color: 'var(--brown-900)', outline: 'none' };
const errorStyle: React.CSSProperties = { fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--danger)', background: 'var(--danger-bg)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', margin: 0 };
const btn: React.CSSProperties = { fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, padding: 10, background: 'var(--brown-900)', color: 'var(--cream)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer' };
const link: React.CSSProperties = { fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--brown-700)', textDecoration: 'none' };
