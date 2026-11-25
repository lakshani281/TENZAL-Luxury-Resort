import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Header from '../components/layout/Header';
import OrderStatusBadge from '../components/food/OrderStatusBadge';
import OrderCancellationModal from '../components/food/OrderCancellationModal';
import OrderHistoryModal from '../components/food/OrderHistoryModal';
import { useToast } from '../components/common/Toast';
import { foodOrderApi } from '../api/foodOrderApi';
import {
  ShoppingBag,
  Clock,
  ChefHat,
  Bike,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Search,
  Calendar,
  BedDouble,
  MessageSquare,
  History,
  Copy,
  Check,
  LayoutGrid,
  List,
  ShieldAlert,
} from 'lucide-react';

/**
 * Helper to inspect authenticated user info from localStorage and JWT.
 */
function getAuthSession() {
  const token = localStorage.getItem('tenzal_token');
  let user = null;

  try {
    const storedUser = localStorage.getItem('tenzal_user');
    if (storedUser) {
      user = JSON.parse(storedUser);
    } else if (token) {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        user = {
          id: payload.id,
          email: payload.email,
          role: payload.role,
        };
      }
    }
  } catch (err) {
    console.error('Failed to parse auth token payload:', err);
  }

  return {
    isAuthenticated: Boolean(token),
    token,
    user,
    role: (user?.role || '').toLowerCase(),
  };
}

/**
 * Format currency in LKR with thousands separators and 2 decimal places.
 */
function formatLKR(amount) {
  const num = Number(amount);
  if (!Number.isFinite(num)) return 'LKR 0.00';
  return `LKR ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format timestamp into legible resort date and time.
 */
function formatOrderDateTime(val) {
  if (!val) return 'N/A';
  try {
    const d = new Date(val);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(val);
  }
}

export default function FoodOrdersPage() {
  const toast = useToast();

  // Authentication & Role check
  const authSession = useMemo(() => getAuthSession(), []);
  const isAuthorizedRole = authSession.isAuthenticated && ['staff', 'admin'].includes(authSession.role);

  // Orders State
  const [orders, setOrders] = useState([]);
  const [allResortOrders, setAllResortOrders] = useState([]); // Master list for tab counters
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Filter States
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [roomFilter, setRoomFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // View Mode: Cards or Table
  const [viewMode, setViewMode] = useState('cards');

  // Modals & Action States
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [historyOrder, setHistoryOrder] = useState(null);
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);
  const [cancelModalError, setCancelModalError] = useState(null);
  const [actionInProgressId, setActionInProgressId] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);

  /**
   * Fetch orders from backend API
   */
  const fetchOrders = useCallback(
    async (isManualRefresh = false) => {
      if (!isAuthorizedRole) {
        setIsLoading(false);
        return;
      }

      if (isManualRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setApiError(null);

      try {
        // Query with high limit to retrieve all active resort orders
        const response = await foodOrderApi.getOrders({ limit: 100 });
        const ordersList = Array.isArray(response?.data) ? response.data : [];
        setOrders(ordersList);
        setAllResortOrders(ordersList);
      } catch (err) {
        console.error('Failed to load food orders:', err);
        setApiError(
          err.message || 'Unable to load food orders. Please check your network connection or try again.'
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [isAuthorizedRole]
  );

  // Initial load
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  /**
   * Computed Overview Counts (across all loaded resort orders)
   */
  const overviewCounts = useMemo(() => {
    const counts = {
      total: allResortOrders.length,
      pending: 0,
      inKitchen: 0,
      outForDelivery: 0,
      delivered: 0,
      cancelled: 0,
    };

    allResortOrders.forEach((o) => {
      const s = (o.status || '').toLowerCase();
      if (s === 'pending') counts.pending += 1;
      else if (s === 'in kitchen') counts.inKitchen += 1;
      else if (s === 'out for delivery') counts.outForDelivery += 1;
      else if (s === 'delivered') counts.delivered += 1;
      else if (s === 'cancelled') counts.cancelled += 1;
    });

    return counts;
  }, [allResortOrders]);

  /**
   * Filtered Orders according to active status tab, search, room, and date
   */
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // 1. Status Tab filter
      if (activeTab !== 'All') {
        if ((order.status || '').toLowerCase() !== activeTab.toLowerCase()) {
          return false;
        }
      }

      // 2. Search query filter (matches order code, room name, room number)
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const codeMatch = (order.order_code || '').toLowerCase().includes(query);
        const roomNameMatch = (order.room_name || '').toLowerCase().includes(query);
        const roomNumberMatch = (order.room_number || '').toLowerCase().includes(query);
        const noteMatch = (order.special_note || '').toLowerCase().includes(query);
        if (!codeMatch && !roomNameMatch && !roomNumberMatch && !noteMatch) {
          return false;
        }
      }

      // 3. Room filter
      if (roomFilter) {
        const roomTerm = roomFilter.toLowerCase();
        const orderRoomNum = (order.room_number || '').toLowerCase();
        const orderRoomName = (order.room_name || '').toLowerCase();
        if (!orderRoomNum.includes(roomTerm) && !orderRoomName.includes(roomTerm)) {
          return false;
        }
      }

      // 4. Date filter (YYYY-MM-DD match against created_at)
      if (dateFilter) {
        if (!order.created_at || !order.created_at.startsWith(dateFilter)) {
          return false;
        }
      }

      return true;
    });
  }, [orders, activeTab, searchQuery, roomFilter, dateFilter]);

  /**
   * Copy Order Code to Clipboard
   */
  const handleCopyCode = (code) => {
    if (!code) return;
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    toast.info(`Copied ${code} to clipboard`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  /**
   * Reset all filters
   */
  const handleResetFilters = () => {
    setActiveTab('All');
    setSearchQuery('');
    setRoomFilter('');
    setDateFilter('');
  };

  /**
   * Handle Forward Status Progression (Pending -> In Kitchen, In Kitchen -> Out for Delivery, Out for Delivery -> Delivered)
   */
  const handleProgressStatus = async (order, nextStatus) => {
    setActionInProgressId(order.order_id);
    try {
      const result = await foodOrderApi.updateOrderStatus(order.order_code, nextStatus);
      toast.success(result.message || `Order ${order.order_code} transitioned to "${nextStatus}".`);

      // Update state locally for fast UI responsiveness
      const updatedOrder = result.data;
      setOrders((prev) =>
        prev.map((o) => (o.order_id === order.order_id ? { ...o, ...updatedOrder, status: nextStatus } : o))
      );
      setAllResortOrders((prev) =>
        prev.map((o) => (o.order_id === order.order_id ? { ...o, ...updatedOrder, status: nextStatus } : o))
      );
    } catch (err) {
      console.error('Status transition error:', err);
      toast.error(err.message || `Failed to transition order to ${nextStatus}.`);
    } finally {
      setActionInProgressId(null);
    }
  };

  /**
   * Handle Order Cancellation Modal Submission
   */
  const handleConfirmCancellation = async (reason) => {
    if (!cancellingOrder) return;
    setIsSubmittingCancel(true);
    setCancelModalError(null);

    try {
      const result = await foodOrderApi.updateOrderStatus(cancellingOrder.order_code, 'Cancelled', reason);
      toast.success(`Order ${cancellingOrder.order_code} has been cancelled.`);

      // Update in state
      const updatedOrder = result.data;
      setOrders((prev) =>
        prev.map((o) =>
          o.order_id === cancellingOrder.order_id ? { ...o, ...updatedOrder, status: 'Cancelled' } : o
        )
      );
      setAllResortOrders((prev) =>
        prev.map((o) =>
          o.order_id === cancellingOrder.order_id ? { ...o, ...updatedOrder, status: 'Cancelled' } : o
        )
      );

      setCancellingOrder(null);
    } catch (err) {
      console.error('Cancellation error from backend:', err);
      setCancelModalError(
        err.message || 'Failed to cancel order. Please verify that a valid reason is provided.'
      );
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  // ----------------------------------------------------------------------
  // ACCESS DENIED VIEW (For Unauthenticated or Guest Users)
  // ----------------------------------------------------------------------
  if (!authSession.isAuthenticated) {
    return (
      <div className="space-y-6">
        <Header title="Food Orders Management" subtitle="Resort in-room dining live dashboard" />
        <div className="bg-white rounded-3xl p-12 border border-gray-200/80 shadow-xs text-center max-w-xl mx-auto my-12">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h3 className="font-serif text-2xl font-bold text-gray-900 mb-2">Authentication Required</h3>
          <p className="text-gray-500 text-sm mb-6">
            You must be logged in with verified resort staff or administrator credentials to access the Food Orders
            dashboard.
          </p>
          <a
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#245d6a] hover:bg-[#18424b] text-white text-xs font-semibold rounded-xl transition-all shadow-xs"
          >
            Go to Staff Login &rarr;
          </a>
        </div>
      </div>
    );
  }

  if (!isAuthorizedRole) {
    return (
      <div className="space-y-6">
        <Header title="Food Orders Management" subtitle="Resort in-room dining live dashboard" />
        <div className="bg-white rounded-3xl p-12 border border-gray-200/80 shadow-xs text-center max-w-xl mx-auto my-12">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 mb-3 inline-block">
            Access Restricted
          </span>
          <h3 className="font-serif text-2xl font-bold text-gray-900 mb-2">Staff & Admin Access Only</h3>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            Your current account role (<strong className="capitalize text-gray-800">{authSession.role || 'Guest'}</strong>)
            does not have permission to view or manage kitchen orders. Only resort staff and administrators can access
            the Food Orders dashboard.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-xl transition-colors"
          >
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // AUTHORIZED STAFF / ADMIN DASHBOARD
  // ----------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <Header
        title="Food Orders Management"
        subtitle="Live in-room dining kitchen orders, status workflow, and delivery tracking"
        searchPlaceholder="Search order code or room..."
        onSearchChange={(val) => setSearchQuery(val)}
      />

      {/* ================================================================= */}
      {/* FEATURE A: ORDER OVERVIEW CARDS                                   */}
      {/* ================================================================= */}
      <section aria-label="Order Overview">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* 1. Total Orders */}
          <button
            type="button"
            onClick={() => setActiveTab('All')}
            className={`p-5 rounded-3xl border text-left transition-all cursor-pointer ${
              activeTab === 'All'
                ? 'bg-white border-[#275965] ring-2 ring-[#275965]/20 shadow-md'
                : 'bg-white border-gray-200/80 hover:border-gray-300 shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase">Total Orders</span>
              <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mt-2 font-serif">{overviewCounts.total}</p>
            <p className="text-[11px] text-gray-500 mt-1">All resort orders</p>
          </button>

          {/* 2. Pending Orders */}
          <button
            type="button"
            onClick={() => setActiveTab('Pending')}
            className={`p-5 rounded-3xl border text-left transition-all cursor-pointer ${
              activeTab === 'Pending'
                ? 'bg-amber-50/50 border-amber-400 ring-2 ring-amber-300/40 shadow-md'
                : 'bg-white border-gray-200/80 hover:border-amber-200 shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-wider text-amber-700 uppercase">Pending</span>
              <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-bold text-amber-900 mt-2 font-serif">{overviewCounts.pending}</p>
            <p className="text-[11px] text-amber-700/80 mt-1">Awaiting kitchen accept</p>
          </button>

          {/* 3. In Kitchen Orders */}
          <button
            type="button"
            onClick={() => setActiveTab('In Kitchen')}
            className={`p-5 rounded-3xl border text-left transition-all cursor-pointer ${
              activeTab === 'In Kitchen'
                ? 'bg-blue-50/50 border-blue-400 ring-2 ring-blue-300/40 shadow-md'
                : 'bg-white border-gray-200/80 hover:border-blue-200 shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-wider text-blue-700 uppercase">In Kitchen</span>
              <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700">
                <ChefHat className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-bold text-blue-900 mt-2 font-serif">{overviewCounts.inKitchen}</p>
            <p className="text-[11px] text-blue-700/80 mt-1">Preparing dishes</p>
          </button>

          {/* 4. Out for Delivery Orders */}
          <button
            type="button"
            onClick={() => setActiveTab('Out for Delivery')}
            className={`p-5 rounded-3xl border text-left transition-all cursor-pointer ${
              activeTab === 'Out for Delivery'
                ? 'bg-purple-50/50 border-purple-400 ring-2 ring-purple-300/40 shadow-md'
                : 'bg-white border-gray-200/80 hover:border-purple-200 shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-wider text-purple-700 uppercase">Out for Delivery</span>
              <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700">
                <Bike className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-bold text-purple-900 mt-2 font-serif">{overviewCounts.outForDelivery}</p>
            <p className="text-[11px] text-purple-700/80 mt-1">En route to room</p>
          </button>

          {/* 5. Delivered Orders */}
          <button
            type="button"
            onClick={() => setActiveTab('Delivered')}
            className={`p-5 rounded-3xl border text-left transition-all cursor-pointer ${
              activeTab === 'Delivered'
                ? 'bg-emerald-50/50 border-emerald-400 ring-2 ring-emerald-300/40 shadow-md'
                : 'bg-white border-gray-200/80 hover:border-emerald-200 shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-wider text-emerald-700 uppercase">Delivered</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-bold text-emerald-900 mt-2 font-serif">{overviewCounts.delivered}</p>
            <p className="text-[11px] text-emerald-700/80 mt-1">Successfully fulfilled</p>
          </button>
        </div>
      </section>

      {/* ================================================================= */}
      {/* FEATURE B: STATUS TABS & FEATURE D: SEARCH AND FILTERS TOOLBAR    */}
      {/* ================================================================= */}
      <section className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-200/80 shadow-2xs space-y-4">
        {/* Row 1: Status Tabs */}
        <div className="flex items-center justify-between gap-3 flex-wrap border-b border-gray-100 pb-4">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full">
            {[
              { id: 'All', label: 'All Orders', count: overviewCounts.total },
              { id: 'Pending', label: 'Pending', count: overviewCounts.pending },
              { id: 'In Kitchen', label: 'In Kitchen', count: overviewCounts.inKitchen },
              { id: 'Out for Delivery', label: 'Out for Delivery', count: overviewCounts.outForDelivery },
              { id: 'Delivered', label: 'Delivered', count: overviewCounts.delivered },
              { id: 'Cancelled', label: 'Cancelled', count: overviewCounts.cancelled },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-[#275965] text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Action buttons: Reload and View Mode Toggle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchOrders(true)}
              disabled={isRefreshing || isLoading}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-medium rounded-xl transition-all cursor-pointer disabled:opacity-50"
              title="Refresh order records"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <div className="flex items-center p-1 bg-gray-100 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  viewMode === 'cards' ? 'bg-white text-[#245d6a] shadow-2xs font-semibold' : 'text-gray-500 hover:text-gray-900'
                }`}
                title="Grid Card View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-[#245d6a] shadow-2xs font-semibold' : 'text-gray-500 hover:text-gray-900'
                }`}
                title="Detailed Table View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Search and Advanced Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search code or room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 hover:bg-white text-xs text-gray-800 placeholder-gray-400 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-[#275965]/20 focus:border-[#275965] transition-all"
            />
          </div>

          {/* Room Filter Dropdown */}
          <div className="relative">
            <BedDouble className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-gray-50 hover:bg-white text-xs text-gray-800 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-[#275965]/20 focus:border-[#275965] transition-all cursor-pointer appearance-none"
            >
              <option value="">All Resort Rooms</option>
              <option value="Room 3">Room 3 — Uva Valley View Room</option>
              <option value="Room 4">Room 4 — Bridal Suite, Uva Valley</option>
              <option value="Room 5">Room 5 — Indian Ocean View Room</option>
            </select>
          </div>

          {/* Date Filter Input */}
          <div className="relative">
            <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 hover:bg-white text-xs text-gray-800 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-[#275965]/20 focus:border-[#275965] transition-all cursor-pointer"
            />
          </div>

          {/* Clear Filters Button */}
          <div className="flex items-center gap-2">
            {(searchQuery || roomFilter || dateFilter || activeTab !== 'All') && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex-1 py-2 px-3 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 hover:text-gray-900 rounded-xl transition-colors cursor-pointer text-center"
              >
                Clear All Filters
              </button>
            )}
            <div className="text-[11px] text-gray-400 self-center ml-auto font-medium">
              Showing {filteredOrders.length} of {orders.length}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* FEATURE F: UI STATES (API ERROR STATE)                            */}
      {/* ================================================================= */}
      {apiError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-3xl flex items-center justify-between gap-4 text-xs text-rose-800 shadow-2xs">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <p className="font-semibold text-rose-900">Failed to Retrieve Orders</p>
              <p className="text-rose-700 mt-0.5">{apiError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => fetchOrders(true)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl transition-colors shrink-0 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* ================================================================= */}
      {/* FEATURE F: UI STATES (LOADING STATE)                              */}
      {/* ================================================================= */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-2xs animate-pulse space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="w-28 h-5 bg-gray-200 rounded-lg" />
                <div className="w-20 h-5 bg-gray-200 rounded-full" />
              </div>
              <div className="w-3/4 h-6 bg-gray-200 rounded-lg" />
              <div className="space-y-2 py-4 border-y border-gray-100">
                <div className="w-full h-4 bg-gray-100 rounded-sm" />
                <div className="w-5/6 h-4 bg-gray-100 rounded-sm" />
              </div>
              <div className="flex items-center justify-between pt-2">
                <div className="w-24 h-6 bg-gray-200 rounded-lg" />
                <div className="w-20 h-8 bg-gray-200 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        /* =============================================================== */
        /* FEATURE F: UI STATES (EMPTY STATE)                              */
        /* =============================================================== */
        <div className="bg-white rounded-3xl p-12 border border-gray-200/80 shadow-2xs text-center max-w-lg mx-auto my-8 space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center text-[#245d6a] mx-auto">
            <ShoppingBag className="w-8 h-8 opacity-70" />
          </div>
          <h3 className="font-serif text-2xl font-bold text-gray-900">No Food Orders Found</h3>
          <p className="text-gray-500 text-xs max-w-md mx-auto leading-relaxed">
            {searchQuery || roomFilter || dateFilter || activeTab !== 'All'
              ? 'No orders matched your specified status or search filters. Try adjusting or clearing your active filters.'
              : 'There are currently no dining orders in the resort system. In-room guest orders will appear here automatically.'}
          </p>
          {(searchQuery || roomFilter || dateFilter || activeTab !== 'All') && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-4 px-5 py-2.5 bg-[#245d6a] hover:bg-[#18424b] text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-xs"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : viewMode === 'cards' ? (
        /* =============================================================== */
        /* FEATURE C: ORDER CARDS GRID                                     */
        /* =============================================================== */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredOrders.map((order) => {
            const isBusy = actionInProgressId === order.order_id;
            const items = Array.isArray(order.items) ? order.items : [];

            return (
              <article
                key={order.order_id || order.order_code}
                className="bg-white rounded-3xl border border-gray-200/80 shadow-2xs hover:shadow-md transition-all flex flex-col overflow-hidden"
              >
                {/* Card Header */}
                <div className="p-5 border-b border-gray-100 bg-[#fbfbfa] flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-gray-900 tracking-wider">
                        {order.order_code}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(order.order_code)}
                        className="text-gray-400 hover:text-gray-700 p-1 rounded-md transition-colors cursor-pointer"
                        title="Copy Order Code"
                      >
                        {copiedCode === order.order_code ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <p className="text-[11px] text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span>{formatOrderDateTime(order.created_at)}</span>
                    </p>
                  </div>

                  <OrderStatusBadge status={order.status} />
                </div>

                {/* Destination & Guest */}
                <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2.5 bg-white">
                  <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center text-[#245d6a] shrink-0">
                    <BedDouble className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-gray-900 truncate">
                      {order.room_name || order.room_number || 'Resort Room'}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      Destination: {order.room_number || 'Room'}
                    </p>
                  </div>
                </div>

                {/* Food Items Breakdown */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <span className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase block">
                      Order Items ({items.length})
                    </span>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {items.map((item, idx) => (
                        <div
                          key={item.order_detail_id || idx}
                          className="flex items-start justify-between gap-2 text-xs py-1 border-b border-gray-50 last:border-0"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="font-semibold text-gray-800">{item.item_name}</span>
                            <div className="text-[11px] text-gray-400 flex items-center gap-2 mt-0.5">
                              <span>Qty: {item.quantity}</span>
                              <span>•</span>
                              <span>{formatLKR(item.unit_price)} each</span>
                            </div>
                          </div>
                          <span className="font-medium text-gray-900 text-xs shrink-0">
                            {formatLKR(item.line_total || item.unit_price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Special Instructions / Notes */}
                  {order.special_note && (
                    <div className="p-3 bg-amber-50/70 border border-amber-200/70 rounded-2xl text-[11px] text-amber-900 flex items-start gap-2.5">
                      <MessageSquare className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold block text-[10px] uppercase tracking-wider text-amber-800">
                          Special Instructions:
                        </span>
                        <p className="mt-0.5 italic">{order.special_note}</p>
                      </div>
                    </div>
                  )}

                  {/* Pricing Breakdown */}
                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 space-y-1 text-xs">
                    <div className="flex items-center justify-between text-gray-500">
                      <span>Subtotal:</span>
                      <span>{formatLKR(order.subtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between text-gray-500">
                      <span>Service Charge (10%):</span>
                      <span>{formatLKR(order.service_charge)}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-gray-200 font-bold text-gray-900">
                      <span>Total Amount:</span>
                      <span className="text-sm text-[#245d6a]">{formatLKR(order.total_amount)}</span>
                    </div>
                  </div>
                </div>

                {/* ========================================================= */}
                {/* FEATURE E: STATUS MANAGEMENT ACTIONS                       */}
                {/* ========================================================= */}
                <div className="p-4 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setHistoryOrder(order)}
                    className="flex items-center gap-1.5 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200/60 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    title="Audit trail history"
                  >
                    <History className="w-3.5 h-3.5 text-gray-500" />
                    <span>History</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {/* State: Pending -> In Kitchen OR Cancelled */}
                    {order.status === 'Pending' && (
                      <>
                        <button
                          type="button"
                          onClick={() => setCancellingOrder(order)}
                          disabled={isBusy}
                          className="px-3 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleProgressStatus(order, 'In Kitchen')}
                          disabled={isBusy}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#245d6a] hover:bg-[#18424b] text-white text-xs font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          <ChefHat className="w-3.5 h-3.5" />
                          <span>Send to Kitchen</span>
                        </button>
                      </>
                    )}

                    {/* State: In Kitchen -> Out for Delivery OR Cancelled */}
                    {order.status === 'In Kitchen' && (
                      <>
                        <button
                          type="button"
                          onClick={() => setCancellingOrder(order)}
                          disabled={isBusy}
                          className="px-3 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleProgressStatus(order, 'Out for Delivery')}
                          disabled={isBusy}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          <Bike className="w-3.5 h-3.5" />
                          <span>Dispatch Delivery</span>
                        </button>
                      </>
                    )}

                    {/* State: Out for Delivery -> Delivered */}
                    {order.status === 'Out for Delivery' && (
                      <button
                        type="button"
                        onClick={() => handleProgressStatus(order, 'Delivered')}
                        disabled={isBusy}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark Delivered</span>
                      </button>
                    )}

                    {/* Terminal State: Delivered */}
                    {order.status === 'Delivered' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Fulfilled
                      </span>
                    )}

                    {/* Terminal State: Cancelled */}
                    {order.status === 'Cancelled' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs font-medium">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        Cancelled
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        /* =============================================================== */
        /* FEATURE C: DETAILED ORDERS TABLE VIEW                           */
        /* =============================================================== */
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#fbfbfa] text-gray-500 font-semibold border-b border-gray-200/80 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-4 px-6">Order Code</th>
                  <th className="py-4 px-4">Room / Suite</th>
                  <th className="py-4 px-4">Date & Time</th>
                  <th className="py-4 px-4">Items</th>
                  <th className="py-4 px-4">Total Amount</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-6 text-right">Workflow Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((order) => {
                  const items = Array.isArray(order.items) ? order.items : [];
                  const isBusy = actionInProgressId === order.order_id;

                  return (
                    <tr key={order.order_id || order.order_code} className="hover:bg-gray-50/70 transition-colors">
                      {/* Order Code */}
                      <td className="py-4 px-6 font-mono font-bold text-gray-900">
                        <div className="flex items-center gap-1.5">
                          <span>{order.order_code}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(order.order_code)}
                            className="text-gray-400 hover:text-gray-600 cursor-pointer"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* Room */}
                      <td className="py-4 px-4">
                        <p className="font-semibold text-gray-800 truncate max-w-xs">{order.room_name}</p>
                        <p className="text-[11px] text-gray-400">{order.room_number}</p>
                      </td>

                      {/* Date & Time */}
                      <td className="py-4 px-4 text-gray-500 whitespace-nowrap">
                        {formatOrderDateTime(order.created_at)}
                      </td>

                      {/* Items */}
                      <td className="py-4 px-4">
                        <div className="space-y-0.5 max-w-xs">
                          {items.slice(0, 2).map((item, idx) => (
                            <p key={idx} className="text-gray-700 truncate">
                              <span className="font-semibold text-gray-900">{item.quantity}x</span> {item.item_name}
                            </p>
                          ))}
                          {items.length > 2 && (
                            <span className="text-[10px] text-gray-400 font-medium">+{items.length - 2} more items</span>
                          )}
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td className="py-4 px-4 font-bold text-[#245d6a] whitespace-nowrap">
                        {formatLKR(order.total_amount)}
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-4">
                        <OrderStatusBadge status={order.status} />
                      </td>

                      {/* Workflow Actions */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setHistoryOrder(order)}
                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            title="View order history"
                          >
                            <History className="w-4 h-4" />
                          </button>

                          {order.status === 'Pending' && (
                            <>
                              <button
                                type="button"
                                onClick={() => setCancellingOrder(order)}
                                disabled={isBusy}
                                className="px-2.5 py-1.5 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleProgressStatus(order, 'In Kitchen')}
                                disabled={isBusy}
                                className="px-3 py-1.5 bg-[#245d6a] hover:bg-[#18424b] text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs disabled:opacity-50"
                              >
                                Accept
                              </button>
                            </>
                          )}

                          {order.status === 'In Kitchen' && (
                            <>
                              <button
                                type="button"
                                onClick={() => setCancellingOrder(order)}
                                disabled={isBusy}
                                className="px-2.5 py-1.5 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleProgressStatus(order, 'Out for Delivery')}
                                disabled={isBusy}
                                className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs disabled:opacity-50"
                              >
                                Dispatch
                              </button>
                            </>
                          )}

                          {order.status === 'Out for Delivery' && (
                            <button
                              type="button"
                              onClick={() => handleProgressStatus(order, 'Delivered')}
                              disabled={isBusy}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs disabled:opacity-50"
                            >
                              Deliver
                            </button>
                          )}

                          {order.status === 'Delivered' && (
                            <span className="text-emerald-700 text-xs font-medium">Completed</span>
                          )}

                          {order.status === 'Cancelled' && (
                            <span className="text-rose-700 text-xs font-medium">Cancelled</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODALS                                                            */}
      {/* ================================================================= */}

      {/* Order Cancellation Modal */}
      <OrderCancellationModal
        isOpen={Boolean(cancellingOrder)}
        order={cancellingOrder}
        onClose={() => {
          setCancellingOrder(null);
          setCancelModalError(null);
        }}
        onConfirm={handleConfirmCancellation}
        isSubmitting={isSubmittingCancel}
        apiError={cancelModalError}
      />

      {/* Audit Trail History Modal */}
      <OrderHistoryModal
        isOpen={Boolean(historyOrder)}
        order={historyOrder}
        onClose={() => setHistoryOrder(null)}
      />
    </div>
  );
}
