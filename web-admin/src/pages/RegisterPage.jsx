import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { Eye, EyeOff, Check, X, ArrowLeft } from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const toastContext = useToast();
  const addToast = toastContext?.addToast || toastContext?.showToast || (() => {});

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    country: 'Sri Lanka',
    address: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Password requirements
  const hasLength = formData.password.length >= 8;
  const hasUpper = /[A-Z]/.test(formData.password);
  const hasNumber = /[0-9]/.test(formData.password);
  const isMatch = formData.password && formData.password === formData.confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!hasLength || !hasUpper || !hasNumber) {
      setErrorMessage('Please ensure your password meets all complexity requirements.');
      return;
    }

    if (!isMatch) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        country: formData.country,
        address: formData.address,
      });

      addToast(`Account created successfully! Welcome to TENZAL, ${user.name}.`, 'success');
      navigate('/', { replace: true });
    } catch (err) {
      const msg = err.message || 'Failed to create account.';
      setErrorMessage(msg);
      addToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f8f6] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center font-sans">
      <div className="w-full max-w-xl bg-white rounded-3xl border border-gray-200/90 shadow-sm p-8 sm:p-12">
        {/* Top Back Link */}
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Sign In</span>
        </Link>

        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl border border-teal-500/30 flex items-center justify-center bg-teal-900 text-teal-300 shadow-inner">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <polygon points="12 2 2 12 12 22 22 12" />
              <line x1="8" y1="9" x2="16" y2="9" />
              <line x1="12" y1="9" x2="12" y2="15" />
            </svg>
          </div>
          <div>
            <h1 className="font-serif tracking-widest text-[#14333b] text-lg font-bold uppercase leading-none">
              TENZAL
            </h1>
            <p className="text-[10px] tracking-wider text-[#245d6a] uppercase mt-0.5">
              LUXURY BOUTIQUE RESORT
            </p>
          </div>
        </div>

        <div>
          <h2 className="font-serif text-3xl font-bold text-gray-900 tracking-tight">
            Create Your Account
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Register for guest or staff access at TENZAL Luxury Resort.
          </p>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="mt-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-3">
            <span className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0"></span>
            <p>{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Nadeesha Perera"
              required
              className="w-full px-4 py-2.5 bg-white text-sm text-gray-800 rounded-xl border border-gray-200 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-[#275965]/20 focus:border-[#275965]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@domain.com"
                required
                className="w-full px-4 py-2.5 bg-white text-sm text-gray-800 rounded-xl border border-gray-200 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-[#275965]/20 focus:border-[#275965]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+94 77 123 4567"
                className="w-full px-4 py-2.5 bg-white text-sm text-gray-800 rounded-xl border border-gray-200 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-[#275965]/20 focus:border-[#275965]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min. 8 characters"
                  required
                  className="w-full pl-4 pr-10 py-2.5 bg-white text-sm text-gray-800 rounded-xl border border-gray-200 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-[#275965]/20 focus:border-[#275965]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
                Confirm Password *
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Repeat password"
                required
                className="w-full px-4 py-2.5 bg-white text-sm text-gray-800 rounded-xl border border-gray-200 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-[#275965]/20 focus:border-[#275965]"
              />
            </div>
          </div>

          {/* Password Validation Checklist */}
          {formData.password && (
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 space-y-1 text-xs">
              <p className="font-semibold text-gray-700 mb-1">Security Standards:</p>
              <div className="flex items-center gap-2">
                {hasLength ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-gray-400" />}
                <span className={hasLength ? 'text-emerald-700' : 'text-gray-500'}>8+ characters</span>
              </div>
              <div className="flex items-center gap-2">
                {hasUpper ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-gray-400" />}
                <span className={hasUpper ? 'text-emerald-700' : 'text-gray-500'}>At least 1 uppercase letter</span>
              </div>
              <div className="flex items-center gap-2">
                {hasNumber ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-gray-400" />}
                <span className={hasNumber ? 'text-emerald-700' : 'text-gray-500'}>At least 1 number</span>
              </div>
              {formData.confirmPassword && (
                <div className="flex items-center gap-2">
                  {isMatch ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-rose-500" />}
                  <span className={isMatch ? 'text-emerald-700' : 'text-rose-600'}>Passwords match</span>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
                Country
              </label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder="Sri Lanka"
                className="w-full px-4 py-2.5 bg-white text-sm text-gray-800 rounded-xl border border-gray-200 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-[#275965]/20 focus:border-[#275965]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
                Address / City
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Haputale Viewpoint Rd"
                className="w-full px-4 py-2.5 bg-white text-sm text-gray-800 rounded-xl border border-gray-200 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-[#275965]/20 focus:border-[#275965]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-4 py-3 px-6 bg-[#275965] hover:bg-[#1e4852] text-white font-medium text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
          >
            {isSubmitting ? 'Registering Account...' : 'Complete Registration'}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-gray-500">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-[#275965] hover:underline">
            Sign In to your account
          </Link>
        </div>
      </div>
    </div>
  );
}
