import React, { useState } from 'react';
import { X, Lock, Mail, User, AlertCircle, Loader2, Scale } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AuthModal = ({ isOpen, onClose, defaultMode = 'login' }) => {
  const [mode, setMode] = useState(defaultMode); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        if (!fullName.trim()) {
          throw new Error('Full name is required.');
        }
        await register(email, password, fullName);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = () => {
    setEmail('counsel.demo@amicus.legal');
    setPassword('DemoPassword123!');
    setFullName('Sarah Jenkins, J.D.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-sm animate-fadeIn">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-md p-6 sm:p-8 shadow-elevated relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-muted hover:text-heading hover:bg-subtle rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-10 h-10 rounded-lg bg-accent-soft border border-accent-border flex items-center justify-center text-accent mx-auto mb-3">
            <Scale className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-heading">
            {mode === 'login' ? 'Sign in to Amicus' : 'Create an Account'}
          </h2>
          <p className="text-xs text-muted mt-1">
            {mode === 'login'
              ? 'Access your contract reviews, saved playbooks, and audits'
              : 'Start analyzing agreements and verifying legal risks'}
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex rounded-lg bg-subtle p-1 mb-5 border border-border">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
              mode === 'login'
                ? 'bg-surface text-heading shadow-subtle'
                : 'text-muted hover:text-heading'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(null); }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
              mode === 'register'
                ? 'bg-surface text-heading shadow-subtle'
                : 'text-muted hover:text-heading'
            }`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-risk-severe-soft border border-risk-severe-border flex items-start gap-2.5 text-xs text-risk-severe">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-heading uppercase tracking-wider mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Sarah Jenkins, J.D."
                  className="w-full bg-canvas border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-heading placeholder:text-muted focus:outline-none focus:border-accent"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-heading uppercase tracking-wider mb-1">
              Work Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="s.jenkins@lawfirm.com"
                className="w-full bg-canvas border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-heading placeholder:text-muted focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-heading uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="w-full bg-canvas border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-heading placeholder:text-muted focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-lg bg-accent hover:bg-accent-hover active:bg-accent-active disabled:opacity-50 text-accent-fg font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-subtle mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
            )}
          </button>
        </form>

        {/* Demo Credentials Helper */}
        <div className="mt-5 pt-4 border-t border-border text-center">
          <button
            type="button"
            onClick={handleDemoFill}
            className="text-xs text-accent hover:text-accent-hover underline font-mono"
          >
            ⚡ Quick-fill demo account credentials
          </button>
        </div>
      </div>
    </div>
  );
};
