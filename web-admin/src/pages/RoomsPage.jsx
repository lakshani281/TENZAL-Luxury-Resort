import React, { useState, useEffect, useCallback } from 'react';
import Header from '../components/layout/Header';
import RoomCard from '../components/rooms/RoomCard';
import Modal from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import api from '../api/client';
import { Plus, RefreshCw, AlertCircle } from 'lucide-react';

const STATUS_TABS = ['all', 'active', 'maintenance', 'inactive'];

const EMPTY_FORM = {
  room_number: '',
  name: '',
  type: 'Deluxe',
  price_per_night: '',
  capacity: 2,
  size_sqm: '',
  amenities: '',
  description: '',
  image_url: '',
  status: 'active',
};

export default function RoomsPage() {
  const toast = useToast();
  const [rooms, setRooms] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add / Edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Availability modal
  const [availRoom, setAvailRoom] = useState(null);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [availResult, setAvailResult] = useState(null);
  const [isCheckingAvail, setIsCheckingAvail] = useState(false);

  const fetchRooms = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      const res = await api.get('/rooms', { params });
      setRooms(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      setError(err.message || 'Failed to load rooms.');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const openCreateModal = () => {
    setEditingRoom(null);
    setFormData(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEditModal = (room) => {
    setEditingRoom(room);
    setFormData({
      room_number: room.room_number || '',
      name: room.name || '',
      type: room.type || 'Deluxe',
      price_per_night: room.price_per_night || '',
      capacity: room.capacity || 2,
      size_sqm: room.size_sqm || '',
      amenities: Array.isArray(room.amenities) ? room.amenities.join(', ') : room.amenities || '',
      description: room.description || '',
      image_url: room.image_url || '',
      status: room.status || 'active',
    });
    setModalOpen(true);
  };

  const handleSaveRoom = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        price_per_night: Number(formData.price_per_night),
        capacity: Number(formData.capacity),
        size_sqm: formData.size_sqm ? Number(formData.size_sqm) : null,
        amenities: formData.amenities
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      };

      if (editingRoom) {
        await api.put(`/rooms/${editingRoom.id}`, payload);
        toast.success(`Room ${payload.room_number} updated.`);
      } else {
        await api.post('/rooms', payload);
        toast.success(`Room ${payload.room_number} created.`);
      }
      setModalOpen(false);
      fetchRooms();
    } catch (err) {
      toast.error(err.message || 'Failed to save room.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAvailabilityModal = (room) => {
    setAvailRoom(room);
    setCheckIn('');
    setCheckOut('');
    setAvailResult(null);
  };

  const handleCheckAvailability = async (e) => {
    e.preventDefault();
    if (!availRoom || !checkIn || !checkOut) return;
    setIsCheckingAvail(true);
    setAvailResult(null);
    try {
      const res = await api.get(`/rooms/${availRoom.id}/availability`, {
        params: { checkIn, checkOut },
      });
      setAvailResult(res.data?.data || res.data);
    } catch (err) {
      toast.error(err.message || 'Availability check failed.');
    } finally {
      setIsCheckingAvail(false);
    }
  };

  return (
    <div className="space-y-6">
      <Header
        title="Rooms"
        subtitle="Manage resort rooms, rates, amenities, and availability"
        searchPlaceholder="Search rooms..."
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
            onClick={fetchRooms}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#245d6a] hover:bg-[#18424b] text-white text-xs font-semibold shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Room
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Room Grid */}
      {isLoading ? (
        <div className="bg-white rounded-3xl border border-gray-200/80 p-12 text-center text-sm text-gray-500">
          Loading rooms...
        </div>
      ) : rooms.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-200/80 p-12 text-center text-sm text-gray-500">
          No rooms found matching your filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onEdit={openEditModal}
              onCheckAvailability={openAvailabilityModal}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingRoom ? `Edit Room ${editingRoom.room_number}` : 'Add New Room'}
      >
        <form onSubmit={handleSaveRoom} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Room Number</label>
              <input
                type="text"
                required
                value={formData.room_number}
                onChange={(e) => setFormData((p) => ({ ...p, room_number: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Type</label>
              <input
                type="text"
                required
                value={formData.type}
                onChange={(e) => setFormData((p) => ({ ...p, type: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Room Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Price / Night</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.price_per_night}
                onChange={(e) => setFormData((p) => ({ ...p, price_per_night: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Capacity</label>
              <input
                type="number"
                min="1"
                required
                value={formData.capacity}
                onChange={(e) => setFormData((p) => ({ ...p, capacity: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white"
              >
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Amenities (comma separated)
            </label>
            <input
              type="text"
              value={formData.amenities}
              onChange={(e) => setFormData((p) => ({ ...p, amenities: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-[#245d6a] text-white text-xs font-semibold disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? 'Saving...' : 'Save Room'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Availability Modal */}
      <Modal
        isOpen={Boolean(availRoom)}
        onClose={() => setAvailRoom(null)}
        title={availRoom ? `Availability — Room ${availRoom.room_number}` : 'Availability'}
      >
        <form onSubmit={handleCheckAvailability} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Check-in</label>
              <input
                type="date"
                required
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Check-out</label>
              <input
                type="date"
                required
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
              />
            </div>
          </div>

          {availResult && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-medium border ${
                availResult.available
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              {availResult.available
                ? 'Room is available for the selected dates.'
                : 'Room is unavailable due to an overlapping reservation.'}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAvailRoom(null)}
              className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 cursor-pointer"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={isCheckingAvail}
              className="px-5 py-2 rounded-xl bg-[#245d6a] text-white text-xs font-semibold disabled:opacity-60 cursor-pointer"
            >
              {isCheckingAvail ? 'Checking...' : 'Check Dates'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
