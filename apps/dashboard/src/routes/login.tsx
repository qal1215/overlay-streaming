import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useDevAdminAuth } from '../hooks/useAuth';
import { KeyRound } from 'lucide-react';

export const Route = createFileRoute('/login')({
  component: LoginPage,
});

function LoginPage() {
  const [secret, setSecret] = useState('');
  const [error, setError] = useState('');
  const { login } = useDevAdminAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!secret.trim()) {
      setError('Secret is required');
      return;
    }
    
    // In a real app we'd validate against the backend here.
    // For local dev MVP, we just store it and proceed.
    login(secret.trim());
    navigate({ to: '/' });
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface/50 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4 text-primary">
            <KeyRound size={32} />
          </div>
          <h1 className="text-2xl font-bold text-text">Dashboard Access</h1>
          <p className="text-text-muted mt-2 text-center text-sm">
            Enter the development admin secret to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="secret" className="block text-sm font-medium text-text-muted mb-2">
              Dev Admin Secret
            </label>
            <input
              id="secret"
              type="password"
              value={secret}
              onChange={(e) => {
                setSecret(e.target.value);
                setError('');
              }}
              placeholder="Enter secret..."
              className="w-full bg-background/50 border border-white/10 rounded-lg px-4 py-3 text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              autoFocus
            />
            {error && (
              <p className="text-red-400 text-sm mt-2">{error}</p>
            )}
          </div>
          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Authenticate
          </button>
        </form>
      </div>
    </div>
  );
}
