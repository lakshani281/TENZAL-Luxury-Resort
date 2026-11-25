import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import StatusBadge from '../components/common/StatusBadge';
import api from '../api/client';
import {
  BedDouble,
  CalendarDays,
  CheckCircle2,
  Clock,
  RefreshCw,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

export default function OverviewPage() {
  const [roomStats, setRoomStats] = useState(null);
  const [bookingStats, setBookingStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadOverview = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [roomsRes, bookingsStatsRes, bookingsListRes] = await Promise.all([
        api.get('/rooms/stats/overview'),
        api.get('/bookings/stats/overview'),
        api.get('/bookings', { params: { limit: 5, page: 1 } }),
      ]);
      setRoomStats(roomsRes.data?.data || null);
      setBookingStats(bookingsStatsRes.data?.data || null);
      setRecentBookings(
        Array.isArray(bookingsListRes.data?.bookings)
          ? bookingsListRes.data.bookings
          : Array.isArray(bookingsListRes.data?.data)
          ? bookingsListRes.data.data
          : []
      );
    } catch (err) {
      setError(err.message || 'Unable to load dashboard overview.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const statCards = [
    {
      label: 'Total Rooms',
      value: roomStats?.total ?? '—',
      sub: `${roomStats?.active ?? 0} active`,
      icon: BedDouble,
      accent: 'bg-[#245d6a]/10 text-[#245d6a]',
    },
    {
      label: 'Total Bookings',
      value: bookingStats?.total ?? '—',
      sub: 'All reservations',
      icon: CalendarDays,
      accent: 'bg-sky-50 text-sky-700',
    },
    {
      label: 'Confirmed',
      value: bookingStats?.confirmed ?? '—',
      sub: 'Ready for arrival',
      icon: CheckCircle2,
      accent: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: 'Pending',
      value: bookingStats?.pending ?? '—',
      sub: 'Awaiting review',
      icon: Clock,
      accent: 'bg-amber-50 text-amber-700',
    },
  ];

  return (
    <div className="space-y-6">
      <Header
        title="Resort Overview"
        subtitle="Live operational summary across rooms and reservations"
      />

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-sm">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={loadOverview}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-xs font-semibold text-rose-700 hover:bg-rose-100 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-sm flex items-start justify-between"
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {card.label}
                </p>
                <p className="font-serif text-3xl font-bold text-gray-900 mt-2">
                  {isLoading ? '...' : card.value}
                </p>
                <p className="text-xs text-gray-500 mt-1">{card.sub}</p>
              </div>
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${card.accent}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-serif text-xl font-bold text-gray-900">Recent Bookings</h3>
            <p className="text-xs text-gray-500 mt-0.5">Latest reservations recorded in the system</p>
          </div>
          <Link
            to="/bookings"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#245d6a] hover:underline"
          >
            View all bookings
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-500">Loading recent bookings...</div>
        ) : recentBookings.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">No bookings available.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/80 text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-6 py-3 font-semibold">Reference</th>
                  <th className="px-6 py-3 font-semibold">Guest</th>
                  <th className="px-6 py-3 font-semibold">Room</th>
                  <th className="px-6 py-3 font-semibold">Dates</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-3.5 font-semibold text-gray-900">{b.reference}</td>
                    <td className="px-6 py-3.5 text-gray-700">{b.guest_name}</td>
                    <td className="px-6 py-3.5 text-gray-600">
                      {b.room_number ? `Room ${b.room_number}` : `Room #${b.room_id}`}
                    </td>
                    <td className="px-6 py-3.5 text-gray-600 text-xs">
                      {b.check_in} → {b.check_out}
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={b.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
