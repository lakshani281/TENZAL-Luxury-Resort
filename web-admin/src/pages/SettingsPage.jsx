import React, { useState, useEffect } from 'react';
import Header from '../components/layout/Header';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import authApi from '../api/authApi';
import aboutApi from '../api/aboutApi';
import {
  User,
  Shield,
  KeyRound,
  Sliders,
  Check,
  X,
  Building,
  Save,
  RotateCcw,
} from 'lucide-react';

export default function SettingsPage() {
  const { user, updateProfile, refreshUser } = useAuth();
  const toastContext = useToast();
  const addToast = toastContext?.addToast || toastContext?.showToast || (() => {});

  const [activeTab, setActiveTab] = useState('My Account');

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    country: user?.country || 'Sri Lanka',
    address: user?.address || '',
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Resort / About Us Content Form State
  const [aboutForm, setAboutForm] = useState({
    title: '',
    intro: '',
    content: '',
    status: 'published',
  });
  const [isSavingAbout, setIsSavingAbout] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        country: user.country || 'Sri Lanka',
        address: user.address || '',
      });
    }
  }, [user]);

  // Load About Content for Resort Profile tab
  useEffect(() => {
    async function loadAbout() {
      try {
        const data = await aboutApi.getAboutContent();
        if (data) {
          setAboutForm({
            title: data.title || '',
            intro: data.intro || '',
            content: data.content || '',
            status: data.status || 'published',
          });
        }
      } catch (err) {
        console.error('Failed to load about data:', err.message);
      }
    }
    loadAbout();
  }, []);

  // Save Profile Handler
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await updateProfile({
        name: profileForm.name,
        phone: profileForm.phone,
        country: profileForm.country,
        address: profileForm.address,
      });
      addToast('Profile details updated successfully.', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to update profile.', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Password Complexity
  const hasLength = passwordForm.newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(passwordForm.newPassword);
  const hasNumber = /[0-9]/.test(passwordForm.newPassword);
  const isMatch = passwordForm.newPassword && passwordForm.newPassword === passwordForm.confirmPassword;

  // Change Password Handler
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!hasLength || !hasUpper || !hasNumber) {
      addToast('Password must be at least 8 chars with uppercase and number.', 'warning');
      return;
    }
    if (!isMatch) {
      addToast('New passwords do not match.', 'warning');
      return;
    }

    setIsSavingPassword(true);
    try {
      await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });
      addToast('Password changed successfully! Keep it secure.', 'success');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      addToast(err.message || 'Failed to change password.', 'error');
    } finally {
      setIsSavingPassword(false);
    }
  };

  // Save Resort Profile / About Us Handler
  const handleSaveAbout = async (e) => {
    e.preventDefault();
    setIsSavingAbout(true);
    try {
      await aboutApi.updateAboutContent(aboutForm);
      addToast('Resort story and About Us content updated successfully.', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to update resort content.', 'error');
    } finally {
      setIsSavingAbout(false);
    }
  };

  const navTabs = [
    { name: 'My Account', icon: User },
    { name: 'Resort Profile', icon: Building },
    { name: 'Change Password', icon: KeyRound },
    { name: 'Access Preferences', icon: Shield },
  ];

  return (
    <div>
      <Header
        title="Settings"
        subtitle="Manage your account and resort preferences"
        searchPlaceholder="Search settings..."
      />

      {/* Main Settings Split Layout (Matches Video Frame 068s) */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Left Vertical Sub-Navigation Tabs */}
        <div className="w-full md:w-60 bg-white rounded-3xl border border-gray-200/90 shadow-2xs p-3 space-y-1 shrink-0">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.name;

            return (
              <button
                key={tab.name}
                type="button"
                onClick={() => setActiveTab(tab.name)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer text-left ${
                  isActive
                    ? 'bg-teal-50 text-[#1e4852] font-bold shadow-2xs'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#275965]' : 'text-gray-400'}`} />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>

        {/* Right Tab Content Card */}
        <div className="flex-1 w-full bg-white rounded-3xl border border-gray-200/90 shadow-2xs p-8 sm:p-10">
          {/* TAB 1: MY ACCOUNT (Pixel-match to Video 068s) */}
          {activeTab === 'My Account' && (
            <div>
              <div className="mb-8">
                <h3 className="font-serif text-2xl font-bold text-gray-900">
                  My Account
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Keep your information accurate and secure.
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-6 max-w-2xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      placeholder="e.g. Nadeesha Perera"
                      required
                      className="w-full px-4 py-2.5 bg-white text-sm text-gray-800 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-[#275965]/20 focus:border-[#275965]"
                    />
                  </div>

                  {/* Email Address */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={profileForm.email}
                      disabled
                      className="w-full px-4 py-2.5 bg-gray-50 text-sm text-gray-500 rounded-xl border border-gray-200 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Role */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                      Role
                    </label>
                    <input
                      type="text"
                      value={user?.role === 'admin' ? 'Administrator' : user?.role === 'staff' ? 'Authorized Staff' : 'Guest'}
                      disabled
                      className="w-full px-4 py-2.5 bg-gray-50 text-sm font-medium text-gray-600 rounded-xl border border-gray-200 cursor-not-allowed"
                    />
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      placeholder="Optional"
                      className="w-full px-4 py-2.5 bg-white text-sm text-gray-800 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-[#275965]/20 focus:border-[#275965]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Country */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                      Country
                    </label>
                    <input
                      type="text"
                      value={profileForm.country}
                      onChange={(e) => setProfileForm({ ...profileForm, country: e.target.value })}
                      placeholder="Sri Lanka"
                      className="w-full px-4 py-2.5 bg-white text-sm text-gray-800 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-[#275965]/20 focus:border-[#275965]"
                    />
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                      Address
                    </label>
                    <input
                      type="text"
                      value={profileForm.address}
                      onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                      placeholder="Haputale Viewpoint Road, Haputale"
                      className="w-full px-4 py-2.5 bg-white text-sm text-gray-800 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-[#275965]/20 focus:border-[#275965]"
                    />
                  </div>
                </div>

                {/* Form Buttons (Matches video: Cancel, Save Changes) */}
                <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      if (user) {
                        setProfileForm({
                          name: user.name || '',
                          email: user.email || '',
                          phone: user.phone || '',
                          country: user.country || 'Sri Lanka',
                          address: user.address || '',
                        });
                      }
                      addToast('Profile changes reverted.', 'info');
                    }}
                    className="px-5 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-medium rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-6 py-2.5 bg-[#275965] hover:bg-[#1e4852] text-white text-xs font-medium rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-60"
                  >
                    {isSavingProfile ? 'Saving Changes...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: RESORT PROFILE / ABOUT US */}
          {activeTab === 'Resort Profile' && (
            <div>
              <div className="mb-8">
                <h3 className="font-serif text-2xl font-bold text-gray-900">
                  Resort Story & About Us Editorial
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Manage public-facing resort identity, history, and brand story.
                </p>
              </div>

              <form onSubmit={handleSaveAbout} className="space-y-6 max-w-2xl">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Resort Title / Page Heading
                  </label>
                  <input
                    type="text"
                    value={aboutForm.title}
                    onChange={(e) => setAboutForm({ ...aboutForm, title: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 bg-white text-sm text-gray-800 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-[#275965]/20 focus:border-[#275965]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Tagline / Intro Summary
                  </label>
                  <textarea
                    rows={2}
                    value={aboutForm.intro}
                    onChange={(e) => setAboutForm({ ...aboutForm, intro: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 bg-white text-sm text-gray-800 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-[#275965]/20 focus:border-[#275965]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    About Us Content & Philosophy
                  </label>
                  <textarea
                    rows={5}
                    value={aboutForm.content}
                    onChange={(e) => setAboutForm({ ...aboutForm, content: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 bg-white text-sm text-gray-800 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-[#275965]/20 focus:border-[#275965]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Publication Status
                  </label>
                  <select
                    value={aboutForm.status}
                    onChange={(e) => setAboutForm({ ...aboutForm, status: e.target.value })}
                    className="w-48 px-3.5 py-2 text-xs font-medium bg-white rounded-xl border border-gray-200"
                  >
                    <option value="published">Published (Live)</option>
                    <option value="draft">Draft (Review)</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
                  <button
                    type="submit"
                    disabled={isSavingAbout}
                    className="px-6 py-2.5 bg-[#275965] hover:bg-[#1e4852] text-white text-xs font-medium rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-60"
                  >
                    {isSavingAbout ? 'Saving Content...' : 'Save Resort Content'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: CHANGE PASSWORD */}
          {activeTab === 'Change Password' && (
            <div>
              <div className="mb-8">
                <h3 className="font-serif text-2xl font-bold text-gray-900">
                  Change Password
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Ensure your account is protected with a robust security passphrase.
                </p>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-6 max-w-md">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    placeholder="Enter current password"
                    required
                    className="w-full px-4 py-2.5 bg-white text-sm text-gray-800 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-[#275965]/20 focus:border-[#275965]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="Min. 8 characters"
                    required
                    className="w-full px-4 py-2.5 bg-white text-sm text-gray-800 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-[#275965]/20 focus:border-[#275965]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="Repeat new password"
                    required
                    className="w-full px-4 py-2.5 bg-white text-sm text-gray-800 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-[#275965]/20 focus:border-[#275965]"
                  />
                </div>

                {/* Password Criteria checklist */}
                {passwordForm.newPassword && (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 space-y-1 text-xs">
                    <p className="font-semibold text-gray-700 mb-1">Complexity Check:</p>
                    <div className="flex items-center gap-2">
                      {hasLength ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-gray-400" />}
                      <span className={hasLength ? 'text-emerald-700' : 'text-gray-500'}>8+ characters</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasUpper ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-gray-400" />}
                      <span className={hasUpper ? 'text-emerald-700' : 'text-gray-500'}>1 uppercase letter</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasNumber ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-gray-400" />}
                      <span className={hasNumber ? 'text-emerald-700' : 'text-gray-500'}>1 number</span>
                    </div>
                    {passwordForm.confirmPassword && (
                      <div className="flex items-center gap-2">
                        {isMatch ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-rose-500" />}
                        <span className={isMatch ? 'text-emerald-700' : 'text-rose-600'}>Passwords match</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="submit"
                    disabled={isSavingPassword}
                    className="px-6 py-2.5 bg-[#275965] hover:bg-[#1e4852] text-white text-xs font-medium rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-60"
                  >
                    {isSavingPassword ? 'Updating Password...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: ACCESS PREFERENCES */}
          {activeTab === 'Access Preferences' && (
            <div>
              <div className="mb-8">
                <h3 className="font-serif text-2xl font-bold text-gray-900">
                  Access & Security Matrix
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Overview of role-based permissions and cryptographic token configuration.
                </p>
              </div>

              <div className="space-y-4 max-w-2xl text-xs">
                <div className="p-4 bg-gray-50 border border-gray-200/90 rounded-2xl">
                  <div className="flex items-center gap-2 font-bold text-gray-900 text-sm mb-2">
                    <Shield className="w-4 h-4 text-[#275965]" />
                    <span>Role Hierarchy:</span>
                  </div>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="font-semibold text-gray-800">1. Administrator:</span>
                      <span>Full system access, staff account creation, role assignment, and resort content configuration.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-semibold text-gray-800">2. Authorized Staff:</span>
                      <span>Operational control for room availability, guest check-in, bookings, and kitchen food orders.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-semibold text-gray-800">3. Guest Customer:</span>
                      <span>Personal reservations, booking inquiry tracking, and self-profile maintenance.</span>
                    </li>
                  </ul>
                </div>

                <div className="p-4 bg-teal-50/70 border border-teal-100 rounded-2xl text-teal-900">
                  <p className="font-bold mb-1">Cryptographic Token & Middleware Foundation:</p>
                  <p className="text-teal-800/80 leading-relaxed">
                    Protected by HMAC SHA-256 JWT sessions (7-day validity) and verified through parameterized PostgreSQL queries to prevent SQL injection and horizontal privilege escalation.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
