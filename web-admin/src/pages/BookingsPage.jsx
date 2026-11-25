import React, { useState, useEffect, useCallback } from 'react';
import Header from '../components/layout/Header';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import api from '../api/client';
import { Plus, RefreshCw, AlertCircle } from 'lucide-react';

const STATUS_TABS = ['all', 'pending', 'confirmed', 'completed', 'cancelled'];

const EMPTY_BOOKING = {
  room_id: '',
  guest_name: '',
  guest_email: '',
  guest_phone: '',
  guest_count: 1,
  check_in: '',
  check_out: '',
  notes: '',
};

export default function BookingsPage() {
  const toast = useToast();
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [formData, setFormData] = useState(EMPTY_BOOKING);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = { limit: 50 };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      const res = await api.get('/bookings', { params });
      setBookings(
        Array.isArray(res.data?.bookings)
          ? res.data.bookings
          : Array.isArray(res.data?.data)
          ? res.data.data
          : []
      );
    } catch (err) {
      setError(err.message || 'Failed to load bookings.');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchQuery]);

  const fetchRooms = useCallback(async () => {
    try {
      const res = await api.get('/rooms');
      setRooms(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch {
      // Room options optional if list fails
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleStatusChange = async (booking, nextStatus) => {
    try {
      await api.patch(`/bookings/${booking.id}/status`, { status: nextStatus });
      toast.success(`Booking ${booking.reference} marked as ${nextStatus}.`);
      fetchBookings();
    } catch (err) {
      toast.error(err.message || 'Failed to update booking status.');
    }
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/bookings', {
        ...formData,
        room_id: Number(formData.room_id),
        guest_count: Number(formData.guest_count) || 1,
      });
      toast.success('Booking created successfully.');
      setCreateOpen(false);
      setFormData(EMPTY_BOOKING);
      fetchBookings();
    } catch (err) {
      toast.error(err.message || 'Failed to create booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Header
        title="Bookings"
        subtitle="Manage guest room reservations and check-in statuses"
        searchPlaceholder="Search bookings..."
        onSearchChange={setSearchQuery}
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
                statusFilter === tab
                  ? 'bg-[#245d6a] text-white shadow-xs'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchBookings}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#245d6a] hover:bg-[#18424b] text-white text-xs font-semibold shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Booking
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Bookings Table */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-sm text-gray-500">Loading bookings...</div>
        ) : bookings.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-500">No bookings found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/80 text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">Reference</th>
                  <th className="px-6 py-3.5 font-semibold">Guest</th>
                  <th className="px-6 py-3.5 font-semibold">Room</th>
                  <th className="px-6 py-3.5 font-semibold">Stay Dates</th>
                  <th className="px-6 py-3.5 font-semibold">Total</th>
                  <th className="px-6 py-3.5 font-semibold">Status</th>
                  <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-semibold text-gray-900">{b.reference}</td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{b.guest_name}</p>
                      {b.guest_email && (
                        <p className="text-xs text-gray-500">{b.guest_email}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {b.room_number ? `Room ${b.room_number}` : `Room #${b.room_id}`}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-600">
                      {b.check_in} → {b.check_out}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      ${Number(b.total_amount || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {b.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(b, 'confirmed')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold cursor-pointer"
                        >
                          Confirm
                        </button>
                      )}
                      {b.status === 'confirmed' && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(b, 'completed')}
                          className="px-3 py-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 text-xs font-semibold cursor-pointer"
                        >
                          Complete
                        </button>
                      )}
                      {b.status !== 'cancelled' && b.status !== 'completed' && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(b, 'cancelled')}
                          className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Booking Modal */}
      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New Room Booking"
      >
        <form onSubmit={handleCreateBooking} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Room</label>
            <select
              required
              value={formData.room_id}
              onChange={(e) => setFormData((p) => ({ ...p, room_id: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white"
            >
              <option value="">Select a room...</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  Room {r.room_number} — {r.name} (${r.price_per_night}/night)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Guest Name</label>
              <input
                type="text"
                required
                value={formData.guest_name}
                onChange={(e) => setFormData((p) => ({ ...p, guest_name: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Guest Email</label>
              <input
                type="email"
                value={formData.guest_email}
                onChange={(e) => setFormData((p) => ({ ...p, guest_email: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Check-in</label>
              <input
                type="date"
                required
                value={formData.check_in}
                onChange={(e) => setFormData((p) => ({ ...p, check_in: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Check-out</label>
              <input
                type="date"
                required
                value={formData.check_out}
                onChange={(e) => setFormData((p) => ({ ...p, check_out: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Guests</label>
              <input
                type="number"
                min="1"
                required
                value={formData.guest_count}
                onChange={(e) => setFormData((p) => ({ ...p, guest_count: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-[#245d6a] text-white text-xs font-semibold disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? 'Creating...' : 'Create Booking'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
