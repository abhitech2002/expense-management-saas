import api from './api';

const reportService = {
  /**
   * Download filtered expense summary report as PDF (blob)
   * @param {Object} params - Query params: startDate, endDate, status, category
   * @returns {Promise<AxiosResponse>} - Axios response containing blob data
   */
  downloadSummary: async (params = {}) => {
    const response = await api.get('/reports/summary', {
      params,
      responseType: 'blob'
    });

    return response;
  },

  /**
   * Download single expense report as PDF (blob)
   * @param {string} expenseId
   * @returns {Promise<AxiosResponse>} - Axios response containing blob data
   */
  downloadExpenseReport: async (expenseId) => {
    const response = await api.get(`/reports/expense/${expenseId}`, {
      responseType: 'blob'
    });

    return response;
  }
,

  /**
   * Download expenses as Excel (.xlsx)
   * @param {Object} params - Query params: startDate, endDate, status, category
   * @param {boolean} simple - If true, generate a simplified Excel file (no summary)
   * @returns {Promise<AxiosResponse>} - Axios response containing blob data
   */
  downloadExcel: async (params = {}, simple = false) => {
    const query = { ...params };
    if (simple) query.simple = true;

    const response = await api.get('/reports/excel', {
      params: query,
      responseType: 'blob'
    });

    return response;
  }
};

export default reportService;
