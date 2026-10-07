'use client';

import { useState } from 'react';
import { Heart, Sparkles, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function EditorLoginPage() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', password }),
      });

      const data = await res.json();

      if (data.success) {
        router.push('/editor');
        router.refresh();
      } else {
        setError(data.error || 'Password salah');
      }
    } catch {
      setError('Terjadi kesalahan. Coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 dark:from-pink-900/20 dark:via-gray-900 dark:to-purple-900/20 relative overflow-hidden flex items-center justify-center p-4">
      {/* Floating decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-10 w-16 h-16 opacity-20 animate-float" style={{ animationDelay: '0s' }}>
          <Heart className="w-full h-full text-pink-400" />
        </div>
        <div className="absolute top-20 right-16 w-12 h-12 opacity-15 animate-float" style={{ animationDelay: '1s' }}>
          <Sparkles className="w-full h-full text-purple-400" />
        </div>
        <div className="absolute bottom-20 left-16 w-14 h-14 opacity-15 animate-float" style={{ animationDelay: '2s' }}>
          <Lock className="w-full h-full text-pink-300" />
        </div>
      </div>

      <div className="relative z-10 w-full max-w-md animate-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 illustration-float">
            <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="40" cy="40" r="35" fill="#fce7f3"/>
              <rect x="20" y="20" width="40" height="40" rx="8" fill="none" stroke="#ec4899" strokeWidth="3"/>
              <path d="M40 28V40" stroke="#ec4899" strokeWidth="3" strokeLinecap="round"/>
              <path d="M40 40L40 52" stroke="#ec4899" strokeWidth="3" strokeLinecap="round"/>
              <circle cx="40" cy="40" r="4" fill="#ec4899"/>
            </svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold gradient-text mb-2">
            Dashboard Editor 🔐
          </h1>
          <p className="text-gray-600 dark:text-pink-200">
            Masukkan password buat kelola pertanyaan pdkt
          </p>
        </div>

        {/* Login Form */}
        <div className="card-cute p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
              <Lock className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-pink-200 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password editor..."
                  className="input-cute pr-12"
                  autoComplete="current-password"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-pink-400 hover:text-pink-600 dark:text-pink-500 dark:hover:text-pink-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-cute btn-cute-primary w-full py-3"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                  Masuk...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Lock className="w-5 h-5" /> Masuk ke Dashboard
                </span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-pink-500 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300 transition-colors flex items-center justify-center gap-1">
              <ArrowRight className="w-4 h-4" /> Kembali ke Halaman Publik
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-pink-400/70 dark:text-pink-500/70">
          Default password: <code className="bg-pink-100 dark:bg-pink-900/30 px-1.5 py-0.5 rounded text-pink-700 dark:text-pink-300">novia1234</code>
        </p>
      </div>
    </div>
  );
}

import { cn } from '@/lib/utils';
import Link from 'next/link';