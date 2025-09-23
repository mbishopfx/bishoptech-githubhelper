'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Lock,
  Terminal,
  Eye,
  EyeOff,
  Github
} from 'lucide-react';

export default function Home() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        // Redirect to dashboard
        window.location.href = '/dashboard';
      } else {
        const data = await response.json();
        setError(data.error || 'Invalid password');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setError('Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="glass-card p-8 rounded-2xl text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-blue-400/20 rounded-full"
            animate={{
              y: [-20, -100, -20],
              x: [-10, 10, -10],
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 10 + i * 3,
              repeat: Infinity,
              delay: i * 2,
            }}
            style={{
              left: `${30 + i * 20}%`,
              top: `${40 + i * 15}%`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="glass-card p-8 rounded-2xl"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              className="inline-flex items-center gap-2 glass-subtle px-3 py-1.5 rounded-lg mb-4"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Terminal className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-medium text-blue-400">GitHub Agent Dashboard</span>
            </motion.div>
            
            <h1 className="text-2xl font-bold text-white mb-2">Access Dashboard</h1>
            <p className="text-gray-400 text-sm">Enter your password to continue</p>
          </div>

          {/* Password Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 glass-subtle rounded-lg border border-white/10 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="Enter password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
              >
                <p className="text-red-400 text-sm">{error}</p>
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={loading || !password}
              className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
            >
              {loading ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></div>
                  Authenticating...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Access Dashboard
                </>
              )}
            </motion.button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <div className="flex items-center justify-center gap-2 text-gray-400 text-xs">
              <Github className="w-3 h-3" />
              <span>GitHub Helper - AI Assistant</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}