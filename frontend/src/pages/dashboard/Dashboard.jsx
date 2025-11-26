import { useAuth } from '../../Context/AuthContext';
import { Users, Receipt, Clock, TrendingUp } from 'lucide-react';

function Dashboard() {
  const { user, tenant } = useAuth();

  const stats = [
    {
      name: 'Total Expenses',
      value: '$12,450',
      change: '+12%',
      icon: Receipt,
      color: 'bg-blue-500'
    },
    {
      name: 'Pending Approvals',
      value: '8',
      change: '-5%',
      icon: Clock,
      color: 'bg-yellow-500'
    },
    {
      name: 'Team Members',
      value: '24',
      change: '+3',
      icon: Users,
      color: 'bg-green-500'
    },
    {
      name: 'This Month',
      value: '$3,240',
      change: '+8%',
      icon: TrendingUp,
      color: 'bg-purple-500'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-gray-600 mt-1">
          Here's what's happening with your expenses today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stat.value}
                </p>
                <p className="text-sm text-green-600 mt-1">{stat.change} from last month</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Recent Activity
        </h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Expense submitted</p>
                  <p className="text-sm text-gray-600">Office supplies - $124.50</p>
                </div>
              </div>
              <p className="text-sm text-gray-500">2 hours ago</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button className="card hover:shadow-lg transition-shadow text-left">
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
            <Receipt className="w-6 h-6 text-primary-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Submit Expense</h3>
          <p className="text-sm text-gray-600">Create a new expense report</p>
        </button>

        <button className="card hover:shadow-lg transition-shadow text-left">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <Clock className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">View Pending</h3>
          <p className="text-sm text-gray-600">Review pending approvals</p>
        </button>

        <button className="card hover:shadow-lg transition-shadow text-left">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
            <TrendingUp className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">View Reports</h3>
          <p className="text-sm text-gray-600">Analyze expense trends</p>
        </button>
      </div>
    </div>
  );
}

export default Dashboard;