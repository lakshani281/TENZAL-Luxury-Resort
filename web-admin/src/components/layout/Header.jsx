import React from 'react';
import { Search, Bell } from 'lucide-react';

export default function Header({ title, subtitle, searchPlaceholder = 'Search records...', onSearchChange }) {
  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-6 border-b border-gray-200/80">
      <div>
        <h2 className="font-serif text-3xl font-bold text-gray-900 tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-1">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-4 self-end md:self-auto">
        {/* Search Input */}
        <div className="relative w-64 md:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white text-sm text-gray-800 placeholder-gray-400 rounded-xl border border-gray-200 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-[#275965]/20 focus:border-[#275965] transition-all"
          />
        </div>

        {/* Bell Notifications */}
        <button
          type="button"
          className="relative p-2.5 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-50 shadow-2xs transition-all cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
        </button>

        {/* User Badge */}
        <div className="flex items-center gap-3 pl-2">
          <div className="w-10 h-10 rounded-full bg-[#d8b5a0] text-[#4a2e1d] font-semibold flex items-center justify-center text-sm shadow-xs">
            NP
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-sm font-semibold text-gray-900 leading-tight">
              Nadeesha Perera
            </p>
            <p className="text-xs text-gray-400">
              Administrator
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
