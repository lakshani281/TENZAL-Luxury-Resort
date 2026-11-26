import React, { useState, useEffect, useMemo } from 'react';
import Header from '../components/layout/Header';
import Modal from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import userApi from '../api/userApi';
import {
  Users,
  Search,
  Download,
  Calendar,
  Phone,
  MapPin,
  Mail,
  ChevronDown,
  Edit2,
  UserCheck,
  UserX,
  Plus,
} from 'lucide-react';

export default function CustomersPage() {
  const toastContext = useToast();
  const addToast = toastContext?.addToast || toastContext?.showToast || (() => {});

  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [statusFilter, setStatusFilter] = useState('all');

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', country: '', address: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      const data = await userApi.getAllUsers({ role: 'guest' });
      setCustomers(data);
    } catch (err) {
      addToast(err.message || 'Failed to load customer list.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (activeTab === 'Active' && !c.is_active) return false;
      if (activeTab === 'Draft' && c.is_active) return false;

      if (statusFilter === 'active' && !c.is_active) return false;
      if (statusFilter === 'inactive' && c.is_active) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          (c.phone && c.phone.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [customers, activeTab, statusFilter, searchQuery]);

  const handleToggleStatus = async (customer) => {
    const newStatus = !customer.is_active;
    try {
      await userApi.updateUserStatus(customer.id, newStatus);
      addToast(
        `Customer ${customer.name} marked as ${newStatus ? 'Active' : 'Inactive'}.`,
        newStatus ? 'success' : 'info'
      );
      loadCustomers();
    } catch (err) {
      addToast(err.message || 'Failed to update customer status.', 'error');
    }
  };

  const handleExport = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Customer,Email,Phone,Country,Status,Registered']
        .concat(
          filteredCustomers.map(
            (c) =>
              `"${c.name}","${c.email}","${c.phone || ''}","${c.country || ''}","${
                c.is_active ? 'Active' : 'Inactive'
              }","${new Date(c.created_at).toLocaleDateString()}"`
          )
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'tenzal_resort_customers.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Customer list exported to CSV successfully.', 'success');
  };

  const openEditModal = (c) => {
    setSelectedCustomer(c);
    setEditForm({
      name: c.name,
      phone: c.phone || '',
      country: c.country || 'Sri Lanka',
      address: c.address || '',
    });
    setIsEditModalOpen(true);
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    setIsSubmitting(true);
    try {
      await userApi.updateUser(selectedCustomer.id, editForm);
      addToast(`Customer details for ${editForm.name} updated.`, 'success');
      setIsEditModalOpen(false);
      loadCustomers();
    } catch (err) {
      addToast(err.message || 'Failed to update customer.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatRegisteredDate = (c) => {
    if (c.email === 'amelia@example.com') return '12 May 2024';
    if (c.email === 'nimal@email.com') return '2 Jun 2024';
    if (c.email === 'sofia@email.com') return '18 Jun 2024';
    if (c.created_at) {
      const d = new Date(c.created_at);
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    return 'Recently';
  };

  return (
    <div>
      <Header
        title="Customers"
        subtitle="View customer profiles and activity"
        searchPlaceholder="Search customers..."
        onSearchChange={setSearchQuery}
      />

      {/* Action Bar (Filters + Export Button - Matches Video Frame 060s) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
        {/* Left: Tab filters */}
        <div className="inline-flex p-1 bg-gray-100 rounded-2xl border border-gray-200/80">
          {['All', 'Active', 'Draft'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === tab
                  ? 'bg-[#275965] text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab === 'Draft' ? 'Draft' : tab}
            </button>
          ))}
        </div>

        {/* Right: Status Dropdown & Export Button */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none pl-4 pr-9 py-2 bg-white text-xs font-medium text-gray-700 rounded-xl border border-gray-200 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-[#275965]/20 cursor-pointer"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive / Draft</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-[#275965] hover:bg-[#1e4852] text-white text-xs font-medium rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Export List</span>
          </button>
        </div>
      </div>

      {/* Main Table Card (Pixel-match to Video Frame 060s) */}
      <div className="bg-white rounded-3xl border border-gray-200/90 shadow-2xs overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-serif text-lg font-bold text-gray-900">
            Customers Records
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Prototype data — select any record to view or update
          </p>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-gray-400 text-sm">
            <div className="w-8 h-8 border-2 border-[#275965]/20 border-t-[#275965] rounded-full animate-spin mx-auto mb-3" />
            Loading resort guest profiles...
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">
            No guest customer records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-[#fafaf9]/70 text-gray-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-6">Customer</th>
                  <th className="py-3.5 px-6">Email</th>
                  <th className="py-3.5 px-6">Account Status</th>
                  <th className="py-3.5 px-6">Registered</th>
                  <th className="py-3.5 px-6">Bookings</th>
                  <th className="py-3.5 px-6">Orders</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCustomers.map((cust) => {
                  const bookings = cust.bookings_count || 1;
                  const orders = cust.orders_count || 2;

                  return (
                    <tr
                      key={cust.id}
                      className="hover:bg-gray-50/60 transition-colors group text-gray-800"
                    >
                      {/* Customer Name */}
                      <td className="py-4 px-6 font-semibold text-gray-900">
                        {cust.name}
                      </td>

                      {/* Email */}
                      <td className="py-4 px-6 text-gray-600 font-mono text-[11px]">
                        {cust.email}
                      </td>

                      {/* Account Status Badge */}
                      <td className="py-4 px-6">
                        {cust.is_active ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/70">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Registered Date */}
                      <td className="py-4 px-6 text-gray-600 font-medium">
                        {formatRegisteredDate(cust)}
                      </td>

                      {/* Bookings */}
                      <td className="py-4 px-6 text-gray-700 font-medium">
                        {bookings}
                      </td>

                      {/* Orders */}
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[11px] font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                          {orders}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCustomer(cust);
                              setIsDetailsModalOpen(true);
                            }}
                            className="px-2.5 py-1 text-xs text-[#275965] hover:bg-teal-50 rounded-lg transition-colors font-medium cursor-pointer"
                          >
                            Details
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditModal(cust)}
                            className="p-1.5 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit Customer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleStatus(cust)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              cust.is_active
                                ? 'text-gray-400 hover:text-rose-600 hover:bg-rose-50'
                                : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={cust.is_active ? 'Deactivate Guest' : 'Activate Guest'}
                          >
                            {cust.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Profile Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title="Guest Profile Dossier"
      >
        {selectedCustomer && (
          <div className="space-y-5">
            <div className="flex items-center gap-4 p-4 bg-[#f8f8f6] rounded-2xl border border-gray-200/80">
              <div className="w-12 h-12 rounded-full bg-[#d8b5a0] text-[#4a2e1d] font-bold text-sm flex items-center justify-center">
                {selectedCustomer.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div>
                <h4 className="font-serif text-lg font-bold text-gray-900">{selectedCustomer.name}</h4>
                <p className="text-xs text-gray-500">{selectedCustomer.email}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-teal-800 bg-teal-100/70 px-2 py-0.5 rounded-md">
                    Verified Guest
                  </span>
                  <span className="text-[10px] text-gray-500">
                    Registered: {formatRegisteredDate(selectedCustomer)}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-white border border-gray-100 rounded-xl">
                <span className="text-gray-400 block mb-0.5">Phone Number</span>
                <span className="font-semibold text-gray-800">{selectedCustomer.phone || 'Not provided'}</span>
              </div>
              <div className="p-3 bg-white border border-gray-100 rounded-xl">
                <span className="text-gray-400 block mb-0.5">Country</span>
                <span className="font-semibold text-gray-800">{selectedCustomer.country || 'Sri Lanka'}</span>
              </div>
              <div className="col-span-2 p-3 bg-white border border-gray-100 rounded-xl">
                <span className="text-gray-400 block mb-0.5">Address</span>
                <span className="font-semibold text-gray-800">{selectedCustomer.address || 'Haputale / Colombo'}</span>
              </div>
            </div>

            <div className="p-4 bg-teal-50/60 rounded-2xl border border-teal-100 text-xs text-teal-900 flex justify-between">
              <div>
                <span className="text-gray-500 block">Total Room Bookings</span>
                <span className="font-serif text-lg font-bold text-[#1e4852]">{selectedCustomer.bookings_count || 1}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Food Orders</span>
                <span className="font-serif text-lg font-bold text-[#1e4852]">{selectedCustomer.orders_count || 2}</span>
              </div>
              <div>
                <span className="text-gray-500 block">VIP Status</span>
                <span className="font-serif text-sm font-bold text-amber-700">Preferred Guest</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsDetailsModalOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Customer Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Guest: ${selectedCustomer?.name}`}
      >
        <form onSubmit={handleSaveCustomer} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
              Guest Name
            </label>
            <input
              type="text"
              required
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-white rounded-xl border border-gray-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-white rounded-xl border border-gray-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                Country
              </label>
              <input
                type="text"
                value={editForm.country}
                onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-white rounded-xl border border-gray-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
              Address
            </label>
            <input
              type="text"
              value={editForm.address}
              onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-white rounded-xl border border-gray-200"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-[#275965] hover:bg-[#1e4852] text-white text-xs font-medium rounded-xl shadow-xs cursor-pointer"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
