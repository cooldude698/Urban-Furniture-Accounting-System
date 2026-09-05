import React, { useState } from 'react';

interface PortalLoginProps {
  onLoginSuccess: (user: any) => void;
  onOpenInviteModal?: () => void;
}

export const PortalLogin: React.FC<PortalLoginProps> = ({ onLoginSuccess, onOpenInviteModal }) => {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/portal/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login_id: loginId, password }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error?.message || 'Invalid Login Id or Password');
      }

      onLoginSuccess(json.data.user);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <div className="bg-white border border-slate-200 rounded-[12px] p-8 shadow-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-amber-500 rounded-[8px] flex items-center justify-center text-slate-950 font-bold font-display text-xl mx-auto mb-3 shadow-sm">
            U
          </div>
          <h1 className="text-2xl font-bold font-display text-slate-900">
            Contact Portal
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Restricted to invited customer contacts only
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md mb-6 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Login ID / Email
            </label>
            <input
              type="text"
              required
              value={loginId}
              onChange={e => setLoginId(e.target.value)}
              placeholder="e.g. rohit or rohit@sharma.in"
              className="w-full bg-slate-50 border border-slate-300 rounded-[6px] px-3.5 py-2 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-50 border border-slate-300 rounded-[6px] px-3.5 py-2 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-amber-400 font-semibold rounded-[6px] shadow-sm text-sm transition-colors active:scale-[0.99] disabled:bg-slate-400"
          >
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500 mb-2">Have an invitation token?</p>
          <button
            onClick={onOpenInviteModal}
            className="text-xs font-semibold text-amber-600 hover:text-amber-700 underline"
          >
            Activate Account with Token →
          </button>
        </div>
      </div>
    </div>
  );
};
