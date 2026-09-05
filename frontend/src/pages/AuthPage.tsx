import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const AuthPage: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login, register, loginAsDemo } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isRegister) {
        await register({ name, email, password });
      } else {
        await login({ email, password });
      }
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginAsDemo();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="card max-w-md w-full p-8 space-y-6 border border-white/10 shadow-2xl relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="text-center space-y-2 relative">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center mx-auto text-xl shadow-glow">
            ⚡
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {isRegister ? 'Create your Nexora Account' : 'Welcome to Nexora AI'}
          </h1>
          <p className="text-xs text-slate-400">
            {isRegister
              ? 'Join the multi-agent autonomous goal execution platform'
              : 'From Ambition to Autonomous Execution · Sign in to your agent fleet'}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative">
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
              <input
                type="text"
                placeholder="Arpit Sharma"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Email Address</label>
            <input
              type="email"
              placeholder="arpit@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-medium rounded-xl text-sm transition-all disabled:opacity-50 shadow-glow"
          >
            {loading ? 'Authenticating...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-white/10 w-full"></div>
          <span className="bg-slate-900 px-3 text-[10px] text-slate-500 uppercase tracking-wider absolute">OR</span>
        </div>

        <button
          onClick={handleDemo}
          disabled={loading}
          type="button"
          className="w-full py-2.5 bg-slate-800/80 hover:bg-slate-700/80 text-white font-medium rounded-xl text-xs transition-all border border-white/10 flex items-center justify-center gap-2"
        >
          <span>🚀</span> Quick 1-Click Demo Login
        </button>

        <div className="text-center text-xs text-slate-400 pt-2">
          {isRegister ? (
            <span>Already have an account? <button onClick={() => setIsRegister(false)} className="text-primary-400 hover:underline font-medium">Sign In</button></span>
          ) : (
            <span>Don't have an account? <button onClick={() => setIsRegister(true)} className="text-primary-400 hover:underline font-medium">Register</button></span>
          )}
        </div>
      </div>
    </div>
  );
};
