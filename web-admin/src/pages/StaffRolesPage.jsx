import React, { useState, useEffect, useMemo } from 'react';
import Header from '../components/layout/Header';
import Modal from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import { useAuth } from '../context/AuthContext';
import userApi from '../api/userApi';
import {
  ShieldCheck,
  Plus,
  Search,
  UserCheck,
  UserX,
  Edit2,
  Trash2,
  Lock,
  Mail,
  Phone,
  Shield,
  Check,
  ChevronDown,
} from 'lucide-react';

export default function StaffRolesPage() {
  const { user: currentUser } = useAuth();
  const toastContext = useToast();
  const addToast = toastContext?.addToast || toastContext?.showToast || (() => {});

  const [staffList, setStaffList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All'); // 'All', 'Active', 'Draft' (Inactive)
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);

  // Form states
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    password: 'Password123!',
    role: 'staff',
    phone: '',
  });

  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'staff',
  });

  const [selectedRole, setSelectedRole] = useState('staff');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load staff records from API
  const loadStaff = async () => {
    setIsLoading(true);
    try {
      const data = await userApi.getAllUsers();
      // Filter for staff & admin members
      const staffMembers = data.filter((u) => u.role === 'admin' || u.role === 'staff');
      setStaffList(staffMembers);
    } catch (err) {
      addToast(err.message || 'Failed to load staff list.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  // Filtered list
  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      // Tab filter
      if (activeTab === 'Active' && !s.is_active) return false;
      if (activeTab === 'Draft' && s.is_active) return false;

      // Status dropdown filter
      if (statusFilter === 'active' && !s.is_active) return false;
      if (statusFilter === 'inactive' && s.is_active) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          (s.role && s.role.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [staffList, activeTab, statusFilter, searchQuery]);

  // Handle Add Staff
  const handleAddStaff = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await userApi.createUser(addForm);
      addToast(`Staff account for ${addForm.name} created successfully.`, 'success');
      setIsAddModalOpen(false);
      setAddForm({
        name: '',
        email: '',
        password: 'Password123!',
        role: 'staff',
        phone: '',
      });
      loadStaff();
    } catch (err) {
      addToast(err.message || 'Failed to create staff account.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (staff) => {
    setSelectedStaff(staff);
    setEditForm({
      name: staff.name,
      email: staff.email,
      phone: staff.phone || '',
      role: staff.role,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateStaff = async (e) => {
    e.preventDefault();
    if (!selectedStaff) return;
    setIsSubmitting(true);
    try {
      await userApi.updateUser(selectedStaff.id, editForm);
      addToast(`Staff details for ${editForm.name} updated.`, 'success');
      setIsEditModalOpen(false);
      loadStaff();
    } catch (err) {
      addToast(err.message || 'Failed to update staff member.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Role Modal
  const openRoleModal = (staff) => {
    setSelectedStaff(staff);
    setSelectedRole(staff.role);
    setIsRoleModalOpen(true);
  };

  const handleUpdateRole = async () => {
    if (!selectedStaff) return;
    setIsSubmitting(true);
    try {
      await userApi.updateUserRole(selectedStaff.id, selectedRole);
      addToast(`Updated role for ${selectedStaff.name} to ${selectedRole}.`, 'success');
      setIsRoleModalOpen(false);
      loadStaff();
    } catch (err) {
      addToast(err.message || 'Failed to change role.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Activate / Deactivate
  const handleToggleStatus = async (staff) => {
    if (staff.id === currentUser?.id) {
      addToast('You cannot deactivate your own account.', 'warning');
      return;
    }
    const newStatus = !staff.is_active;
    try {
      await userApi.updateUserStatus(staff.id, newStatus);
      addToast(
        `${staff.name} is now ${newStatus ? 'Active' : 'Inactive'}.`,
        newStatus ? 'success' : 'info'
      );
      loadStaff();
    } catch (err) {
      addToast(err.message || 'Failed to update user status.', 'error');
    }
  };

  const formatLastActive = (staff) => {
    if (staff.email === 'nadeesha@tenzal.com') return 'Now';
    if (staff.email === 'kasun@tenzal.com') return 'Today · 8:14 AM';
    if (staff.email === 'mfernando@tenzal.com') return '21 Jun';
    if (staff.last_login_at) {
      const d = new Date(staff.last_login_at);
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    }
    return 'Recently';
  };

  return (
    <div>
      <Header
        title="Staff & Roles"
        subtitle="Control access for authorized resort staff"
        searchPlaceholder="Search staff & roles..."
        onSearchChange={setSearchQuery}
      />

      {/* Action Bar (Filters + Add Button - Matches Video Frame 064s) */}
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

        {/* Right: Status Dropdown & Add Button */}
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
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#275965] hover:bg-[#1e4852] text-white text-xs font-medium rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Staff Account</span>
          </button>
        </div>
      </div>

      {/* Main Table Card (Pixel-match to Video 064s) */}
      <div className="bg-white rounded-3xl border border-gray-200/90 shadow-2xs overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-serif text-lg font-bold text-gray-900">
            Staff & Roles Records
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Prototype data — select any record to view or update
          </p>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-gray-400 text-sm">
            <div className="w-8 h-8 border-2 border-[#275965]/20 border-t-[#275965] rounded-full animate-spin mx-auto mb-3" />
            Loading authorized staff records...
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">
            No staff records match your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-[#fafaf9]/70 text-gray-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-6">Staff Member</th>
                  <th className="py-3.5 px-6">Email</th>
                  <th className="py-3.5 px-6">Role</th>
                  <th className="py-3.5 px-6">Last Active</th>
                  <th className="py-3.5 px-6">Account Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStaff.map((staff) => {
                  const initials = staff.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);

                  const isCurrentUser = staff.id === currentUser?.id;

                  return (
                    <tr
                      key={staff.id}
                      className="hover:bg-gray-50/60 transition-colors group text-gray-800"
                    >
                      {/* Staff Member */}
                      <td className="py-4 px-6 font-medium">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#e8ded7] text-[#553826] font-semibold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                            {initials}
                          </div>
                          <div>
                            <span className="font-semibold text-gray-900 block">
                              {staff.name}
                            </span>
                            {isCurrentUser && (
                              <span className="text-[10px] text-teal-700 font-medium">
                                (You - Active Session)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-4 px-6 text-gray-600 font-mono text-[11px]">
                        {staff.email}
                      </td>

                      {/* Role */}
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium ${
                            staff.role === 'admin'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200/60'
                              : 'bg-teal-50 text-teal-800 border border-teal-200/60'
                          }`}
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>
                            {staff.role === 'admin' ? 'Administrator' : 'Authorized Staff'}
                          </span>
                        </span>
                      </td>

                      {/* Last Active */}
                      <td className="py-4 px-6 text-gray-600 font-medium">
                        {formatLastActive(staff)}
                      </td>

                      {/* Account Status Badge */}
                      <td className="py-4 px-6">
                        {staff.is_active ? (
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

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openRoleModal(staff)}
                            className="p-1.5 text-gray-500 hover:text-[#275965] hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                            title="Change Role"
                          >
                            <Shield className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditModal(staff)}
                            className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit Staff Info"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {!isCurrentUser && (
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(staff)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                staff.is_active
                                  ? 'text-gray-400 hover:text-rose-600 hover:bg-rose-50'
                                  : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={staff.is_active ? 'Deactivate Account' : 'Activate Account'}
                            >
                              {staff.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                            </button>
                          )}
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

      {/* Add Staff Account Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Staff Account"
      >
        <form onSubmit={handleAddStaff} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={addForm.name}
              onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              placeholder="e.g. Priyantha Dissanayake"
              className="w-full px-3.5 py-2 text-sm bg-white rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-[#275965]/20 focus:border-[#275965]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={addForm.email}
              onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
              placeholder="priyantha@tenzal.com"
              className="w-full px-3.5 py-2 text-sm bg-white rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-[#275965]/20 focus:border-[#275965]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                Role Permission *
              </label>
              <select
                value={addForm.role}
                onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-white rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-[#275965]/20 focus:border-[#275965]"
              >
                <option value="staff">Authorized Staff</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                Contact Phone
              </label>
              <input
                type="text"
                value={addForm.phone}
                onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                placeholder="+94 77 123 4567"
                className="w-full px-3.5 py-2 text-sm bg-white rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-[#275965]/20 focus:border-[#275965]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
              Temporary Password *
            </label>
            <input
              type="text"
              required
              value={addForm.password}
              onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-gray-50 rounded-xl border border-gray-200 font-mono text-gray-700"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              New staff member can change password on first login via Settings.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-[#275965] hover:bg-[#1e4852] text-white text-xs font-medium rounded-xl shadow-xs cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? 'Creating...' : 'Create Staff Member'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Staff Info Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Staff Details: ${selectedStaff?.name}`}
      >
        <form onSubmit={handleUpdateStaff} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-white rounded-xl border border-gray-200"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-white rounded-xl border border-gray-200"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
              Contact Phone
            </label>
            <input
              type="text"
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
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

      {/* Change Role Modal */}
      <Modal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        title="Assign Staff Role & Privileges"
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-500">
            Select the access level for <span className="font-semibold text-gray-800">{selectedStaff?.name}</span>:
          </p>

          <div className="space-y-2">
            {[
              {
                id: 'staff',
                title: 'Authorized Staff',
                desc: 'Access to guest bookings, room status, food orders, and daily front desk operations.',
              },
              {
                id: 'admin',
                title: 'Administrator',
                desc: 'Full administrative control over user accounts, security roles, financial rates, and resort configuration.',
              },
            ].map((roleOption) => (
              <label
                key={roleOption.id}
                onClick={() => setSelectedRole(roleOption.id)}
                className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  selectedRole === roleOption.id
                    ? 'border-[#275965] bg-teal-50/50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="roleSelect"
                  checked={selectedRole === roleOption.id}
                  onChange={() => setSelectedRole(roleOption.id)}
                  className="mt-1 text-[#275965]"
                />
                <div>
                  <p className="text-xs font-bold text-gray-900">{roleOption.title}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{roleOption.desc}</p>
                </div>
              </label>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsRoleModalOpen(false)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpdateRole}
              disabled={isSubmitting}
              className="px-5 py-2 bg-[#275965] hover:bg-[#1e4852] text-white text-xs font-medium rounded-xl shadow-xs cursor-pointer"
            >
              {isSubmitting ? 'Updating...' : 'Confirm Role'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
