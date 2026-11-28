import React from 'react';

const STATUS_CONFIG = {
  'pending': {
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200/80',
    dotClass: 'bg-amber-500 animate-pulse',
    label: 'Pending',
  },
  'in kitchen': {
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200/80',
    dotClass: 'bg-blue-500 animate-pulse',
    label: 'In Kitchen',
  },
  'out for delivery': {
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-200/80',
    dotClass: 'bg-purple-500 animate-pulse',
    label: 'Out for Delivery',
  },
  'delivered': {
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
    dotClass: 'bg-emerald-500',
    label: 'Delivered',
  },
  'cancelled': {
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200/80',
    dotClass: 'bg-rose-500',
    label: 'Cancelled',
  },
};

export default function OrderStatusBadge({ status, className = '' }) {
  if (!status || typeof status !== 'string') return null;

  const key = status.trim().toLowerCase();
  const config = STATUS_CONFIG[key] || {
    badgeClass: 'bg-gray-100 text-gray-700 border-gray-200',
    dotClass: 'bg-gray-400',
    label: status,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-2xs transition-colors ${config.badgeClass} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
      <span>{config.label}</span>
    </span>
  );
}
