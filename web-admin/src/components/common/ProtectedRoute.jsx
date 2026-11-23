import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f8f6]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl border-2 border-[#245d6a]/20 border-t-[#245d6a] animate-spin"></div>
          <p className="text-xs uppercase tracking-widest text-[#245d6a] font-serif font-semibold">
            Authenticating TENZAL Workspace...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = (user?.role || '').toLowerCase();
    const hasRole = allowedRoles.some((r) => r.toLowerCase() === userRole);

    if (!hasRole) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8 bg-white rounded-3xl border border-gray-200 mt-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h3 className="font-serif text-2xl font-bold text-gray-900">Access Restricted</h3>
          <p className="text-sm text-gray-500 max-w-md mt-2">
            Your current account role (<span className="font-semibold text-gray-800">{user?.role}</span>) does not have permission to view or manage this section.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              Go Back
            </button>
            <a
              href="/"
              className="px-5 py-2 bg-[#275965] hover:bg-[#1f4751] text-white rounded-xl text-sm font-medium cursor-pointer shadow-xs"
            >
              Overview Dashboard
            </a>
          </div>
        </div>
      );
    }
  }

  return children;
}
