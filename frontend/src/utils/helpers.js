/**
 * Format date to readable string
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Format date and time
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Get badge color based on status
 */
export const getStatusColor = (status) => {
  const colors = {
    active: 'badge-success',
    inactive: 'badge-danger',
    suspended: 'badge-warning',
    pending: 'badge-warning',
    approved: 'badge-success',
    rejected: 'badge-danger',
    trial: 'badge-info',
  };
  return colors[status.toLowerCase()] || 'badge-info';
};

/**
 * Get role badge color
 */
export const getRoleColor = (role) => {
  const colors = {
    admin: 'badge-danger',
    manager: 'badge-warning',
    employee: 'badge-info',
  };
  return colors[role.toLowerCase()] || 'badge-info';
};

/**
 * Capitalize first letter
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Truncate text with ellipsis
 */
export const truncate = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Format phone number
 */
export const formatPhone = (phone) => {
  if (!phone) return 'N/A';
  // Simple US format: (123) 456-7890
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

/**
 * Get initials from name
 */
export const getInitials = (firstName, lastName) => {
  if (!firstName && !lastName) return 'U';
  return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
};

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
export const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Handle API error and return user-friendly message
 */
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error
    return error.response.data?.message || 'An error occurred';
  } else if (error.request) {
    // Request sent but no response
    return 'Network error. Please check your connection.';
  } else {
    // Request setup error
    return error.message || 'An unexpected error occurred';
  }
};

/**
 * Debounce function (useful for search inputs)
 */
export const debounce = (func, wait = 300) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};