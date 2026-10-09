'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, Lock, Mail, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getRedirectUrlForRole, useAuth } from '@/context/AuthContext';
import { DevFlowLogo } from '@/components/common/DevFlowLogo';

export default function SignInPage() {
  const router = useRouter();
  const { login, user, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // If already authenticated, redirect based on user role
    if (isAuthenticated && user) {
      router.push(getRedirectUrlForRole(user.role));
    }
  }, [isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError('');

    try {
      const loggedUser = await login(email.trim(), password.trim());
      const redirectUrl = getRedirectUrlForRole(loggedUser.role);
      router.push(redirectUrl);
    } catch (err: any) {
      if (!err.response) {
        if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
          setError('Server took too long to respond. Please try again.');
        } else {
          setError('Unable to connect to the server. Please check that the backend is running.');
        }
      } else if (err.response.status === 401) {
        setError('Invalid email or password.');
      } else if (err.response.status === 403) {
        setError(err.response.data?.error || 'Account access restricted. Please contact your administrator.');
      } else if (err.response.status >= 500) {
        setError('Something went wrong on the server. Please try again.');
      } else {
        setError(err.response.data?.error || 'Authentication failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#060913] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-500/10 blur-[150px] pointer-events-none" />

      {/* Brand Header */}
      <div className="mb-6 sm:mb-8 text-center space-y-2 relative z-10">
        <Link href="/" className="inline-flex items-center gap-3 group">
          <DevFlowLogo size={40} showText={true} subtext="SCMS Enterprise" />
        </Link>
        <p className="text-xs text-slate-400 pt-2">Sign in to your enterprise software management workspace</p>
      </div>

      {/* Form Card */}
      <div className="w-full max-w-md p-5 sm:p-8 rounded-2xl bg-[#0b0f19] border border-slate-800 shadow-2xl space-y-6 relative z-10">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full h-11 pl-9 pr-4 text-xs bg-[#060913] border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-sky-500"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">Password</label>
              <a href="#" className="text-[11px] text-sky-400 hover:underline">Forgot password?</a>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 pl-9 pr-10 text-xs bg-[#060913] border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-sky-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 focus:outline-none transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-sky-600/25 gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{isSubmitting ? 'Authenticating...' : 'Sign In to Workspace'}</span>
            <ArrowRight className="size-4" />
          </Button>
        </form>

        <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="size-4 text-emerald-400" />
          <span>Encrypted Session • JWT & HttpOnly Protection</span>
        </div>
      </div>
    </div>
  );
}
