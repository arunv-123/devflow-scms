'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Sparkles, ArrowRight, Lock, ShieldCheck, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { authApi } from '@/services/authApi';
import { DevFlowLogo } from '@/components/common/DevFlowLogo';

function AcceptInvitationContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<{ email: string; name: string; role: string; department?: string } | null>(null);
  const [error, setError] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invitation token is missing from the URL.');
      setLoading(false);
      return;
    }

    authApi
      .validateInvitationToken(token)
      .then((data) => {
        setInvitation(data);
        setError('');
      })
      .catch((err: any) => {
        setError(err.response?.data?.error || err.message || 'Invalid or expired invitation link.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  // Password requirements calculation
  const hasMinLen = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumberOrSymbol = /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  const matches = password.length > 0 && password === confirmPassword;

  const isValidPassword = hasMinLen && hasUpper && hasLower && hasNumberOrSymbol && matches;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidPassword || !token) return;

    setError('');
    setSubmitting(true);

    try {
      await authApi.acceptInvitation(token, password);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to activate account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-500/10 blur-[150px] pointer-events-none" />

      {/* Brand Header */}
      <div className="mb-8 text-center space-y-2 relative z-10">
        <Link href="/" className="inline-flex items-center gap-3 group">
          <DevFlowLogo size={40} showText={true} subtext="SCMS Enterprise" />
        </Link>
        <p className="text-xs text-slate-400 pt-2">Activate your workspace invitation and set your password</p>
      </div>

      {/* Card Container */}
      <div className="w-full max-w-md p-8 rounded-2xl bg-[#0b0f19] border border-slate-800 shadow-2xl space-y-6 relative z-10">
        {loading ? (
          <div className="text-center py-8 space-y-3">
            <div className="size-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Verifying your secure invitation link...</p>
          </div>
        ) : success ? (
          <div className="text-center space-y-5 py-4">
            <div className="size-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="size-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Account Activated!</h3>
              <p className="text-xs text-slate-400">
                Your password has been configured securely. You can now log into your workspace.
              </p>
            </div>
            <Link href="/auth/signin">
              <Button className="w-full h-11 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-sky-600/25 gap-2 mt-4">
                <span>Proceed to Sign In</span>
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        ) : error ? (
          <div className="space-y-5 py-4">
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs space-y-2 flex items-start gap-3">
              <AlertCircle className="size-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Invitation Error</span>
                <span>{error}</span>
              </div>
            </div>
            <Link href="/auth/signin">
              <Button variant="outline" className="w-full text-xs text-slate-300 border-slate-800">
                Back to Sign In
              </Button>
            </Link>
          </div>
        ) : invitation ? (
          <div className="space-y-6">
            {/* User Details Box */}
            <div className="p-4 rounded-xl bg-[#060913] border border-slate-800 space-y-1 text-xs">
              <div className="text-slate-400">Invited Member: <span className="text-white font-bold">{invitation.name}</span></div>
              <div className="text-slate-400">Email Address: <span className="text-sky-400 font-mono">{invitation.email}</span></div>
              <div className="text-slate-400">Assigned Role: <span className="text-purple-400 font-semibold">{invitation.role}</span></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Create Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password..."
                    className="w-full h-11 pl-9 pr-10 text-xs bg-[#060913] border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-sky-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password..."
                    className="w-full h-11 pl-9 pr-4 text-xs bg-[#060913] border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-sky-500"
                    required
                  />
                </div>
              </div>

              {/* Password Checklist */}
              <div className="p-3 rounded-xl bg-[#060913] border border-slate-800 space-y-1.5 text-[11px]">
                <span className="font-semibold text-slate-400 block mb-1">Password Requirements:</span>
                <div className={`flex items-center gap-2 ${hasMinLen ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <CheckCircle2 className="size-3.5" />
                  <span>At least 8 characters</span>
                </div>
                <div className={`flex items-center gap-2 ${hasUpper && hasLower ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <CheckCircle2 className="size-3.5" />
                  <span>Uppercase & lowercase letters</span>
                </div>
                <div className={`flex items-center gap-2 ${hasNumberOrSymbol ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <CheckCircle2 className="size-3.5" />
                  <span>Number or special character (!@#$...)</span>
                </div>
                <div className={`flex items-center gap-2 ${matches ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <CheckCircle2 className="size-3.5" />
                  <span>Passwords match</span>
                </div>
              </div>

              <Button
                type="submit"
                disabled={!isValidPassword || submitting}
                className="w-full h-11 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-sky-600/25 gap-2 mt-2"
              >
                <span>{submitting ? 'Activating Account...' : 'Activate Account'}</span>
                <ArrowRight className="size-4" />
              </Button>
            </form>
          </div>
        ) : null}

        <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="size-4 text-emerald-400" />
          <span>Encrypted Account Onboarding • Single-Use Token</span>
        </div>
      </div>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#060913] text-white flex items-center justify-center text-xs">Loading...</div>}>
      <AcceptInvitationContent />
    </Suspense>
  );
}
