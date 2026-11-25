import api from './client.js';

/**
 * Food Orders API Service
 * Handles staff & admin food order queries and status management.
 * Uses the shared Axios client which automatically attaches the authenticated Bearer token.
 */
export const foodOrderApi = {
  /**
   * Fetch resort food orders with optional filters & pagination
   * GET /api/food/orders
   *
   * @param {Object} [filters={}]
   * @param {string} [filters.status] - 'Pending' | 'In Kitchen' | 'Out for Delivery' | 'Delivered' | 'Cancelled'
   * @param {string} [filters.room] - Room number or room name filter
   * @param {string} [filters.date] - Date string in YYYY-MM-DD format
   * @param {string} [filters.search] - Search keyword (order code, room name, etc.)
   * @param {number} [filters.page=1]
   * @param {number} [filters.limit=20]
   * @returns {Promise<Object>} API response object containing { success, count, total, page, limit, totalPages, data: Order[] }
   */
  getOrders: async (filters = {}) => {
    const params = {};

    if (filters.status && filters.status !== 'all' && filters.status !== 'All') {
      params.status = filters.status;
    }
    if (filters.room && typeof filters.room === 'string' && filters.room.trim()) {
      params.room = filters.room.trim();
    }
    if (filters.date && typeof filters.date === 'string' && filters.date.trim()) {
      params.date = filters.date.trim();
    }
    if (filters.search && typeof filters.search === 'string' && filters.search.trim()) {
      params.search = filters.search.trim();
    }
    if (filters.page && Number.isInteger(Number(filters.page)) && Number(filters.page) > 0) {
      params.page = Number(filters.page);
    }
    if (filters.limit && Number.isInteger(Number(filters.limit)) && Number(filters.limit) > 0) {
      params.limit = Number(filters.limit);
    }

    const response = await api.get('/food/orders', { params });
    return response.data;
  },

  /**
   * Update order status with atomic state machine transitions
   * PATCH /api/food/orders/code/:order_code/status
   *
   * @param {string} orderCode - Target order code (e.g. ORD-20261121-7F3A2B)
   * @param {string} nextStatus - 'In Kitchen' | 'Out for Delivery' | 'Delivered' | 'Cancelled'
   * @param {string} [reason] - Meaningful change reason (required if cancelling)
   * @returns {Promise<Object>} API response object containing { success, message, data: Order }
   */
  updateOrderStatus: async (orderCode, nextStatus, reason) => {
    if (!orderCode || typeof orderCode !== 'string' || !orderCode.trim()) {
      throw new Error('Order code is required to update order status.');
    }
    if (!nextStatus || typeof nextStatus !== 'string' || !nextStatus.trim()) {
      throw new Error('Target status is required to update order status.');
    }

    const payload = {
      status: nextStatus.trim(),
    };

    if (reason !== undefined && reason !== null && typeof reason === 'string' && reason.trim()) {
      payload.change_reason = reason.trim();
    }

    const response = await api.patch(
      `/food/orders/code/${encodeURIComponent(orderCode.trim())}/status`,
      payload
    );
    return response.data;
  },
};

// Also export named helpers
export const getOrders = foodOrderApi.getOrders;
export const updateOrderStatus = foodOrderApi.updateOrderStatus;
export default foodOrderApi;
