import { createContext, useContext, useState, useEffect } from 'react';
import { setTokens, clearTokens, isAuthenticated } from '../services/api';
import authService from '../services/authService';
import toast from 'react-hot-toast';

// Create context
const AuthContext = createContext(null);

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    checkAuth();
  }, []);

  /**
   * Check authentication status
   * Try to get user profile if tokens exist
   */
  const checkAuth = async () => {
    try {
      if (isAuthenticated()) {
        const userData = await authService.getProfile();
        setUser(userData.user);
        // Note: tenant info should come from login response
        // For now, we'll get it from localStorage if saved during login
        const savedTenant = localStorage.getItem('tenant');
        if (savedTenant) {
          setTenant(JSON.parse(savedTenant));
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Token might be expired, clear everything
      clearTokens();
      setUser(null);
      setTenant(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Register new tenant
   */
  const register = async (data) => {
    try {
      setLoading(true);
      const response = await authService.register(data);
      
      const { user, tenant, tokens } = response;
      
      // Set tokens in api service
      setTokens(tokens.accessToken, tokens.refreshToken);
      
      // Update state
      setUser(user);
      setTenant(tenant);
      
      // Save tenant info to localStorage for persistence
      localStorage.setItem('tenant', JSON.stringify(tenant));
      
      toast.success('Registration successful!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Login user
   */
  const login = async (email, password, subdomain) => {
    try {
      setLoading(true);
      const response = await authService.login(email, password, subdomain);
      
      const { user, tenant, tokens } = response;
      
      // Set tokens in api service
      setTokens(tokens.accessToken, tokens.refreshToken);
      
      // Update state
      setUser(user);
      setTenant(tenant);
      
      // Save tenant info to localStorage for persistence
      localStorage.setItem('tenant', JSON.stringify(tenant));
      
      toast.success(`Welcome back, ${user.firstName}!`);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout user
   */
  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear tokens and state regardless of API call success
      clearTokens();
      setUser(null);
      setTenant(null);
      localStorage.removeItem('tenant');
      toast.success('Logged out successfully');
    }
  };

  /**
   * Update user profile in context
   */
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  /**
   * Check if user has specific role
   */
  const hasRole = (roles) => {
    if (!user) return false;
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  };

  /**
   * Check if user is admin
   */
  const isAdmin = () => hasRole('admin');

  /**
   * Check if user is manager
   */
  const isManager = () => hasRole('manager');

  /**
   * Check if user is employee
   */
  const isEmployee = () => hasRole('employee');

  const value = {
    user,
    tenant,
    loading,
    isAuthenticated: !!user,
    register,
    login,
    logout,
    updateUser,
    hasRole,
    isAdmin,
    isManager,
    isEmployee,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};