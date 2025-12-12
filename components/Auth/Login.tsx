import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { BookMarked, Loader2, AlertCircle, Cloud } from 'lucide-react';

interface LoginProps {
  onNavigateToRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onNavigateToRegister }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper-100 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-book border border-paper-200">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-paper-50 mb-4">
            <BookMarked className="w-6 h-6 text-ink-900" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-ink-900">MindfulFlow</h1>
          <p className="font-sans text-ink-500 mt-2">Professional Session Organizer</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-sm flex items-center text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 mr-2" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-ink-500 uppercase tracking-wider mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full p-3 bg-paper-50 border border-paper-300 rounded-sm font-sans outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="doctor@example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-ink-500 uppercase tracking-wider mb-1">Password</label>
            <input
              type="password"
              required
              className="w-full p-3 bg-paper-50 border border-paper-300 rounded-sm font-sans outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-ink-900 text-white rounded-sm font-medium shadow-md hover:bg-ink-800 transition-colors flex items-center justify-center disabled:opacity-70 group"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <span className="flex items-center">
                Sign In
              </span>
            )}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-paper-200 pt-6">
          <p className="text-sm text-ink-500 mb-4">
            <span className="flex items-center justify-center gap-1 text-xs text-ink-400">
               <Cloud className="w-3 h-3" /> Neon DB Enabled
            </span>
          </p>
          <p className="text-sm text-ink-500">
            New to MindfulFlow?{' '}
            <button 
              onClick={onNavigateToRegister}
              className="text-accent font-medium hover:underline focus:outline-none"
            >
              Start Onboarding
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;