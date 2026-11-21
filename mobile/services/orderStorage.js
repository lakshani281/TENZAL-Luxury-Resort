/**
 * =============================================================================
 * TENZAL Luxury Resort - Food Ordering Module (Student ID: 22CIS0328)
 * Service: Local Order Receipt Storage Adapter
 * File: mobile/services/orderStorage.js
 * =============================================================================
 * Provides resilient, privacy-preserving persistent storage for guests' in-room
 * dining order receipts.
 *
 * STORAGE STRATEGY:
 * - Expo Web: Uses browser window.localStorage with SSR safety checks.
 * - Android / iOS: Uses @react-native-async-storage/async-storage for on-device
 *   persistence across app restarts and reboots.
 * - Decoupled Reliability: Any storage read/write errors are gracefully caught
 *   and logged without throwing or interrupting the active checkout workflow.
 *
 * PRIVACY SPECIFICATION:
 * Stores ONLY the minimal receipt fields required to display proof-of-purchase
 * and enable batch progress tracking:
 * - orderCode (string)
 * - createdAt (ISO timestamp)
 * - items: [{ name, quantity, price }]
 * - subtotalLKR, serviceChargeLKR, totalLKR
 * - status (last known progress state)
 * - estimatedDeliveryMinutes
 *
 * STRICTLY NEVER PERSISTS:
 * - Special delivery notes or dietary/allergy instructions
 * - Room numbers, room names, or suite identifiers
 * - Customer IDs, guest credentials, or internal database keys
 * =============================================================================
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@tenzal_food_orders';
const MAX_ORDERS = 10;

// All allowed order statuses matching PostgreSQL constraint and state machine
const ALLOWED_STATUSES = Object.freeze([
  'Pending',
  'In Kitchen',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
]);

// Ephemeral runtime fallback for active session if local storage is unavailable
let runtimeSessionOrders = [];

/**
 * Checks if browser localStorage is available in Web environment.
 *
 * @returns {boolean}
 */
function isLocalStorageAvailable() {
  try {
    return (
      Platform.OS === 'web' &&
      typeof window !== 'undefined' &&
      typeof window.localStorage !== 'undefined' &&
      window.localStorage !== null
    );
  } catch (e) {
    return false;
  }
}

/**
 * Normalizes an order object into a minimal, privacy-compliant receipt.
 *
 * @param {Object} raw - Raw order data from checkout or API response
 * @returns {Object|null}
 */
function sanitizeReceipt(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const orderCode = raw.orderCode || raw.order_code || raw.orderId;
  if (!orderCode || typeof orderCode !== 'string') return null;

  const rawItems = Array.isArray(raw.items) ? raw.items : [];
  const sanitizedItems = rawItems.map((it) => ({
    name: String(it.name || it.item_name || 'Dish').slice(0, 100),
    quantity: Number(it.quantity) || 1,
    price: Number(it.price || it.unit_price) || 0,
  }));

  return {
    orderCode: orderCode.trim().toUpperCase(),
    createdAt: raw.createdAt || raw.created_at || new Date().toISOString(),
    items: sanitizedItems,
    subtotalLKR: Number(raw.subtotalLKR || raw.subtotal) || 0,
    serviceChargeLKR: Number(raw.serviceChargeLKR || raw.service_charge) || 0,
    totalLKR: Number(raw.totalLKR || raw.total_amount) || 0,
    status: raw.status || 'Pending',
    estimatedDeliveryMinutes: Number(raw.estimatedDeliveryMinutes || raw.estimated_delivery_minutes) || 30,
  };
}

/**
 * Loads recent in-room order receipts from persistent local storage.
 *
 * @returns {Promise<Array<Object>>} Array of up to 10 stored minimal receipts
 */
export async function loadRecentOrders() {
  try {
    let jsonString = null;

    if (isLocalStorageAvailable()) {
      jsonString = window.localStorage.getItem(STORAGE_KEY);
    } else {
      jsonString = await AsyncStorage.getItem(STORAGE_KEY);
    }

    if (!jsonString) {
      return [...runtimeSessionOrders];
    }

    const parsed = JSON.parse(jsonString);
    if (!Array.isArray(parsed)) {
      return [...runtimeSessionOrders];
    }

    const sanitized = parsed.map(sanitizeReceipt).filter(Boolean).slice(0, MAX_ORDERS);
    runtimeSessionOrders = sanitized;
    return sanitized;
  } catch (error) {
    console.warn('[orderStorage] Warning: Failed to read from persistent storage:', error.message || error);
    return [...runtimeSessionOrders];
  }
}

/**
 * Saves a new order receipt to local storage, prepending it to recent orders
 * and pruning older orders beyond the 10-order capacity.
 *
 * @param {Object} receiptData - Order details from successful checkout
 * @returns {Promise<Array<Object>>} Updated list of stored receipts
 */
export async function saveOrderReceipt(receiptData) {
  const sanitized = sanitizeReceipt(receiptData);
  if (!sanitized) {
    console.warn('[orderStorage] Invalid receipt data passed to saveOrderReceipt');
    return [...runtimeSessionOrders];
  }

  try {
    const existing = await loadRecentOrders();
    // Prepend new order, deduplicate by orderCode, cap to 10
    const updated = [
      sanitized,
      ...existing.filter((o) => o.orderCode !== sanitized.orderCode),
    ].slice(0, MAX_ORDERS);

    runtimeSessionOrders = updated;
    const jsonString = JSON.stringify(updated);

    if (isLocalStorageAvailable()) {
      window.localStorage.setItem(STORAGE_KEY, jsonString);
    } else {
      await AsyncStorage.setItem(STORAGE_KEY, jsonString);
    }

    return updated;
  } catch (error) {
    console.warn('[orderStorage] Warning: Failed to write order to persistent storage:', error.message || error);
    // Maintain in-memory session update even if persistence threw
    runtimeSessionOrders = [
      sanitized,
      ...runtimeSessionOrders.filter((o) => o.orderCode !== sanitized.orderCode),
    ].slice(0, MAX_ORDERS);
    return runtimeSessionOrders;
  }
}

/**
 * Updates status and delivery estimate for an existing stored order.
 * Rejects invalid statuses not present in ALLOWED_STATUSES.
 *
 * @param {string} orderCode - Unique order code (e.g. 'ORD-20261121-7F3A2B')
 * @param {string} nextStatus - New status (e.g. 'In Kitchen', 'Out for Delivery')
 * @param {number} [estimatedDeliveryMinutes] - Updated ETA in minutes
 * @returns {Promise<Array<Object>>} Updated list of stored receipts
 */
export async function updateOrderStatusInStorage(orderCode, nextStatus, estimatedDeliveryMinutes) {
  if (!orderCode || !nextStatus || typeof nextStatus !== 'string' || !ALLOWED_STATUSES.includes(nextStatus.trim())) {
    return [...runtimeSessionOrders];
  }

  const validatedStatus = nextStatus.trim();

  try {
    const existing = await loadRecentOrders();
    const updated = existing.map((ord) => {
      if (ord.orderCode === orderCode.trim().toUpperCase()) {
        return {
          ...ord,
          status: validatedStatus,
          estimatedDeliveryMinutes:
            estimatedDeliveryMinutes !== undefined && estimatedDeliveryMinutes !== null
              ? Number(estimatedDeliveryMinutes)
              : ord.estimatedDeliveryMinutes,
        };
      }
      return ord;
    });

    runtimeSessionOrders = updated;
    const jsonString = JSON.stringify(updated);

    if (isLocalStorageAvailable()) {
      window.localStorage.setItem(STORAGE_KEY, jsonString);
    } else {
      await AsyncStorage.setItem(STORAGE_KEY, jsonString);
    }

    return updated;
  } catch (error) {
    console.warn('[orderStorage] Warning: Failed to update order in storage:', error.message || error);
    return runtimeSessionOrders;
  }
}

/**
 * Updates multiple order statuses and delivery estimates in persistent storage atomically.
 *
 * Privacy & Safety Guarantees:
 * - Validates next status against ALLOWED_STATUSES; rejects invalid/unknown statuses.
 * - Missing orders in trackingList preserve their existing local status without deletion.
 * - Network errors or HTTP 429: caller avoids invoking this method, preserving storage intact.
 * - Executes a single atomic storage write, avoiding parallel race conditions.
 *
 * @param {Array<{ order_code: string, status: string, estimated_delivery_minutes?: number }>} trackingList
 * @returns {Promise<Array<Object>>} Updated list of stored receipts
 */
export async function updateBatchOrderStatuses(trackingList) {
  if (!Array.isArray(trackingList) || trackingList.length === 0) {
    return loadRecentOrders();
  }

  try {
    const existing = await loadRecentOrders();
    let hasChanges = false;

    const updated = existing.map((order) => {
      const match = trackingList.find(
        (t) => t && typeof t.order_code === 'string' && t.order_code.trim().toUpperCase() === order.orderCode
      );

      // Validate status against whitelist
      if (match && typeof match.status === 'string' && ALLOWED_STATUSES.includes(match.status.trim())) {
        const validatedStatus = match.status.trim();
        const nextMinutes =
          match.estimated_delivery_minutes !== undefined && match.estimated_delivery_minutes !== null
            ? Number(match.estimated_delivery_minutes)
            : order.estimatedDeliveryMinutes;

        if (order.status !== validatedStatus || order.estimatedDeliveryMinutes !== nextMinutes) {
          hasChanges = true;
          return {
            ...order,
            status: validatedStatus,
            estimatedDeliveryMinutes: nextMinutes,
          };
        }
      }
      // Missing orders or invalid statuses: strictly preserve existing order status!
      return order;
    });

    if (hasChanges) {
      runtimeSessionOrders = updated;
      const jsonString = JSON.stringify(updated);

      if (isLocalStorageAvailable()) {
        window.localStorage.setItem(STORAGE_KEY, jsonString);
      } else {
        await AsyncStorage.setItem(STORAGE_KEY, jsonString);
      }
    }

    return updated;
  } catch (error) {
    console.warn('[orderStorage] Warning: Failed to batch update order statuses in storage:', error.message || error);
    return runtimeSessionOrders;
  }
}

export default {
  loadRecentOrders,
  saveOrderReceipt,
  updateOrderStatusInStorage,
  updateBatchOrderStatuses,
};
