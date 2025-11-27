import api from './api';

const expenseService = {
  /**
   * Create new expense with optional file upload
   */
  createExpense: async (expenseData, receiptFile) => {
    // Use FormData for file upload
    const formData = new FormData();
    
    // Add all expense fields
    Object.keys(expenseData).forEach(key => {
      if (expenseData[key] !== null && expenseData[key] !== undefined) {
        formData.append(key, expenseData[key]);
      }
    });
    
    // Add receipt file if provided
    if (receiptFile) {
      formData.append('receipt', receiptFile);
    }
    
    const response = await api.post('/expenses', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data.data;
  },

  /**
   * Get all expenses with filters
   */
  getAllExpenses: async (params = {}) => {
    const response = await api.get('/expenses', { params });
    return response.data.data;
  },

  /**
   * Get single expense by ID
   */
  getExpenseById: async (expenseId) => {
    const response = await api.get(`/expenses/${expenseId}`);
    return response.data.data;
  },

  /**
   * Update expense
   */
  updateExpense: async (expenseId, expenseData, receiptFile) => {
    const formData = new FormData();
    
    Object.keys(expenseData).forEach(key => {
      if (expenseData[key] !== null && expenseData[key] !== undefined) {
        formData.append(key, expenseData[key]);
      }
    });
    
    if (receiptFile) {
      formData.append('receipt', receiptFile);
    }
    
    const response = await api.put(`/expenses/${expenseId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data.data;
  },

  /**
   * Delete expense
   */
  deleteExpense: async (expenseId) => {
    const response = await api.delete(`/expenses/${expenseId}`);
    return response.data;
  },

  /**
   * Approve expense (Manager/Admin)
   */
  approveExpense: async (expenseId, notes) => {
    const response = await api.post(`/expenses/${expenseId}/approve`, { notes });
    return response.data.data;
  },

  /**
   * Reject expense (Manager/Admin)
   */
  rejectExpense: async (expenseId, notes) => {
    const response = await api.post(`/expenses/${expenseId}/reject`, { notes });
    return response.data.data;
  },

  /**
   * Get expense statistics
   */
  getExpenseStats: async (params = {}) => {
    const response = await api.get('/expenses/stats', { params });
    return response.data.data;
  }
};

export default expenseService;
