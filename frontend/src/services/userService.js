import api from './api';

const userService = {
  /**
   * Get all users with optional filters
   */
  getAllUsers: async (params = {}) => {
    const response = await api.get('/users', { params });
    return response.data.data;
  },

  /**
   * Get single user by ID
   */
  getUserById: async (userId) => {
    const response = await api.get(`/users/${userId}`);
    return response.data.data;
  },

  /**
   * Create new user
   */
  createUser: async (userData) => {
    const response = await api.post('/users', userData);
    return response.data.data;
  },

  /**
   * Update user
   */
  updateUser: async (userId, userData) => {
    const response = await api.put(`/users/${userId}`, userData);
    return response.data.data;
  },

  /**
   * Delete user
   */
  deleteUser: async (userId) => {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  },

  /**
   * Get user statistics (admin only)
   */
  getUserStats: async () => {
    const response = await api.get('/users/stats');
    return response.data.data;
  },

  /**
   * Get list of managers for dropdown
   */
  getManagers: async () => {
    const response = await api.get('/users/managers');
    return response.data.data;
  },

  /**
   * Change user password
   */
  changePassword: async (userId, passwordData) => {
    const response = await api.put(`/users/${userId}/password`, passwordData);
    return response.data;
  },
};

export default userService;
