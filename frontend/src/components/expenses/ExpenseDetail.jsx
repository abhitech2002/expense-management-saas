// ==========================================
// frontend/src/components/expenses/ExpenseDetail.jsx
// ==========================================

import { useState } from 'react';
import { X, Download, CheckCircle, XCircle, FileText, Calendar, DollarSign, Tag, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import expenseService from '../../services/expenseService';
import { 
  formatCurrency, 
  formatDate, 
  formatDateTime,
  getStatusColor, 
  capitalize 
} from '../../utils/helpers';
import toast from 'react-hot-toast';

function ExpenseDetail({ expense, onClose, onRefresh }) {
  const { user, isAdmin, isManager } = useAuth();
  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [approvalAction, setApprovalAction] = useState(null); // 'approve' or 'reject'
  const [approvalNotes, setApprovalNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const canApprove = () => {
    if (expense.status !== 'pending') return false;
    if (isAdmin()) return true;
    if (isManager() && expense.reviewerId?._id === user._id) return true;
    return false;
  };

  const handleApproval = async (action) => {
    if (action === 'reject' && !approvalNotes.trim()) {
      toast.error('Rejection notes are required');
      return;
    }

    setLoading(true);

    try {
      if (action === 'approve') {
        await expenseService.approveExpense(expense._id, approvalNotes);
        toast.success('Expense approved successfully');
      } else {
        await expenseService.rejectExpense(expense._id, approvalNotes);
        toast.success('Expense rejected');
      }
      
      onRefresh();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${action} expense`);
    } finally {
      setLoading(false);
    }
  };

  const openReceiptInNewTab = () => {
    if (expense.receipt?.url) {
      window.open(expense.receipt.url, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{expense.title}</h2>
            <span className={`inline-block mt-2 ${getStatusColor(expense.status)}`}>
              {capitalize(expense.status)}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Amount and Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(expense.amount, expense.currency)}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Tag className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Category</p>
                <p className="text-lg font-semibold text-gray-900">
                  {expense.category}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          {expense.description && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
              <p className="text-gray-900">{expense.description}</p>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Expense Date */}
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Expense Date</p>
                <p className="font-medium text-gray-900">
                  {formatDate(expense.expenseDate)}
                </p>
              </div>
            </div>

            {/* Submitted By */}
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Submitted By</p>
                <p className="font-medium text-gray-900">
                  {expense.user?.firstName} {expense.user?.lastName}
                </p>
              </div>
            </div>

            {/* Merchant */}
            {expense.merchant && (
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Tag className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Merchant</p>
                  <p className="font-medium text-gray-900">{expense.merchant}</p>
                </div>
              </div>
            )}

            {/* Project */}
            {expense.project && (
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <FileText className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Project</p>
                  <p className="font-medium text-gray-900">{expense.project}</p>
                </div>
              </div>
            )}
          </div>

          {/* Receipt */}
          {expense.receipt?.url && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Receipt</h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                {expense.receipt.url.endsWith('.pdf') ? (
                  <div className="p-6 text-center bg-gray-50">
                    <FileText className="w-16 h-16 text-red-600 mx-auto mb-3" />
                    <p className="text-gray-700 mb-4">PDF Receipt</p>
                    <button
                      onClick={openReceiptInNewTab}
                      className="btn-primary inline-flex items-center"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      View PDF
                    </button>
                  </div>
                ) : (
                  <div>
                    <img
                      src={expense.receipt.url}
                      alt="Receipt"
                      className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={openReceiptInNewTab}
                    />
                    <div className="p-3 bg-gray-50 text-center">
                      <button
                        onClick={openReceiptInNewTab}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        Click to view full size
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Review Information */}
          {expense.status !== 'pending' && expense.reviewerId && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Review Details</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Reviewed By:</span>
                  <span className="font-medium text-gray-900">
                    {expense.reviewerId.firstName} {expense.reviewerId.lastName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Reviewed At:</span>
                  <span className="font-medium text-gray-900">
                    {formatDateTime(expense.reviewedAt)}
                  </span>
                </div>
                {expense.reviewNotes && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Notes:</p>
                    <p className="text-gray-900">{expense.reviewNotes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Approval Actions */}
          {canApprove() && !showApprovalForm && (
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setApprovalAction('reject');
                    setShowApprovalForm(true);
                  }}
                  className="btn-danger flex items-center"
                >
                  <XCircle className="w-5 h-5 mr-2" />
                  Reject
                </button>
                <button
                  onClick={() => {
                    setApprovalAction('approve');
                    setShowApprovalForm(true);
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Approve
                </button>
              </div>
            </div>
          )}

          {/* Approval Form */}
          {showApprovalForm && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {approvalAction === 'approve' ? 'Approve' : 'Reject'} Expense
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes {approvalAction === 'reject' && '*'}
                  </label>
                  <textarea
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    placeholder={
                      approvalAction === 'approve'
                        ? 'Optional: Add approval notes...'
                        : 'Required: Explain reason for rejection...'
                    }
                    rows="3"
                    className="input-field"
                  />
                </div>
                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowApprovalForm(false);
                      setApprovalAction(null);
                      setApprovalNotes('');
                    }}
                    className="btn-secondary"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleApproval(approvalAction)}
                    className={
                      approvalAction === 'approve'
                        ? 'bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium'
                        : 'btn-danger'
                    }
                    disabled={loading}
                  >
                    {loading 
                      ? 'Processing...' 
                      : approvalAction === 'approve' 
                        ? 'Confirm Approval' 
                        : 'Confirm Rejection'
                    }
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ExpenseDetail;

