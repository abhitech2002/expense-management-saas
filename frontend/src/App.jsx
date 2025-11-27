// frontend/src/App.jsx (UPDATE - Add Expense Routes)
// ==========================================

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
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

// Expense Pages - NEW
import Expenses from './pages/expenses/Expenses';

// Layout Component
import Layout from './components/layout/Layout';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
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
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            
            <Route
              path="admin"
              element={
                <ProtectedRoute roles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="users"
              element={
                <ProtectedRoute roles={['admin', 'manager']}>
                  <Users />
                </ProtectedRoute>
              }
            />
            
            <Route path="profile" element={<UserProfile />} />
            
            {/* NEW: Expense Routes */}
            <Route path="expenses" element={<Expenses />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
