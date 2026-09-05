import React, { useState } from 'react';

interface PortalLoginProps {
  onLoginSuccess: (user: any) => void;
  onOpenInviteModal?: () => void;
}

export const PortalLogin: React.FC<PortalLoginProps> = ({ onLoginSuccess, onOpenInviteModal }) => {
  // Pre-filled with demo credentials so you never have to re-type them
  const [loginId, setLoginId] = useState('cust_urban_a');
  const [password, setPassword] = useState('SecretPassword123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performLogin = async (idToUse: string, pwdToUse: string) => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/portal/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login_id: idToUse, password: pwdToUse }),
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await performLogin(loginId, password);
  };

  const handleQuickDemoLogin = async () => {
    setLoginId('cust_urban_a');
    setPassword('SecretPassword123!');
    await performLogin('cust_urban_a', 'SecretPassword123!');
  };

  return (
    <div className="max-w-md mx-auto py-12 font-body">
      <div className="bg-white border border-slate-200 rounded-[12px] p-8 shadow-sm">
        <div className="text-center mb-6">
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

        {/* Demo Credentials Quick Fill Banner */}
        <div className="mb-6 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-[8px]">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-amber-900 block">
                🔑 Pre-filled Demo Credentials
              </span>
              <span className="text-[11px] font-mono text-amber-800">
                cust_urban_a / SecretPassword123!
              </span>
            </div>
            <button
              type="button"
              onClick={handleQuickDemoLogin}
              disabled={loading}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-[6px] shadow-xs transition-colors"
            >
              1-Click Sign In
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md mb-6 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Login ID
            </label>
            <input
              type="text"
              required
              value={loginId}
              onChange={e => setLoginId(e.target.value)}
              placeholder="e.g. cust_urban_a"
              className="w-full bg-slate-50 border border-slate-300 rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-50 border border-slate-300 rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-[6px] text-sm shadow transition-all disabled:opacity-50 mt-2"
          >
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs text-slate-500">
          <p>
            Have an invitation link?{' '}
            <button
              type="button"
              onClick={onOpenInviteModal}
              className="text-amber-700 font-semibold hover:underline"
            >
              Set password with invite token
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
