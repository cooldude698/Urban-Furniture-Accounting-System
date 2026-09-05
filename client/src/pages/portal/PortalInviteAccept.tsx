import React, { useState } from 'react';

interface PortalInviteAcceptProps {
  onBackToLogin: () => void;
  onPasswordSetSuccess: () => void;
}

export const PortalInviteAccept: React.FC<PortalInviteAcceptProps> = ({
  onBackToLogin,
  onPasswordSetSuccess,
}) => {
  const [token, setToken] = useState('');
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
    <div className="max-w-md mx-auto py-12">
      <div className="bg-white border border-slate-200 rounded-[12px] p-8 shadow-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-amber-500 rounded-[8px] flex items-center justify-center text-slate-950 font-bold font-display text-xl mx-auto mb-3 shadow-sm">
            ✓
          </div>
          <h1 className="text-2xl font-bold font-display text-slate-900">
            Activate Contact Portal
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Enter the invite token sent by the Urban Furniture team
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md mb-6 font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-md mb-6 font-medium">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Invitation Token *
            </label>
            <input
              type="text"
              required
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="Paste invitation token..."
              className="w-full bg-slate-50 border border-slate-300 rounded-[6px] px-3.5 py-2 text-sm text-slate-900 font-mono focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              New Password *
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full bg-slate-50 border border-slate-300 rounded-[6px] px-3.5 py-2 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Confirm Password *
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Repeat your password"
              className="w-full bg-slate-50 border border-slate-300 rounded-[6px] px-3.5 py-2 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-amber-400 font-semibold rounded-[6px] shadow-sm text-sm transition-colors active:scale-[0.99] disabled:bg-slate-400"
          >
            {loading ? 'Setting Password...' : 'Activate Portal Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={onBackToLogin}
            className="text-xs text-slate-500 hover:text-slate-800 underline"
          >
            ← Back to Portal Login
          </button>
        </div>
      </div>
    </div>
  );
};
