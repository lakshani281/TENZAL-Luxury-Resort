import api from './client';

export const userApi = {
  // Current user profile
  getProfile: async () => {
    const res = await api.get('/users/profile');
    return res.data.data;
  },

  updateProfile: async (profileData) => {
    const res = await api.put('/users/profile', profileData);
    return res.data.data;
  },

  // Admin user management
  getAllUsers: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.role) params.append('role', filters.role);
    if (filters.status) params.append('status', filters.status);

    const res = await api.get(`/users?${params.toString()}`);
    return res.data.data;
  },

  getUserById: async (id) => {
    const res = await api.get(`/users/${id}`);
    return res.data.data;
  },

  createUser: async (userData) => {
    const res = await api.post('/users', userData);
    return res.data.data;
  },

  updateUser: async (id, userData) => {
    const res = await api.put(`/users/${id}`, userData);
    return res.data.data;
  },

  updateUserRole: async (id, role) => {
    const res = await api.patch(`/users/${id}/role`, { role });
    return res.data.data;
  },

  updateUserStatus: async (id, is_active) => {
    const res = await api.patch(`/users/${id}/status`, { is_active });
    return res.data.data;
  },

  deleteUser: async (id) => {
    const res = await api.delete(`/users/${id}`);
    return res.data;
  },

  getRoles: async () => {
    const res = await api.get('/users/roles');
    return res.data.data;
  },
};

export default userApi;
