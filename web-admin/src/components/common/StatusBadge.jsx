
export default function StatusBadge({ status }) {
  if (typeof status !== 'string' || !status.trim()) return null;

  const normalized = status.trim().toLowerCase();

  const statusStyles = {
    active: ['bg-emerald-50 text-emerald-800 border-emerald-200/80', 'bg-emerald-500', 'Active'],
    available: ['bg-emerald-50 text-emerald-800 border-emerald-200/80', 'bg-emerald-500', 'Available'],
    confirmed: ['bg-emerald-50 text-emerald-800 border-emerald-200/80', 'bg-emerald-500', 'Confirmed'],
    published: ['bg-emerald-50 text-emerald-800 border-emerald-200/80', 'bg-emerald-500', 'Published'],
    pending: ['bg-amber-50 text-amber-800 border-amber-200/80', 'bg-amber-500', 'Pending'],
    reserved: ['bg-sky-50 text-sky-800 border-sky-200/80', 'bg-sky-500', 'Reserved'],
    completed: ['bg-slate-100 text-slate-700 border-slate-200', 'bg-slate-400', 'Completed'],
    cancelled: ['bg-rose-50 text-rose-700 border-rose-200', 'bg-rose-500', 'Cancelled'],
    inactive: ['bg-rose-50 text-rose-700 border-rose-200', 'bg-rose-500', 'Inactive'],
    'sold out': ['bg-rose-50 text-rose-700 border-rose-200', 'bg-rose-500', 'Sold Out'],
    maintenance: ['bg-orange-50 text-orange-800 border-orange-200', 'bg-orange-500', 'Maintenance'],
  };

  const [styles, dotColor, label] = statusStyles[normalized] || [
    'bg-gray-100 text-gray-700 border-gray-200',
    'bg-gray-400',
    normalized.charAt(0).toUpperCase() + normalized.slice(1),
  ];

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border shadow-xs transition-colors ${styles}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span>{label}</span>
    </span>
  );
}
