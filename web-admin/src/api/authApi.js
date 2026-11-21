import api from './client';

export const authApi = {
  // Login with email and password
  login: async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    return res.data;
  },

  // Register new account
  register: async (userData) => {
    const res = await api.post('/auth/register', userData);
    return res.data;
  },

  // Logout session
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Continue even if network error
    } finally {
      localStorage.removeItem('tenzal_token');
      localStorage.removeItem('tenzal_user');
    }
  },

  // Get current authenticated user
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data.data;
  },

  // Refresh active token
  refresh: async () => {
    const res = await api.post('/auth/refresh');
    return res.data;
  },

  // Change password
  changePassword: async (passwords) => {
    const res = await api.put('/users/change-password', passwords);
    return res.data;
  },
};

export default authApi;
