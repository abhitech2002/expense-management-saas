import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import { LogIn, Building2 } from 'lucide-react';

function Login() {
  const navigate = useNavigate();
  const { login, loading } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    subdomain: ''
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    if (!formData.subdomain) {
      newErrors.subdomain = 'Company subdomain is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    const result = await login(formData.email, formData.password, formData.subdomain);

    if (result.success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-full mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Expense Manager</h1>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        {/* Login Form */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Subdomain */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Subdomain
              </label>
              <input
                type="text"
                name="subdomain"
                value={formData.subdomain}
                onChange={handleChange}
                placeholder="acme"
                className={`input-field ${errors.subdomain ? 'border-red-500' : ''}`}
                disabled={loading}
              />
              {errors.subdomain && (
                <p className="text-red-500 text-sm mt-1">{errors.subdomain}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                This is your company's unique identifier
              </p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@acme.com"
                className={`input-field ${errors.email ? 'border-red-500' : ''}`}
                disabled={loading}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className={`input-field ${errors.password ? 'border-red-500' : ''}`}
                disabled={loading}
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn-primary w-full flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
                Register your company
              </Link>
            </p>
          </div>
        </div>

        {/* Demo Credentials */}
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-800 font-medium mb-2">Demo Credentials:</p>
          <p className="text-xs text-blue-700">Subdomain: acme</p>
          <p className="text-xs text-blue-700">Email: john@acme.com</p>
          <p className="text-xs text-blue-700">Password: SecurePassword123</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
