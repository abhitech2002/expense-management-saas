import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Store for access token (in memory, lost on refresh)
let accessToken = null;

// Store for refresh token (could use httpOnly cookie in production)
let refreshToken = null;

/**
 * Set tokens after login
 */
export const setTokens = (access, refresh) => {
  accessToken = access;
  refreshToken = refresh;
};

/**
 * Get current access token
 */
export const getAccessToken = () => accessToken;

/**
 * Clear tokens on logout
 */
export const clearTokens = () => {
  accessToken = null;
  refreshToken = null;
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => !!accessToken;

// ==========================================
// REQUEST INTERCEPTOR
// Adds access token to every request
// ==========================================
api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ==========================================
// RESPONSE INTERCEPTOR
// Handles token expiration and auto-refresh
// ==========================================
api.interceptors.response.use(
  // Success response - pass through
  (response) => response,
  
  // Error response - handle token refresh
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh the access token
        if (refreshToken) {
          const response = await axios.post(
            `${api.defaults.baseURL}/auth/refresh`,
            { refreshToken }
          );

          const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data.tokens;

          // Update tokens
          setTokens(newAccessToken, newRefreshToken);

          // Update the failed request with new token
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          // Retry the original request
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - clear tokens and redirect to login
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
