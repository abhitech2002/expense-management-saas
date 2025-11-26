import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './Context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Dashboard Pages
import Dashboard from './pages/dashboard/Dashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';

// User Pages
import Users from './pages/users/Users';
import UserProfile from './pages/users/UserProfile';

// Layout Component
import Layout from './components/layout/Layout';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        {/* Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#fff',
              color: '#363636',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />

        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Default redirect to dashboard */}
            <Route index element={<Navigate to="/dashboard" replace />} />

            {/* Dashboard - All authenticated users */}
            <Route path="dashboard" element={<Dashboard />} />

            {/* Admin Dashboard - Admin only */}
            <Route
              path="admin"
              element={
                <ProtectedRoute roles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Users - Admin and Manager */}
            <Route
              path="users"
              element={
                <ProtectedRoute roles={['admin', 'manager']}>
                  <Users />
                </ProtectedRoute>
              }
            />

            {/* User Profile - All users can view their own */}
            <Route path="profile" element={<UserProfile />} />
          </Route>

          {/* 404 Not Found */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
