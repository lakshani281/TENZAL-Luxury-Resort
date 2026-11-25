import api from './client';

export const aboutApi = {
  // Public get resort story
  getAboutContent: async () => {
    const res = await api.get('/about');
    return res.data.data;
  },

  // Admin update resort story
  updateAboutContent: async (data) => {
    const res = await api.put('/about', data);
    return res.data.data;
  },
};

export default aboutApi;
