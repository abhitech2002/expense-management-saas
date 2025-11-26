import api from './api';

const authService = {
  /**
   * Register new tenant with first admin user
   */
  register: async (data) => {
    const response = await api.post('/auth/register', data);
    return response.data.data;
  },

  /**
   * Login user
   */
  login: async (email, password, subdomain) => {
    const response = await api.post('/auth/login', {
      email,
      password,
      subdomain
    });
    return response.data.data;
  },

  /**
   * Logout user
   */
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  /**
   * Get current user profile
   */
  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data.data;
  },

  /**
   * Refresh access token
   */
  refreshToken: async (refreshToken) => {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data.data;
  },
};

export default authService;
