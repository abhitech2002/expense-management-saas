const express = require('express');
const router = express.Router();
const {
  createExpense,
  getAllExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  approveExpense,
  rejectExpense,
  getExpenseStats
} = require('../controllers/expense.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { upload } = require('../config/cloudinary');

// All routes require authentication
router.use(authenticate);

// Statistics endpoint (before /:expenseId to avoid route conflict)
router.get('/stats', getExpenseStats);

// Create expense with optional file upload
// 'receipt' is the field name in the form data
router.post('/', upload.single('receipt'), createExpense);

// Get all expenses (role-based filtering in controller)
router.get('/', getAllExpenses);

// Get single expense
router.get('/:expenseId', getExpenseById);

// Update expense with optional new receipt
router.put('/:expenseId', upload.single('receipt'), updateExpense);

// Delete expense
router.delete('/:expenseId', deleteExpense);

// Approve expense (Manager/Admin only)
router.post(
  '/:expenseId/approve',
  authorize(['admin', 'manager']),
  approveExpense
);

// Reject expense (Manager/Admin only)
router.post(
  '/:expenseId/reject',
  authorize(['admin', 'manager']),
  rejectExpense
);

module.exports = router;