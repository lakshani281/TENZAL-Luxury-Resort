import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutGrid,
  BedDouble,
  CalendarDays,
  UtensilsCrossed,
  ShoppingBag,
  Image,
  MapPin,
  Compass,
  FileText,
  Mail,
  Users,
  ShieldCheck,
  Sun,
  LogOut,
} from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();

  const mainNav = [
    { name: 'Overview', path: '/', icon: LayoutGrid, activeMatch: (p) => p === '/' || p === '/overview' },
    { name: 'Rooms', path: '/rooms', icon: BedDouble, activeMatch: (p) => p.startsWith('/rooms') },
    { name: 'Bookings', path: '/bookings', icon: CalendarDays, activeMatch: (p) => p.startsWith('/bookings') },
    { name: 'Food Menu', path: '/food-menu', icon: UtensilsCrossed, activeMatch: (p) => p.startsWith('/food-menu') },
    { name: 'Food Orders', path: '/food-orders', icon: ShoppingBag, activeMatch: (p) => p.startsWith('/food-orders') },
  ];

  const contentNav = [
    { name: 'Gallery', path: '/gallery', icon: Image },
    { name: 'Destinations', path: '/destinations', icon: MapPin },
    { name: 'Plan My Day Data', path: '/plan-my-day', icon: Compass },
    { name: 'Resort Content', path: '/resort-content', icon: FileText },
    { name: 'Customer Inquiries', path: '/inquiries', icon: Mail, badge: '5' },
  ];

  const managementNav = [
    { name: 'Customers', path: '/customers', icon: Users },
    { name: 'Staff & Roles', path: '/staff-roles', icon: ShieldCheck },
    { name: 'Settings', path: '/settings', icon: Sun },
  ];

  return (
    <aside className="w-64 min-w-[16rem] bg-[#14333b] text-gray-300 flex flex-col justify-between border-r border-[#1e444e] shrink-0 h-screen sticky top-0">
      <div className="overflow-y-auto overflow-x-hidden flex-1 px-4 py-5 space-y-6">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="w-9 h-9 rounded-xl border border-teal-500/30 flex items-center justify-center bg-teal-900/30 text-teal-300 shadow-inner">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <polygon points="12 2 2 12 12 22 22 12" />
              <line x1="8" y1="9" x2="16" y2="9" />
              <line x1="12" y1="9" x2="12" y2="15" />
            </svg>
          </div>
          <div>
            <h1 className="font-serif tracking-widest text-white text-base font-bold uppercase leading-none">
              TENZAL
            </h1>
            <p className="text-[9px] tracking-wider text-teal-200/60 uppercase mt-0.5">
              LUXURY BOUTIQUE RESORT
            </p>
          </div>
        </div>

        {/* MAIN GROUP */}
        <div>
          <span className="text-[10px] tracking-widest uppercase text-gray-400 font-semibold px-2 mb-2 block">
            MAIN
          </span>
          <nav className="space-y-1">
            {mainNav.map((item) => {
              const isActive = item.activeMatch
                ? item.activeMatch(location.pathname)
                : location.pathname === item.path;
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#275965] text-white shadow-xs'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-teal-200' : 'text-gray-400'}`} />
                  <span className="flex-1">{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* CONTENT GROUP */}
        <div>
          <span className="text-[10px] tracking-widest uppercase text-gray-400 font-semibold px-2 mb-2 block">
            CONTENT
          </span>
          <nav className="space-y-1">
            {contentNav.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#275965] text-white shadow-xs'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-teal-200' : 'text-gray-400'}`} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="w-5 h-5 flex items-center justify-center rounded-full text-xs font-semibold bg-rose-500/90 text-white">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* MANAGEMENT GROUP */}
        <div>
          <span className="text-[10px] tracking-widest uppercase text-gray-400 font-semibold px-2 mb-2 block">
            MANAGEMENT
          </span>
          <nav className="space-y-1">
            {managementNav.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#275965] text-white shadow-xs'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-teal-200' : 'text-gray-400'}`} />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Admin User Footer */}
      <div className="p-3 border-t border-[#1e444e] flex items-center justify-between bg-[#112a31]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-full bg-[#d8b5a0] text-[#4a2e1d] font-semibold flex items-center justify-center text-xs shrink-0 shadow-xs">
            NP
          </div>
          <div className="truncate">
            <p className="text-xs font-semibold text-white truncate">Nadeesha</p>
            <p className="text-[10px] text-teal-200/70 truncate">Administrator</p>
          </div>
        </div>
        <button
          type="button"
          className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
