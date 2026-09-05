import React, { useState } from 'react';

interface PortalInviteAcceptProps {
  onBackToLogin: () => void;
  onPasswordSetSuccess: () => void;
}

export const PortalInviteAccept: React.FC<PortalInviteAcceptProps> = ({
  onBackToLogin,
  onPasswordSetSuccess,
}) => {
  const [token, setToken] = useState(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('token') || '';
    }
    return '';
  });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/portal/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error?.message || 'Failed to accept invitation');
      }

      setSuccess('Password set successfully! You can now log in with your credentials.');
      setTimeout(() => {
        onPasswordSetSuccess();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Invitation acceptance failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 font-body">
      <div className="bg-surface border border-brown-300 rounded-[18px] p-8 shadow-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-brown-900 text-cream rounded-[10px] flex items-center justify-center font-bold font-display text-lg mx-auto mb-3 shadow-xs">
            UF
          </div>
          <h1 className="text-2xl font-bold font-display text-brown-900">
            Activate Contact Portal
          </h1>
          <p className="text-xs text-brown-600 mt-1 font-body">
            Enter the invite token sent by the Urban Furniture team
          </p>
        </div>

        {error && (
          <div className="p-3 bg-danger-bg border border-danger text-danger text-xs rounded-md mb-6 font-medium font-body">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-posted-bg border border-posted text-posted text-xs rounded-md mb-6 font-medium font-body">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-brown-700 mb-1.5 font-body">
              Invitation Token *
            </label>
            <input
              type="text"
              required
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="Paste invitation token..."
              className="w-full bg-cream/30 border border-brown-300 rounded-[8px] px-3.5 py-2 text-sm text-brown-900 font-mono placeholder:text-brown-400 focus:bg-surface focus:border-brown-700 focus:ring-1 focus:ring-brown-700 outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-brown-700 mb-1.5 font-body">
              New Password *
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full bg-cream/30 border border-brown-300 rounded-[8px] px-3.5 py-2 text-sm text-brown-900 placeholder:text-brown-400 focus:bg-surface focus:border-brown-700 focus:ring-1 focus:ring-brown-700 outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-brown-700 mb-1.5 font-body">
              Confirm Password *
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Repeat your password"
              className="w-full bg-cream/30 border border-brown-300 rounded-[8px] px-3.5 py-2 text-sm text-brown-900 placeholder:text-brown-400 focus:bg-surface focus:border-brown-700 focus:ring-1 focus:ring-brown-700 outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-brown-900 hover:bg-brown-800 text-cream font-bold font-display rounded-[10px] shadow-sm text-xs uppercase tracking-wider transition-colors active:scale-[0.99] disabled:opacity-60 cursor-pointer"
          >
            {loading ? 'SETTING PASSWORD…' : 'ACTIVATE PORTAL ACCOUNT'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={onBackToLogin}
            className="text-xs font-semibold text-brown-700 hover:text-brown-900 underline font-body cursor-pointer"
          >
            ← Back to Portal Login
          </button>
        </div>
      </div>
    </div>
  );
};
