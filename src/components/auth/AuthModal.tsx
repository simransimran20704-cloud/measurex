import React, { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useAppStore } from '../../stores/appStore';
import { Logo } from '../common/Logo';
import {
  X,
  Lock,
  Mail,
  User,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Crown,
  Eye,
  EyeOff,
  AlertCircle,
  KeyRound,
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalMode,
    authPromptReason,
    login,
    signup,
    loginAsDemo,
  } = useAuthStore();
  const { showToast } = useAppStore();

  const [mode, setMode] = useState<'login' | 'signup'>(authModalMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleFillCredentials = (demoEmail: string, demoPass: string, demoName?: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    if (demoName) setName(demoName);
    setErrorMessage(null);
    setSuccessMessage(null);
    showToast(`Autofilled credentials for ${demoEmail}`, 'info');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (mode === 'login') {
      if (!email.trim() || !password.trim()) {
        const err = 'Please enter both email and password';
        setErrorMessage(err);
        showToast(err, 'warning');
        return;
      }

      const res = login(email, password);
      if (!res.success) {
        setErrorMessage(res.error || 'Invalid credentials');
        showToast(res.error || 'Authentication failed', 'warning');
        return;
      }

      setSuccessMessage(null);
      showToast(`Welcome back, ${email.split('@')[0]}!`, 'success');
    } else {
      if (!name.trim() || !email.trim() || !password.trim()) {
        const err = 'Please fill all required registration fields';
        setErrorMessage(err);
        showToast(err, 'warning');
        return;
      }

      const res = signup(name, email, password);
      if (!res.success) {
        setErrorMessage(res.error || 'Registration failed');
        setSuccessMessage(null);
        showToast(res.error || 'Registration failed', 'warning');
        return;
      }

      // DO NOT DIRECT SIGN IN! User must explicitly sign in with their password
      setMode('login');
      setPassword('');
      setErrorMessage(null);
      setSuccessMessage(`Account created for ${name}! Please sign in with your password to continue.`);
      showToast('Account created! Please sign in with your password.', 'info');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-white border border-white/90 shadow-2xl overflow-hidden flex flex-col">
        {/* Header with Logo */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/60 via-white to-purple-50/60">
          <Logo size="sm" showTagline={false} />
          <button
            onClick={closeAuthModal}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors shadow-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Prompt Alert if triggered by a protected action */}
        {authPromptReason && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-900 leading-relaxed">
            <Lock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Authentication Required:</span> {authPromptReason}
            </div>
          </div>
        )}

        {/* Success message banner when account is created */}
        {successMessage && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 flex items-start gap-2.5 text-xs text-emerald-900 leading-relaxed animate-in fade-in shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold block text-emerald-800">Account Created Successfully!</span>
              <span>{successMessage}</span>
            </div>
          </div>
        )}

        {/* Error message banner if authentication fails */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-red-50 border border-red-200/90 flex items-start gap-2.5 text-xs text-red-900 leading-relaxed animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold block">Authentication Error:</span>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Tab switchers */}
        <div className="px-6 pt-5">
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100">
            <button
              onClick={() => {
                setMode('login');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`py-2 rounded-xl text-xs font-bold transition-all ${
                mode === 'login' ? 'bg-white text-[#4385E8] shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign In (Password)
            </button>
            <button
              onClick={() => {
                setMode('signup');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`py-2 rounded-xl text-xs font-bold transition-all ${
                mode === 'signup' ? 'bg-white text-[#8064E8] shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {mode === 'signup' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Aryan Mehta"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs font-medium rounded-xl border border-slate-200 outline-none focus:border-[#4385E8]"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="simran.sharma@measurex.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs font-medium rounded-xl border border-slate-200 outline-none focus:border-[#4385E8]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Password</label>
              <span className="text-[10px] text-slate-400 font-mono">
                {mode === 'signup' ? 'Min. 6 chars' : 'Encrypted'}
              </span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 text-xs font-medium rounded-xl border border-slate-200 outline-none focus:border-[#4385E8]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-3 rounded-2xl bg-gradient-to-r from-[#4385E8] to-[#8064E8] text-white font-bold text-xs shadow-md shadow-brand-blue/25 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{mode === 'login' ? 'Authenticate with Password' : 'Register Pro Engineering Account'}</span>
          </button>
        </form>

        {/* Demo Credentials Quick-Fill Chips */}
        <div className="px-6 pb-6 pt-2 border-t border-slate-100 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Autofill Verified Demo Credentials
            </span>
            <span className="text-[9px] text-[#4385E8] font-bold">Click to load</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleFillCredentials('simran.sharma@measurex.io', 'MeasureX@2026', 'Simran Sharma')}
              className="px-3 py-2 rounded-xl bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200 text-[#4385E8] text-[11px] font-bold flex flex-col items-start transition-all text-left"
            >
              <div className="flex items-center gap-1.5 w-full">
                <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                <span className="truncate">Simran Sharma</span>
              </div>
              <span className="text-[9px] font-mono text-slate-500 font-normal">MeasureX@2026 (Pro)</span>
            </button>

            <button
              type="button"
              onClick={() => handleFillCredentials('director@measurex.io', 'LabDirector@2026', 'Dr. Vikram Sarabhai')}
              className="px-3 py-2 rounded-xl bg-purple-50/80 hover:bg-purple-100/80 border border-purple-200 text-[#8064E8] text-[11px] font-bold flex flex-col items-start transition-all text-left"
            >
              <div className="flex items-center gap-1.5 w-full">
                <Sparkles className="w-3.5 h-3.5 text-[#8064E8]" />
                <span className="truncate">Dr. Vikram</span>
              </div>
              <span className="text-[9px] font-mono text-slate-500 font-normal">LabDirector@2026 (Ent)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
