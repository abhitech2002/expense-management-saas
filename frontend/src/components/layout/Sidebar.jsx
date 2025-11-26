import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Receipt,
  BarChart3,
  Settings,
  Shield
} from 'lucide-react';
import { useAuth } from '../../Context/AuthContext';

function Sidebar({ open }) {
  const { isAdmin, isManager } = useAuth();

  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'manager', 'employee']
    },
    {
      name: 'Users',
      path: '/users',
      icon: Users,
      roles: ['admin', 'manager']
    },
    {
      name: 'Expenses',
      path: '/expenses',
      icon: Receipt,
      roles: ['admin', 'manager', 'employee']
    },
    {
      name: 'Reports',
      path: '/reports',
      icon: BarChart3,
      roles: ['admin', 'manager']
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: Settings,
      roles: ['admin']
    },
    {
      name: 'Admin Panel',
      path: '/admin',
      icon: Shield,
      roles: ['admin']
    }
  ];

  const canAccessRoute = (roles) => {
    if (roles.includes('admin') && isAdmin()) return true;
    if (roles.includes('manager') && (isManager() || isAdmin())) return true;
    if (roles.includes('employee')) return true;
    return false;
  };

  if (!open) return null;

  return (
    <aside className="fixed left-0 top-16 w-64 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 overflow-y-auto">
      <nav className="p-4 space-y-2">
        {navItems.map((item) => {
          if (!canAccessRoute(item.roles)) return null;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}

export default Sidebar;
