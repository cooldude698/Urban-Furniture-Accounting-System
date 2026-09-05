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
    <div className="max-w-md mx-auto py-12 font-body">
      <div className="bg-surface border border-brown-300 rounded-[18px] p-8 shadow-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-brown-900 text-cream rounded-[10px] flex items-center justify-center font-bold font-display text-lg mx-auto mb-3 shadow-xs">
            UF
          </div>
          <h1 className="text-2xl font-bold font-display text-brown-900">
            Contact Portal
          </h1>
          <p className="text-xs text-brown-600 mt-1 font-body">
            Restricted to invited customer contacts only
          </p>
        </div>

        {error && (
          <div className="p-3 bg-danger-bg border border-danger text-danger text-xs rounded-md mb-6 font-medium font-body">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-brown-700 mb-1.5 font-body">
              Login ID / Email
            </label>
            <input
              type="text"
              required
              value={loginId}
              onChange={e => setLoginId(e.target.value)}
              placeholder="e.g. rohit or rohit@sharma.in"
              className="w-full bg-cream/30 border border-brown-300 rounded-[8px] px-3.5 py-2 text-sm text-brown-900 font-body placeholder:text-brown-400 focus:bg-surface focus:border-brown-700 focus:ring-1 focus:ring-brown-700 outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-brown-700 mb-1.5 font-body">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-cream/30 border border-brown-300 rounded-[8px] px-3.5 py-2 text-sm text-brown-900 font-body placeholder:text-brown-400 focus:bg-surface focus:border-brown-700 focus:ring-1 focus:ring-brown-700 outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-brown-900 hover:bg-brown-800 text-cream font-bold font-display rounded-[10px] shadow-sm text-xs uppercase tracking-wider transition-colors active:scale-[0.99] disabled:opacity-60 cursor-pointer"
          >
            {loading ? 'AUTHENTICATING…' : 'SIGN IN TO PORTAL'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-brown-200/50 text-center">
          <p className="text-xs text-brown-600 mb-2 font-body">Have an invitation token?</p>
          <button
            onClick={onOpenInviteModal}
            className="text-xs font-semibold text-brown-700 hover:text-brown-900 underline font-body cursor-pointer"
          >
            Activate Account with Token →
          </button>
        </div>
      </div>
    </div>
  );
};
