const Expense = require('../models/Expense');
const User = require('../models/User');
const Tenant = require('../models/Tenant');
const { asyncHandler } = require('../middleware/errorHandler');
const { 
  generateExpenseReportPDF,
  generateExpenseSummaryPDF 
} = require('../services/pdfService');
const { 
  generateExpenseExcel,
  generateSimpleExpenseExcel 
} = require('../services/excelService');
const mongoose = require('mongoose');

/**
 * Download single expense report PDF
 * GET /api/reports/expense/:expenseId
 */
const downloadExpenseReport = asyncHandler(async (req, res) => {
  const { expenseId } = req.params;
  const tenantId = req.tenantId;
  const userId = req.userId;
  const userRole = req.role;

  const expense = await Expense.findOne({ _id: expenseId, tenantId })
    .populate('userId', 'firstName lastName email')
    .populate('reviewerId', 'firstName lastName email');

  if (!expense) {
    return res.status(404).json({
      success: false,
      message: 'Expense not found'
    });
  }

  // Authorization check
  if (userRole === 'employee' && expense.userId._id.toString() !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only download your own expense reports.'
    });
  }

  if (userRole === 'manager') {
    const isOwnExpense = expense.userId._id.toString() === userId;
    const isTeamExpense = expense.reviewerId && expense.reviewerId._id.toString() === userId;

    if (!isOwnExpense && !isTeamExpense) {
      return res.status(403).json({
        success: false,
        message: 'Access denied.'
      });
    }
  }

  // Get tenant info
  const tenant = await Tenant.findById(tenantId);

  // Generate PDF
  const pdf = await generateExpenseReportPDF(expense, expense.userId, tenant);

  // Set response headers
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=expense-${expenseId}.pdf`);
  res.setHeader('Content-Length', pdf.length);

  // Send PDF
  res.send(pdf);
});

/**
 * Download expense summary report PDF
 * GET /api/reports/summary
 * Query params: startDate, endDate, status, category
 */
const downloadSummaryReport = asyncHandler(async (req, res) => {
  const tenantId = new mongoose.Types.ObjectId(req.tenantId);
  const userId = req.userId;
  const userRole = req.role;

  // Build query filters
  const filters = { tenantId };

  // Role-based filtering
  if (userRole === 'employee') {
    filters.userId = new mongoose.Types.ObjectId(userId);
  } else if (userRole === 'manager') {
    filters.$or = [
      { userId: new mongoose.Types.ObjectId(userId) },
      { reviewerId: new mongoose.Types.ObjectId(userId) }
    ];
  }

  // Date range
  const startDate = req.query.startDate 
    ? new Date(req.query.startDate)
    : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  
  const endDate = req.query.endDate
    ? new Date(req.query.endDate)
    : new Date();

  filters.expenseDate = { $gte: startDate, $lte: endDate };

  // Additional filters
  if (req.query.status) {
    filters.status = req.query.status;
  }

  if (req.query.category) {
    filters.category = req.query.category;
  }

  // Fetch expenses
  const expenses = await Expense.aggregate([
    { $match: filters },
    { $sort: { expenseDate: -1 } },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } }
  ]);

  if (expenses.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'No expenses found for the specified criteria'
    });
  }

  // Get user and tenant info
  const user = await User.findById(userId);
  const tenant = await Tenant.findById(req.tenantId);

  const dateRange = {
    start: startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    end: endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  };

  // Generate PDF
  const pdf = await generateExpenseSummaryPDF(expenses, user, tenant, dateRange);

  // Set response headers
  const filename = `expense-summary-${startDate.toISOString().split('T')[0]}-${endDate.toISOString().split('T')[0]}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  res.setHeader('Content-Length', pdf.length);

  // Send PDF
  res.send(pdf);
});

/**
 * Download expenses as Excel
 * GET /api/reports/excel
 */
const downloadExpenseExcel = asyncHandler(async (req, res) => {
  const tenantId = new mongoose.Types.ObjectId(req.tenantId);
  const userId = req.userId;
  const userRole = req.role;

  // Build query filters (same as getAllExpenses)
  const filters = { tenantId };

  // Role-based filtering
  if (userRole === 'employee') {
    filters.userId = new mongoose.Types.ObjectId(userId);
  } else if (userRole === 'manager') {
    filters.$or = [
      { userId: new mongoose.Types.ObjectId(userId) },
      { reviewerId: new mongoose.Types.ObjectId(userId) }
    ];
  }

  // Query parameter filters
  if (req.query.status) {
    filters.status = req.query.status;
  }

  if (req.query.category) {
    filters.category = req.query.category;
  }

  if (req.query.startDate && req.query.endDate) {
    filters.expenseDate = {
      $gte: new Date(req.query.startDate),
      $lte: new Date(req.query.endDate)
    };
  }

  // Fetch expenses with populated fields
  const expenses = await Expense.aggregate([
    { $match: filters },
    { $sort: { expenseDate: -1 } },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'reviewerId',
        foreignField: '_id',
        as: 'reviewer'
      }
    },
    { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
    { $unwind: { path: '$reviewer', preserveNullAndEmptyArrays: true } }
  ]);

  if (expenses.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'No expenses found for export'
    });
  }

  // Calculate summary statistics
  const summary = {
    totalAmount: expenses.reduce((sum, exp) => sum + exp.amount, 0),
    averageAmount: expenses.reduce((sum, exp) => sum + exp.amount, 0) / expenses.length,
    byStatus: expenses.reduce((acc, exp) => {
      if (!acc[exp.status]) {
        acc[exp.status] = { count: 0, amount: 0 };
      }
      acc[exp.status].count++;
      acc[exp.status].amount += exp.amount;
      return acc;
    }, {}),
    byCategory: expenses.reduce((acc, exp) => {
      if (!acc[exp.category]) {
        acc[exp.category] = { count: 0, amount: 0 };
      }
      acc[exp.category].count++;
      acc[exp.category].amount += exp.amount;
      return acc;
    }, {})
  };

  // Generate Excel
  const buffer = req.query.simple === 'true' 
    ? generateSimpleExpenseExcel(expenses)
    : generateExpenseExcel(expenses, summary);

  // Generate filename with date range or current date
  const dateStr = req.query.startDate && req.query.endDate
    ? `${req.query.startDate}_to_${req.query.endDate}`
    : new Date().toISOString().split('T')[0];
  
  const filename = `expenses_${dateStr}.xlsx`;

  // Set response headers
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length', buffer.length);

  // Send Excel file
  res.send(buffer);
});

// Export the new function
module.exports = {
  downloadExpenseReport,
  downloadSummaryReport,
  downloadExpenseExcel 
};
