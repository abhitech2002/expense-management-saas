import { Navigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';

/**
 * Protected Route Component
 * Redirects to login if not authenticated
 * Optionally checks for specific roles
 */
function ProtectedRoute({ children, roles = [] }) {
  const { user, loading, hasRole } = useAuth();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check role if specified
  if (roles.length > 0 && !hasRole(roles)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card max-w-md text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You don't have permission to access this page.
          </p>
          <Navigate to="/dashboard" replace />
        </div>
      </div>
    );
  }

  // Authenticated and authorized - render children
  return children;
}

export default ProtectedRoute;
