/**
 * =============================================================================
 * TENZAL Luxury Resort - Food Ordering Module (Student ID: 22CIS0328)
 * Service: Mobile Authentication & Session Storage
 * File: mobile/services/authStorage.js
 * =============================================================================
 * Manages guest authentication tokens and profile sessions for mobile.
 *
 * STORAGE STRATEGY:
 * - AsyncStorage on native iOS/Android devices.
 * - window.localStorage on Web with SSR safety checks.
 * - Fallback in-memory session for test / headless environments.
 *
 * SAFETY & COLLABORATION GUARANTEE:
 * - Login / logout strictly clears ONLY authentication keys (@tenzal_auth_token,
 *   @tenzal_auth_user).
 * - CRITICAL: NEVER deletes or resets @tenzal_food_orders (local device receipts).
 * - Local order receipts persist independently of authentication status.
 * =============================================================================
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBackendOrigin } from './foodApi';

const TOKEN_KEY = '@tenzal_auth_token';
const USER_KEY = '@tenzal_auth_user';

// Ephemeral runtime fallback for session persistence in memory
let runtimeToken = null;
let runtimeUser = null;

/**
 * Checks if browser localStorage is available in Web environment.
 */
function isLocalStorageAvailable() {
  try {
    return (
      Platform.OS === 'web' &&
      typeof window !== 'undefined' &&
      typeof window.localStorage !== 'undefined' &&
      window.localStorage !== null
    );
  } catch {
    return false;
  }
}

/**
 * Retrieve the active JWT authentication token.
 * Checks web localStorage aliases ('tenzal_token') for cross-admin compatibility.
 *
 * @returns {Promise<string|null>}
 */
export async function getAuthToken() {
  try {
    if (isLocalStorageAvailable()) {
      const webToken =
        window.localStorage.getItem(TOKEN_KEY) ||
        window.localStorage.getItem('tenzal_token');
      if (webToken) return webToken;
    }

    const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
    if (storedToken) return storedToken;

    return runtimeToken;
  } catch (err) {
    console.warn('[authStorage] Failed to read auth token from storage:', err.message || err);
    return runtimeToken;
  }
}

/**
 * Retrieve the currently authenticated user profile.
 *
 * @returns {Promise<Object|null>}
 */
export async function getAuthUser() {
  try {
    let jsonStr = null;

    if (isLocalStorageAvailable()) {
      jsonStr =
        window.localStorage.getItem(USER_KEY) ||
        window.localStorage.getItem('tenzal_user');
    }

    if (!jsonStr) {
      jsonStr = await AsyncStorage.getItem(USER_KEY);
    }

    if (jsonStr) {
      return JSON.parse(jsonStr);
    }

    return runtimeUser;
  } catch (err) {
    console.warn('[authStorage] Failed to read auth user from storage:', err.message || err);
    return runtimeUser;
  }
}

/**
 * Store authenticated session tokens and user profile.
 *
 * @param {string} token - Signed JWT bearer token
 * @param {Object} user - User profile object ({ id, name, email, role, ... })
 * @returns {Promise<void>}
 */
export async function setAuthSession(token, user) {
  try {
    runtimeToken = token;
    runtimeUser = user;

    const userStr = JSON.stringify(user || {});

    if (isLocalStorageAvailable()) {
      window.localStorage.setItem(TOKEN_KEY, token);
      window.localStorage.setItem(USER_KEY, userStr);
      window.localStorage.setItem('tenzal_token', token);
      window.localStorage.setItem('tenzal_user', userStr);
    }

    await AsyncStorage.setItem(TOKEN_KEY, token);
    await AsyncStorage.setItem(USER_KEY, userStr);
  } catch (err) {
    console.warn('[authStorage] Failed to write auth session to storage:', err.message || err);
  }
}

/**
 * Clear the current authenticated session.
 *
 * STRICT SAFETY RULE:
 * Clears ONLY token and user keys.
 * NEVER deletes or touches @tenzal_food_orders (local device receipts)!
 *
 * @returns {Promise<void>}
 */
export async function clearAuthSession() {
  try {
    runtimeToken = null;
    runtimeUser = null;

    if (isLocalStorageAvailable()) {
      window.localStorage.removeItem(TOKEN_KEY);
      window.localStorage.removeItem(USER_KEY);
      window.localStorage.removeItem('tenzal_token');
      window.localStorage.removeItem('tenzal_user');
    }

    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
  } catch (err) {
    console.warn('[authStorage] Failed to clear auth session:', err.message || err);
  }
}

/**
 * Check if a JWT token is expired by parsing its standard `exp` claim.
 *
 * @param {string} token
 * @returns {boolean} True if expired or malformed; false if still valid.
 */
export function isTokenExpired(token) {
  if (!token || typeof token !== 'string') return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (!payload.exp) return false;
    const nowSec = Math.floor(Date.now() / 1000);
    return payload.exp < nowSec;
  } catch {
    return true;
  }
}

/**
 * Authenticate guest credentials with the backend User Management API.
 * POST /api/auth/login
 *
 * @param {Object} credentials
 * @param {string} credentials.email
 * @param {string} credentials.password
 * @returns {Promise<{ token: string, user: Object }>}
 */
export async function login({ email, password }) {
  const origin = getBackendOrigin();
  const url = `${origin}/api/auth/login`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  let body = null;
  try {
    body = await response.json();
  } catch {
    // Non-JSON response
  }

  if (!response.ok) {
    const msg = body?.message || `Login failed (HTTP ${response.status})`;
    const error = new Error(msg);
    error.status = response.status;
    error.data = body;
    throw error;
  }

  const token = body?.data?.token;
  const user = body?.data?.user;

  if (!token) {
    throw new Error('Authentication succeeded but token was not returned.');
  }

  await setAuthSession(token, user);
  return { token, user };
}

/**
 * Register a new guest account with the backend User Management API.
 * POST /api/auth/register
 *
 * @param {Object} registrationData
 * @param {string} registrationData.name
 * @param {string} registrationData.email
 * @param {string} registrationData.password
 * @param {string} [registrationData.phone]
 * @returns {Promise<{ token: string, user: Object }>}
 */
export async function register({ name, email, password, phone }) {
  const origin = getBackendOrigin();
  const url = `${origin}/api/auth/register`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      name,
      email,
      password,
      ...(phone ? { phone } : {}),
    }),
  });

  let body = null;
  try {
    body = await response.json();
  } catch {
    // Non-JSON response
  }

  if (!response.ok) {
    const validationMsg = Array.isArray(body?.errors) && body.errors.length > 0
      ? body.errors.join(' ')
      : null;
    const msg = validationMsg || body?.message || `Registration failed (HTTP ${response.status})`;
    const error = new Error(msg);
    error.status = response.status;
    error.data = body;
    throw error;
  }

  const token = body?.data?.token;
  const user = body?.data?.user;

  if (!token) {
    throw new Error('Registration succeeded but token was not returned.');
  }

  await setAuthSession(token, user);
  return { token, user };
}

/**
 * Logout the active guest session.
 * Notifies backend if possible and clears session tokens locally.
 * Preserves all local order receipts.
 *
 * @returns {Promise<void>}
 */
export async function logout() {
  try {
    const token = await getAuthToken();
    if (token) {
      const origin = getBackendOrigin();
      const url = `${origin}/api/auth/logout`;
      await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }).catch(() => {});
    }
  } finally {
    await clearAuthSession();
  }
}

export default {
  getAuthToken,
  getAuthUser,
  setAuthSession,
  clearAuthSession,
  isTokenExpired,
  login,
  register,
  logout,
};
