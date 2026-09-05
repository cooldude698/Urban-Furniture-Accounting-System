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
      setError(err.message || 'Error setting password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <div className="bg-white border border-slate-200 rounded-[12px] p-8 shadow-sm">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold font-display text-slate-900">
            Accept Contact Invitation
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Set your password using the invitation token received from your accountant
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md mb-4 font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-md mb-4 font-medium">
            ✓ {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Invite Token
            </label>
            <input
              type="text"
              required
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="Paste invite token here"
              className="w-full bg-slate-50 border border-slate-300 rounded-[6px] px-3 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Create Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Min 8 characters"
              className="w-full bg-slate-50 border border-slate-300 rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              className="w-full bg-slate-50 border border-slate-300 rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-[6px] text-sm shadow transition-all disabled:opacity-50"
          >
            {loading ? 'Setting Password...' : 'Activate Contact Account'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs">
          <button
            type="button"
            onClick={onBackToLogin}
            className="text-slate-600 hover:text-slate-900 underline font-medium"
          >
            ← Back to Portal Login
          </button>
        </div>
      </div>
    </div>
  );
};
