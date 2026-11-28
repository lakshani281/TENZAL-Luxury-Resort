
import React from 'react';
import {
  Eye,
  Check,
  X,
  CheckCheck,
  CalendarDays,
  Users,
  Search,
  ClipboardList,
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export default function BookingTable({
  bookings = [],
  activeTab = 'all',
  onTabChange,
  onViewDetails,
  onStatusChange,
  loading = false,
}) {
  const tabs = [
    { id: 'all', label: 'All Bookings' },
    { id: 'pending', label: 'Pending' },
    { id: 'confirmed', label: 'Confirmed' },
    { id: 'cancelled', label: 'Cancelled' },
    { id: 'completed', label: 'Completed' },
  ];

  const getCount = (status) => {
    if (status === 'all') return bookings.length;
    return bookings.filter(
      (booking) => booking.status?.toLowerCase() === status
    ).length;
  };

  const formatDateRange = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return '—';

    const formatDate = (date) => {
      const parsed = new Date(date);

      if (Number.isNaN(parsed.getTime())) return date;

      return parsed.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    };

    return `${formatDate(checkIn)} – ${formatDate(checkOut)}`;
  };

  const formatAmount = (amount) => {
    const value = Number(amount);

    if (!Number.isFinite(value)) return '$0';

    return `$${new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0,
    }).format(value)}`;
  };

  const renderLoadingRows = () =>
    Array.from({ length: 5 }).map((_, index) => (
      <tr key={index}>
        {Array.from({ length: 9 }).map((__, cellIndex) => (
          <td key={cellIndex} className="px-6 py-5">
            <div className="h-4 w-20 bg-gray-100 rounded-md animate-pulse" />
          </td>
        ))}
      </tr>
    ));

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">

      {/* Booking Tabs */}
      <div className="p-4 sm:p-5 border-b border-gray-100">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const count = getCount(tab.id);

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange?.(tab.id)}
                aria-pressed={isActive}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-[#e7eff1] text-[#1b4e5a] shadow-sm'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                {tab.label}

                <span
                  className={`min-w-5 h-5 px-1 rounded-md flex items-center justify-center text-[10px] ${
                    isActive
                      ? 'bg-[#245d6a] text-white'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Table Header */}
      <div className="px-6 py-5 bg-gray-50/60 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold text-gray-800 tracking-tight">
            Booking Management
          </h4>
          <p className="text-xs text-gray-400 mt-1">
            Manage guest reservations and booking information
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500 bg-white border border-gray-200 rounded-xl px-3 py-2">
          <ClipboardList className="w-4 h-4 text-[#245d6a]" />
          {bookings.length} Records
        </div>
      </div>

      {/* Booking Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[1050px]">

          <thead>
            <tr className="border-b border-gray-100 bg-white text-gray-400 font-semibold uppercase tracking-wider text-[10px]">
              <th className="py-4 px-6">Reference</th>
              <th className="py-4 px-6">Guest Information</th>
              <th className="py-4 px-6">Room</th>
              <th className="py-4 px-6">Stay Period</th>
              <th className="py-4 px-6">Guests</th>
              <th className="py-4 px-6">Amount</th>
              <th className="py-4 px-6">Status</th>
              <th className="py-4 px-6 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 text-gray-700">

            {loading ? (
              renderLoadingRows()
            ) : bookings.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 px-6 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
                      <Search className="w-6 h-6 text-gray-300" />
                    </div>

                    <h5 className="text-sm font-semibold text-gray-700">
                      No bookings found
                    </h5>

                    <p className="text-xs text-gray-400 mt-1">
                      There are no reservations available in this category.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              bookings.map((booking) => (
                <tr
                  key={booking.id}
                  className="hover:bg-[#f8fafb] transition-colors duration-200 group"
                >
                  {/* Reference */}
                  <td className="py-4 px-6 whitespace-nowrap">
                    <span className="font-bold text-[#245d6a]">
                      {booking.reference || `#${booking.id}`}
                    </span>
                  </td>

                  {/* Guest */}
                  <td className="py-4 px-6">
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-gray-900 whitespace-nowrap">
                        {booking.guest_name || 'Unknown Guest'}
                      </span>

                      <span className="text-[11px] text-gray-400 whitespace-nowrap">
                        {booking.guest_email || booking.guest_phone || 'No contact details'}
                      </span>
                    </div>
                  </td>

                  {/* Room */}
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-gray-800">
                        {booking.room_number
                          ? `Room ${booking.room_number}`
                          : '—'}
                      </span>

                      {booking.room_name && (
                        <span className="text-[10px] text-gray-400">
                          {booking.room_name}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Dates */}
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-gray-600">
                        {formatDateRange(booking.check_in, booking.check_out)}
                      </span>
                    </div>
                  </td>

                  {/* Guests */}
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users className="w-3.5 h-3.5 text-gray-400" />
                      {booking.guest_count || 1}
                    </div>
                  </td>

                  {/* Amount */}
                  <td className="py-4 px-6 whitespace-nowrap">
                    <span className="font-bold text-gray-900">
                      {formatAmount(booking.total_amount)}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-4 px-6 whitespace-nowrap">
                    <StatusBadge status={booking.status} />
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-end gap-1.5">

                      {booking.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => onStatusChange?.(booking.id, 'confirmed')}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer"
                          title="Confirm reservation"
                          aria-label="Confirm reservation"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}

                      {booking.status === 'confirmed' && (
                        <button
                          type="button"
                          onClick={() => onStatusChange?.(booking.id, 'completed')}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                          title="Mark as completed"
                          aria-label="Mark booking as completed"
                        >
                          <CheckCheck className="w-4 h-4" />
                        </button>
                      )}

                      {booking.status !== 'cancelled' &&
                        booking.status !== 'completed' && (
                          <button
                            type="button"
                            onClick={() => onStatusChange?.(booking.id, 'cancelled')}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                            title="Cancel reservation"
                            aria-label="Cancel reservation"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}

                      <button
                        type="button"
                        onClick={() => onViewDetails?.(booking)}
                        className="p-2 text-gray-400 hover:text-[#245d6a] hover:bg-[#e7eff1] rounded-lg transition-all cursor-pointer"
                        title="View booking details"
                        aria-label="View booking details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                    </div>
                  </td>
                </tr>
              ))
            )}

          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      {!loading && bookings.length > 0 && (
        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
          <p className="text-[11px] text-gray-400">
            Showing <span className="font-semibold text-gray-700">{bookings.length}</span> booking records
          </p>

          <span className="text-[10px] font-medium text-[#245d6a] uppercase tracking-wider">
            TENZAL Resort Management
          </span>
        </div>
      )}
    </div>
  );
}
