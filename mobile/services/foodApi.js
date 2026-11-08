/**
 * =============================================================================
 * TENZAL Luxury Resort - Food Ordering Module (Student ID: 22CIS0328)
 * Service: Food Ordering API Service Client
 * File: mobile/services/foodApi.js
 * =============================================================================
 * Provides typed, resilient network communication with the Express backend
 * using React Native's built-in `fetch` and `AbortController`.
 * 
 * Supports:
 * - Dynamic environment resolution (Android Emulator, Web, Physical Phone)
 * - Request timeouts and error handling
 * - Query parameter serialization
 * - Food item data normalization for FoodMenuScreen
 * =============================================================================
 */

import { Platform } from 'react-native';

/**
 * -----------------------------------------------------------------------------
 * 1. NETWORK / HOST CONFIGURATION
 * -----------------------------------------------------------------------------
 * Configure your development environment here:
 * 
 * - ANDROID EMULATOR (AVD):
 *   Uses '10.0.2.2', which is Android's loopback alias to the host machine.
 * 
 * - WEB BROWSER:
 *   Uses 'localhost' (port 5000).
 * 
 * - PHYSICAL ANDROID / iOS DEVICE (via Expo Go over Wi-Fi):
 *   1. Set USE_PHYSICAL_DEVICE = true.
 *   2. Set DEV_MACHINE_LAN_IP to your PC's Wi-Fi IPv4 address (e.g. '10.79.51.130').
 *   3. Make sure your phone and PC are connected to the same Wi-Fi network.
 * -----------------------------------------------------------------------------
 */

// TOGGLE THIS TO TRUE WHEN TESTING ON A PHYSICAL PHONE VIA EXPO GO:
export const USE_PHYSICAL_DEVICE = false;

// YOUR COMPUTER'S LOCAL NETWORK IP (Run 'ipconfig' in Windows PowerShell):
export const DEV_MACHINE_LAN_IP = '10.79.51.130';

// Backend port configured in backend/.env
export const BACKEND_PORT = 5000;

// Default request timeout in milliseconds (10 seconds)
export const DEFAULT_TIMEOUT_MS = 10000;

/**
 * Resolves the appropriate base URL for the current runtime platform.
 * 
 * @returns {string} The base URL for the food API
 */
export function getBaseUrl() {
  // If physical device mode is explicitly turned on
  if (USE_PHYSICAL_DEVICE && DEV_MACHINE_LAN_IP) {
    return `http://${DEV_MACHINE_LAN_IP}:${BACKEND_PORT}/api/food`;
  }

  // Standard Android Studio Emulator loopback address
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${BACKEND_PORT}/api/food`;
  }

  // Web and iOS Simulator use localhost
  return `http://localhost:${BACKEND_PORT}/api/food`;
}

/**
 * -----------------------------------------------------------------------------
 * 2. URL BUILDER & HTTP REQUEST UTILITIES
 * -----------------------------------------------------------------------------
 */

/**
 * Builds a full URL with query parameters encoded safely.
 * 
 * @param {string} endpoint - API endpoint relative to base URL (e.g., '/items')
 * @param {Object} [params={}] - Key-value map of query parameters
 * @returns {string} Complete URL with query string
 */
export function buildUrl(endpoint, params = {}) {
  const base = getBaseUrl().replace(/\/+$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${base}${cleanEndpoint}`;

  const queryParts = [];
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value).trim())}`);
    }
  }

  return queryParts.length > 0 ? `${url}?${queryParts.join('&')}` : url;
}

/**
 * Performs an HTTP request with built-in AbortController timeout and error handling.
 * 
 * @param {string} url - Target URL
 * @param {Object} [options={}] - Standard fetch options (method, headers, body)
 * @param {number} [timeoutMs=DEFAULT_TIMEOUT_MS] - Timeout duration in milliseconds
 * @returns {Promise<any>} Parsed JSON response payload
 */
async function request(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    // Parse JSON body if present
    let responseBody = null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        responseBody = await response.json();
      } catch (parseError) {
        console.warn('[foodApi] Warning: Failed to parse JSON response:', parseError.message);
      }
    }

    if (!response.ok) {
      const serverMessage =
        responseBody && (responseBody.message || responseBody.error)
          ? responseBody.message || responseBody.error
          : `HTTP ${response.status}: ${response.statusText}`;

      const httpError = new Error(serverMessage);
      httpError.status = response.status;
      httpError.data = responseBody;
      throw httpError;
    }

    return responseBody;
  } catch (error) {
    if (error.name === 'AbortError') {
      const timeoutError = new Error(
        `Request timeout: Food API server at ${url} did not respond within ${timeoutMs / 1000}s.`
      );
      timeoutError.code = 'ETIMEDOUT';
      throw timeoutError;
    }

    // Network error (e.g. server offline, connection refused, DNS failure)
    if (!error.status) {
      const networkError = new Error(
        `Network connection failed. Could not reach backend at ${url}. ` +
        `Ensure Express server is running on port ${BACKEND_PORT}. (${error.message})`
      );
      networkError.code = 'ENETWORK';
      throw networkError;
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * -----------------------------------------------------------------------------
 * 3. FOOD ITEM DATA MAPPER / NORMALIZER
 * -----------------------------------------------------------------------------
 * Converts backend PostgreSQL food item entities into the format expected by
 * FoodMenuScreen.jsx UI components and modals:
 * 
 * - item_id            → id (string)
 * - prep_time_minutes  → prepTime (formatted string, e.g., "~25 min (Demo Est.)")
 * - special_badge      → badge (string)
 * - image_url          → image (string)
 * - is_available       → isAvailable (boolean)
 * - category_name      → category (string)
 * -----------------------------------------------------------------------------
 */

/**
 * Normalizes a single food item entity from backend to FoodMenuScreen format.
 * 
 * @param {Object} item - Raw food item from database / API
 * @returns {Object|null} Normalized food item object
 */
export function mapFoodItem(item) {
  if (!item) return null;

  // Format prep time into friendly display string
  const prepMinutes = item.prep_time_minutes !== undefined && item.prep_time_minutes !== null
    ? Number(item.prep_time_minutes)
    : null;

  const prepTimeString = prepMinutes
    ? `~${prepMinutes} min (Demo Est.)`
    : (item.prepTime || '~20 min (Demo Est.)');

  return {
    // Screen UI properties
    id: item.item_id !== undefined ? String(item.item_id) : (item.id ? String(item.id) : ''),
    name: item.name || '',
    subtitle: item.subtitle || '',
    description: item.description || item.subtitle || '',
    category: item.category_name || item.category?.name || item.category || 'General',
    price: typeof item.price === 'number' ? item.price : (parseFloat(item.price) || 0),
    prepTime: prepTimeString,
    badge: item.special_badge || item.badge || (item.is_special ? "Chef's Special" : null),
    image: item.image_url || item.image || '',
    isAvailable: typeof item.is_available === 'boolean'
      ? item.is_available
      : (item.isAvailable !== undefined ? Boolean(item.isAvailable) : true),
    ingredients: Array.isArray(item.ingredients) ? item.ingredients : [],

    // Retain database metadata for full compatibility
    item_id: item.item_id !== undefined ? item.item_id : Number(item.id) || null,
    category_id: item.category_id || null,
    category_slug: item.category_slug || '',
    prep_time_minutes: prepMinutes,
    is_special: Boolean(item.is_special),
    special_badge: item.special_badge || null,
    image_url: item.image_url || item.image || '',
    is_available: typeof item.is_available === 'boolean'
      ? item.is_available
      : (item.isAvailable !== undefined ? Boolean(item.isAvailable) : true),
  };
}

/**
 * Normalizes an array of food item entities.
 * 
 * @param {Array} items - Array of raw food items
 * @returns {Array} Array of normalized food items
 */
export function mapFoodItems(items) {
  if (!Array.isArray(items)) return [];
  return items.map(mapFoodItem).filter(Boolean);
}

/**
 * -----------------------------------------------------------------------------
 * 4. FOOD ORDERING API ENDPOINTS
 * -----------------------------------------------------------------------------
 */

/**
 * Retrieves all active food categories.
 * Endpoint: GET /api/food/categories
 * 
 * @param {Object} [options={}]
 * @param {boolean} [options.all=false] - If true, includes inactive categories
 * @returns {Promise<Array<{ category_id: number, name: string, slug: string, description: string, display_order: number }>>}
 */
export async function getCategories({ all = false } = {}) {
  const url = buildUrl('/categories', all ? { all: 'true' } : {});
  const json = await request(url, { method: 'GET' });
  return Array.isArray(json?.data) ? json.data : [];
}

/**
 * Retrieves active daily specials currently within their active time window.
 * Endpoint: GET /api/food/specials
 * 
 * @param {string} [categorySlug] - Optional category slug filter (e.g. 'dinner', 'drinks')
 * @returns {Promise<Array>} Normalized specials items ready for FoodMenuScreen carousel
 */
export async function getDailySpecials(categorySlug) {
  const params = {};
  if (categorySlug && categorySlug !== 'All' && categorySlug !== 'all') {
    params.category_slug = categorySlug;
  }

  const url = buildUrl('/specials', params);
  const json = await request(url, { method: 'GET' });
  const rawItems = Array.isArray(json?.data) ? json.data : [];
  return mapFoodItems(rawItems);
}

/**
 * Retrieves list of food items with optional filtering by category and availability.
 * Endpoint: GET /api/food/items
 * 
 * @param {Object} [filters={}]
 * @param {string} [filters.categorySlug] - Optional category slug to filter by
 * @param {string} [filters.available='all'] - 'all' (default), 'true', or 'false'
 * @param {string} [filters.search] - Optional text search keyword
 * @returns {Promise<Array>} Normalized food items ready for FoodMenuScreen grid
 */
export async function getFoodItems({ categorySlug, available = 'all', search } = {}) {
  const params = {
    available: available || 'all',
  };

  if (categorySlug && categorySlug !== 'All' && categorySlug !== 'all') {
    params.category_slug = categorySlug;
  }

  if (search && typeof search === 'string' && search.trim().length > 0) {
    params.search = search.trim();
  }

  const url = buildUrl('/items', params);
  const json = await request(url, { method: 'GET' });
  const rawItems = Array.isArray(json?.data) ? json.data : [];
  return mapFoodItems(rawItems);
}

/**
 * Retrieves single food item by primary key item_id.
 * Endpoint: GET /api/food/items/:id
 * 
 * @param {number|string} id - Food item ID
 * @returns {Promise<Object>} Normalized food item details
 */
export async function getFoodItemById(id) {
  if (!id) {
    throw new Error('Food item ID is required to fetch item details.');
  }

  const cleanId = encodeURIComponent(String(id).trim());
  const url = buildUrl(`/items/${cleanId}`);
  const json = await request(url, { method: 'GET' });

  if (!json?.data) {
    throw new Error(`Food item with ID ${id} not found.`);
  }

  return mapFoodItem(json.data);
}

/**
 * Places an in-room dining order with verified room destination and line items.
 * Endpoint: POST /api/food/orders
 * 
 * Never sends prices, subtotals, service charges, or totals from the mobile client.
 * The backend calculates all monetary totals authoritatively from PostgreSQL.
 *
 * @param {Object} orderData
 * @param {string} orderData.room_number - Verified room number (e.g. 'Room 3')
 * @param {string} orderData.room_name - Verified room name (e.g. 'Uva Valley View Room — Room 3')
 * @param {string} [orderData.special_note] - Optional dietary or delivery notes
 * @param {Array<Object>} orderData.items - Array of items (e.g. [{ item_id: 6, quantity: 1 }])
 * @returns {Promise<Object>} Created order data from backend
 */
export async function createOrder(orderData) {
  if (!orderData || typeof orderData !== 'object') {
    throw new Error('Order data is required to place an order.');
  }

  const { room_number, room_name, special_note, items } = orderData;

  if (!room_number || !String(room_number).trim()) {
    throw new Error('Please select an assigned guest room before placing your order.');
  }

  if (!room_name || !String(room_name).trim()) {
    throw new Error('Room name is required to place your order.');
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Your food tray is empty. Add at least one dish before ordering.');
  }

  // Sanitize line items: strictly send only item_id and quantity (never send client prices or totals)
  const sanitizedItems = items.map((line, index) => {
    if (!line || typeof line !== 'object') {
      throw new Error(`Invalid item format at line ${index + 1}.`);
    }

    const rawId =
      line.item_id !== undefined
        ? line.item_id
        : line.item?.item_id !== undefined
        ? line.item.item_id
        : line.item?.id !== undefined
        ? line.item.id
        : line.id;

    const parsedId = Number(rawId);
    if (!rawId || !/^\d+$/.test(String(rawId).trim()) || !Number.isInteger(parsedId) || parsedId <= 0) {
      throw new Error(`Invalid item_id at line ${index + 1}. Item ID must be a positive integer.`);
    }

    const rawQty = line.quantity !== undefined ? line.quantity : line.qty;
    const parsedQty = Number(rawQty);
    if (
      rawQty === undefined ||
      rawQty === null ||
      !/^\d+$/.test(String(rawQty).trim()) ||
      !Number.isInteger(parsedQty) ||
      parsedQty < 1
    ) {
      throw new Error(`Invalid quantity for item ${parsedId}. Quantity must be at least 1.`);
    }

    return {
      item_id: parsedId,
      quantity: parsedQty,
    };
  });

  const payload = {
    room_number: String(room_number).trim(),
    room_name: String(room_name).trim(),
    items: sanitizedItems,
  };

  if (special_note !== undefined && special_note !== null) {
    const trimmedNote = String(special_note).trim();
    if (trimmedNote.length > 0) {
      payload.special_note = trimmedNote;
    }
  }

  const url = buildUrl('/orders');
  const json = await request(url, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (!json?.data) {
    throw new Error('Invalid server response: Created order data was not returned.');
  }

  return json.data;
}

/**
 * Default export consolidating all Food Ordering API client functions
 */
export default {
  USE_PHYSICAL_DEVICE,
  DEV_MACHINE_LAN_IP,
  BACKEND_PORT,
  DEFAULT_TIMEOUT_MS,
  getBaseUrl,
  buildUrl,
  mapFoodItem,
  mapFoodItems,
  getCategories,
  getDailySpecials,
  getFoodItems,
  getFoodItemById,
  createOrder,
};
