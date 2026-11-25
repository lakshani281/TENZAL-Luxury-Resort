import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { Eye, EyeOff, Lock, Mail, ShieldCheck, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const toastContext = useToast();
  const addToast = toastContext?.addToast || toastContext?.showToast || (() => {});

  const [email, setEmail] = useState('admin@tenzal.com');
  const [password, setPassword] = useState('Password123!');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !password) {
      setErrorMessage('Please provide both your email address and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await login(email, password);
      addToast(`Welcome back, ${user.name}! Signed in as ${user.role}.`, 'success');
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.message || 'Invalid email or password.';
      setErrorMessage(msg);
      addToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const setPreset = (presetEmail, presetRole) => {
    setEmail(presetEmail);
    setPassword('Password123!');
    setErrorMessage('');
    addToast(`Selected demo credentials for: ${presetRole}`, 'info');
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#f8f8f6] font-sans text-gray-800">
      {/* Left Brand & Visual Atmosphere Column */}
      <div className="relative lg:w-1/2 min-h-[340px] lg:min-h-screen bg-[#112a31] text-white flex flex-col justify-between p-8 sm:p-12 lg:p-16 overflow-hidden">
        {/* Ambient Resort Background Photo */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-45 mix-blend-luminosity scale-105 transition-transform duration-1000"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1600&q=80')`,
          }}
        />
        {/* Soft luxury gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e242a] via-[#112a31]/80 to-transparent" />

        {/* Top Branding */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl border border-teal-400/40 flex items-center justify-center bg-teal-950/60 text-teal-300 shadow-inner backdrop-blur-xs">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <polygon points="12 2 2 12 12 22 22 12" />
              <line x1="8" y1="9" x2="16" y2="9" />
              <line x1="12" y1="9" x2="12" y2="15" />
            </svg>
          </div>
          <div>
            <h1 className="font-serif tracking-widest text-white text-lg font-bold uppercase leading-none">
              TENZAL
            </h1>
            <p className="text-[10px] tracking-widest text-teal-200/70 uppercase mt-0.5">
              LUXURY BOUTIQUE RESORT
            </p>
          </div>
        </div>

        {/* Hero Copy */}
        <div className="relative z-10 max-w-md my-auto py-12 lg:py-0">
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-white">
            Welcome to TENZAL
          </h2>
          <p className="text-teal-100/90 text-lg mt-3 font-light">
            Your Resort Management Workspace
          </p>
          <div className="mt-6 flex items-center gap-3">
            <span className="w-8 h-px bg-teal-400/60"></span>
            <span className="text-[11px] tracking-widest uppercase text-teal-200/80 font-medium">
              HAPUTALE · SRI LANKA
            </span>
          </div>
        </div>

        {/* Subtle Footer Note */}
        <div className="relative z-10 text-xs text-teal-200/50">
          User Management & About Us Module | Student ID: 22CIS0274
        </div>
      </div>

      {/* Right Login Form Column */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-16">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8">
            <span className="text-xs font-semibold tracking-widest uppercase text-[#245d6a] block">
              STAFF PORTAL
            </span>
            <h2 className="font-serif text-3xl font-bold text-gray-900 mt-1">
              Admin Sign In
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              Welcome back. Please enter your authorized staff credentials.
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-700 text-sm flex items-start gap-3 animate-fade-in">
              <span className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0"></span>
              <p className="leading-relaxed">{errorMessage}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
                Email address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@tenzal.com"
                  required
                  className="w-full px-4 py-3 bg-white text-sm text-gray-800 placeholder-gray-400 rounded-xl border border-gray-200 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-[#275965]/20 focus:border-[#275965] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-4 pr-11 py-3 bg-white text-sm text-gray-800 placeholder-gray-400 rounded-xl border border-gray-200 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-[#275965]/20 focus:border-[#275965] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-gray-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded-md border-gray-300 text-[#275965] focus:ring-[#275965]"
                />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                onClick={() => addToast('Please contact your resort system administrator to reset password.', 'info')}
                className="font-medium text-[#275965] hover:text-[#1c4049] hover:underline cursor-pointer"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-6 bg-[#275965] hover:bg-[#1e4852] active:bg-[#163840] text-white font-medium text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Prototype Quick Access Box (Matches recording badge) */}
          <div className="mt-8 p-4 rounded-2xl bg-teal-50/70 border border-teal-100 text-xs text-teal-900">
            <div className="flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-[#245d6a] mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-[#1e4852]">
                  Prototype Access & Fast Demo Presets:
                </p>
                <p className="text-teal-800/80 mt-0.5">
                  Click any role below to pre-fill verified demo credentials:
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setPreset('admin@tenzal.com', 'Administrator')}
                    className="px-2.5 py-1 bg-white border border-teal-200/90 rounded-lg font-medium text-[#1e4852] hover:bg-teal-100/60 cursor-pointer transition-colors shadow-2xs"
                  >
                    👑 Admin (Nadeesha)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreset('kasun@tenzal.com', 'Staff')}
                    className="px-2.5 py-1 bg-white border border-teal-200/90 rounded-lg font-medium text-[#1e4852] hover:bg-teal-100/60 cursor-pointer transition-colors shadow-2xs"
                  >
                    🧑‍💼 Staff (Kasun)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreset('amelia@example.com', 'Guest')}
                    className="px-2.5 py-1 bg-white border border-teal-200/90 rounded-lg font-medium text-[#1e4852] hover:bg-teal-100/60 cursor-pointer transition-colors shadow-2xs"
                  >
                    🏖️ Guest (Amelia)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Register Link */}
          <div className="mt-6 text-center text-xs text-gray-500">
            Need a new resort account?{' '}
            <Link to="/register" className="font-semibold text-[#275965] hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
