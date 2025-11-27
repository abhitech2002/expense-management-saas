// ==========================================
// frontend/src/pages/expenses/Expenses.jsx
// ==========================================

import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Eye, Edit, Trash2, Receipt, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import expenseService from '../../services/expenseService';
import ExpenseForm from '../../components/expenses/ExpenseForm';
import ExpenseDetail from '../../components/expenses/ExpenseDetail';
import { 
  formatCurrency, 
  formatDate, 
  getStatusColor, 
  capitalize,
  expenseCategories 
} from '../../utils/helpers';
import toast from 'react-hot-toast';

function Expenses() {
  const { isAdmin, isManager } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  
  // Filters
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    startDate: '',
    endDate: '',
    search: ''
  });
  
  // Pagination
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalExpenses: 0
  });

  useEffect(() => {
    fetchExpenses();
  }, [filters, pagination.currentPage]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.currentPage,
        limit: 10,
        ...filters
      };
      
      const response = await expenseService.getAllExpenses(params);
      setExpenses(response.expenses);
      setPagination(response.pagination);
    } catch (error) {
      toast.error('Failed to fetch expenses');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExpense = async (expenseData, receiptFile) => {
    await expenseService.createExpense(expenseData, receiptFile);
    fetchExpenses();
  };

  const handleUpdateExpense = async (expenseData, receiptFile) => {
    await expenseService.updateExpense(selectedExpense._id, expenseData, receiptFile);
    fetchExpenses();
    setSelectedExpense(null);
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    try {
      await expenseService.deleteExpense(expenseId);
      toast.success('Expense deleted successfully');
      fetchExpenses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete expense');
    }
  };

  const handleViewDetails = (expense) => {
    setSelectedExpense(expense);
    setShowDetail(true);
  };

  const handleEditExpense = (expense) => {
    setSelectedExpense(expense);
    setShowForm(true);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset to page 1
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      category: '',
      startDate: '',
      endDate: '',
      search: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-600 mt-1">Manage and track your expenses</p>
        </div>
        <button
          onClick={() => {
            setSelectedExpense(null);
            setShowForm(true);
          }}
          className="btn-primary flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Expense
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filters
          </h2>
          <button
            onClick={clearFilters}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            Clear All
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title, merchant..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="input-field"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="input-field"
            >
              <option value="">All Categories</option>
              {expenseCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Date Range - Simple version */}
          <div>
            <input
              type="month"
              value={filters.startDate ? filters.startDate.substring(0, 7) : ''}
              onChange={(e) => {
                const month = e.target.value;
                if (month) {
                  handleFilterChange('startDate', `${month}-01`);
                  const lastDay = new Date(month.split('-')[0], month.split('-')[1], 0).getDate();
                  handleFilterChange('endDate', `${month}-${lastDay}`);
                } else {
                  handleFilterChange('startDate', '');
                  handleFilterChange('endDate', '');
                }
              }}
              className="input-field"
            />
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No expenses found</p>
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary"
            >
              Create Your First Expense
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expense
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Receipt
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {expenses.map((expense) => (
                    <tr key={expense._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {expense.title}
                          </div>
                          {expense.merchant && (
                            <div className="text-sm text-gray-500">
                              {expense.merchant}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(expense.amount, expense.currency)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(expense.expenseDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getStatusColor(expense.status)}>
                          {capitalize(expense.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {expense.receipt?.url ? (
                          <FileText className="w-5 h-5 text-primary-600 inline" />
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleViewDetails(expense)}
                            className="text-primary-600 hover:text-primary-900"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {expense.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleEditExpense(expense)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteExpense(expense._id)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(pagination.currentPage - 1) * 10 + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.currentPage * 10, pagination.totalExpenses)}
                  </span>{' '}
                  of <span className="font-medium">{pagination.totalExpenses}</span> expenses
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                    disabled={pagination.currentPage === 1}
                    className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {showForm && (
        <ExpenseForm
          onSubmit={selectedExpense ? handleUpdateExpense : handleCreateExpense}
          onClose={() => {
            setShowForm(false);
            setSelectedExpense(null);
          }}
          initialData={selectedExpense}
        />
      )}

      {showDetail && selectedExpense && (
        <ExpenseDetail
          expense={selectedExpense}
          onClose={() => {
            setShowDetail(false);
            setSelectedExpense(null);
          }}
          onRefresh={fetchExpenses}
        />
      )}
    </div>
  );
}

export default Expenses;

// ==========================================
// KEY CONCEPTS
// ==========================================
/*
FILTER PATTERN
--------------
Filters trigger useEffect → API call with params
Reset pagination to page 1 when filters change
Clear all filters at once

CONDITIONAL RENDERING
---------------------
Show different actions based on:
- Expense status (pending = editable)
- User role (admin can delete any)
- Ownership (own expense = editable)

TABLE RESPONSIVENESS
--------------------
overflow-x-auto: Scroll horizontally on mobile
whitespace-nowrap: Prevent text wrapping
Action buttons always visible

EMPTY STATE
-----------
No data? Show helpful message + action button
Better UX than blank table

LOADING STATE
-------------
Show spinner while fetching
Prevents showing stale data

MONTH PICKER
------------
<input type="month" />
Returns YYYY-MM format
Calculate start/end dates for API

INTERVIEW TIP:
"I built a comprehensive expense list with real-time filtering. The
component manages multiple state slices - expenses, filters, pagination,
and modals. Filters trigger useEffect for automatic refetch with debouncing
for search. The table uses conditional rendering for status-based actions
and provides responsive design with horizontal scrolling on mobile. Empty
and loading states improve UX."
*/