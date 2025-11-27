const Expense = require('../models/Expense');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const { deleteFile } = require('../config/cloudinary');
const mongoose = require('mongoose');

/**
 * Create new expense
 * POST /api/expenses
 */
const createExpense = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    amount,
    currency,
    category,
    expenseDate,
    merchant,
    project,
    tags
  } = req.body;

  const tenantId = req.tenantId;
  const userId = req.userId;

  // Get user to find their manager
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Receipt file (if uploaded)
  const receipt = req.file ? {
    url: req.file.path, // Cloudinary URL
    publicId: req.file.filename, // Cloudinary public ID
    uploadedAt: new Date()
  } : {};

  // Create expense
  const expense = await Expense.create({
    tenantId,
    userId,
    title,
    description,
    amount,
    currency: currency || 'USD',
    category,
    expenseDate,
    receipt,
    merchant,
    project,
    tags: tags ? (Array.isArray(tags) ? tags : [tags]) : [],
    reviewerId: user.managerId, // Auto-assign to manager
    status: 'pending'
  });

  // Populate user and reviewer details
  const populatedExpense = await Expense.findById(expense._id)
    .populate('userId', 'firstName lastName email')
    .populate('reviewerId', 'firstName lastName email');

  res.status(201).json({
    success: true,
    message: 'Expense created successfully',
    data: { expense: populatedExpense }
  });
});

/**
 * Get all expenses (with filters and pagination)
 * GET /api/expenses
 */
const getAllExpenses = asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const userId = req.userId;
  const userRole = req.role;

    // Build query filters
  const filters = { tenantId: new mongoose.Types.ObjectId(tenantId) };

  // Role-based filtering
  if (userRole === 'employee') {
    // Employees see only their own expenses
    filters.userId = new mongoose.Types.ObjectId(userId);
  } else if (userRole === 'manager') {
    // Managers see their own + their team's expenses
    filters.$or = [
      { userId: new mongoose.Types.ObjectId(userId) }, // Own expenses
      { reviewerId: new mongoose.Types.ObjectId(userId) } // Team expenses
    ];
  }
  // Admin sees all (no additional filter)
  // Query parameter filters
  if (req.query.status) {
    filters.status = req.query.status;
  }

  if (req.query.category) {
    filters.category = req.query.category;
  }

  if (req.query.userId) {
    // Admin/Manager can filter by specific user
    if (userRole !== 'employee') {
      filters.userId = new mongoose.Types.ObjectId(req.query.userId);
    }
  }

  // Date range filter
  if (req.query.startDate && req.query.endDate) {
    filters.expenseDate = {
      $gte: new Date(req.query.startDate),
      $lte: new Date(req.query.endDate)
    };
  }

  // Search by title or description
  if (req.query.search) {
    filters.$or = [
      { title: new RegExp(req.query.search, 'i') },
      { description: new RegExp(req.query.search, 'i') },
      { merchant: new RegExp(req.query.search, 'i') }
    ];
  }

  // Pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Sort
  const sortBy = req.query.sortBy || 'createdAt';
  const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

  // Execute query with aggregation for better performance
  const expenses = await Expense.aggregate([
    { $match: filters },
    { $sort: { [sortBy]: sortOrder } },
    { $skip: skip },
    { $limit: limit },
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
    { $unwind: { path: '$reviewer', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        title: 1,
        description: 1,
        amount: 1,
        currency: 1,
        category: 1,
        expenseDate: 1,
        receipt: 1,
        status: 1,
        reviewedAt: 1,
        reviewNotes: 1,
        merchant: 1,
        project: 1,
        tags: 1,
        reimbursed: 1,
        createdAt: 1,
        updatedAt: 1,
        'user.firstName': 1,
        'user.lastName': 1,
        'user.email': 1,
        'reviewer.firstName': 1,
        'reviewer.lastName': 1,
        'reviewer.email': 1
      }
    }
  ]);
  // Get total count
  const totalExpenses = await Expense.countDocuments(filters);

  res.status(200).json({
    success: true,
    data: {
      expenses,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalExpenses / limit),
        totalExpenses,
        expensesPerPage: limit
      }
    }
  });
})


/**
 * Get single expense by ID
 * GET /api/expenses/:expenseId
 */
const getExpenseById = asyncHandler(async (req, res) => {
  const { expenseId } = req.params;
  const tenantId = req.tenantId;
  const userId = req.userId;
  const userRole = req.role;

  const expense = await Expense.findOne({ _id: expenseId, tenantId })
    .populate('userId', 'firstName lastName email department')
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
      message: 'Access denied. You can only view your own expenses.'
    });
  }

  if (userRole === 'manager') {
    const isOwnExpense = expense.userId._id.toString() === userId;
    const isTeamExpense = expense.reviewerId && expense.reviewerId._id.toString() === userId;

    if (!isOwnExpense && !isTeamExpense) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own or your team\'s expenses.'
      });
    }
  }

  res.status(200).json({
    success: true,
    data: { expense }
  });
});

/**
 * Update expense (only if pending)
 * PUT /api/expenses/:expenseId
 */
const updateExpense = asyncHandler(async (req, res) => {
  const { expenseId } = req.params;
  const tenantId = req.tenantId;
  const userId = req.userId;
  const userRole = req.role;

  const expense = await Expense.findOne({ _id: expenseId, tenantId });

  if (!expense) {
    return res.status(404).json({
      success: false,
      message: 'Expense not found'
    });
  }

  // Only owner can update their expense (unless admin)
  if (userRole !== 'admin' && expense.userId.toString() !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only update your own expenses.'
    });
  }

  // Can only update if pending
  if (expense.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: `Cannot update ${expense.status} expenses. Only pending expenses can be edited.`
    });
  }

  // Update fields
  const {
    title,
    description,
    amount,
    currency,
    category,
    expenseDate,
    merchant,
    project,
    tags
  } = req.body;

  if (title) expense.title = title;
  if (description !== undefined) expense.description = description;
  if (amount) expense.amount = amount;
  if (currency) expense.currency = currency;
  if (category) expense.category = category;
  if (expenseDate) expense.expenseDate = expenseDate;
  if (merchant !== undefined) expense.merchant = merchant;
  if (project !== undefined) expense.project = project;
  if (tags) expense.tags = Array.isArray(tags) ? tags : [tags];

  // Handle receipt update
  if (req.file) {
    // Delete old receipt if exists
    if (expense.receipt.publicId) {
      await deleteFile(expense.receipt.publicId);
    }

    expense.receipt = {
      url: req.file.path,
      publicId: req.file.filename,
      uploadedAt: new Date()
    };
  }

  await expense.save();

  const updatedExpense = await Expense.findById(expense._id)
    .populate('userId', 'firstName lastName email')
    .populate('reviewerId', 'firstName lastName email');

  res.status(200).json({
    success: true,
    message: 'Expense updated successfully',
    data: { expense: updatedExpense }
  });
});


/**
 * Delete expense
 * DELETE /api/expenses/:expenseId
 */
const deleteExpense = asyncHandler(async (req, res) => {
  const { expenseId } = req.params;
  const tenantId = req.tenantId;
  const userId = req.userId;
  const userRole = req.role;

  const expense = await Expense.findOne({ _id: expenseId, tenantId });

  if (!expense) {
    return res.status(404).json({
      success: false,
      message: 'Expense not found'
    });
  }

  // Only owner or admin can delete
  if (userRole !== 'admin' && expense.userId.toString() !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only delete your own expenses.'
    });
  }

  // Cannot delete approved expenses (business rule)
  if (expense.status === 'approved' && userRole !== 'admin') {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete approved expenses. Please contact your administrator.'
    });
  }

  // Delete receipt from Cloudinary
  if (expense.receipt.publicId) {
    try {
      await deleteFile(expense.receipt.publicId);
    } catch (error) {
      console.error('Failed to delete receipt from Cloudinary:', error);
      // Continue with deletion even if Cloudinary fails
    }
  }

  await Expense.findByIdAndDelete(expenseId);

  res.status(200).json({
    success: true,
    message: 'Expense deleted successfully'
  });
});

/**
 * Approve expense (Manager/Admin only)
 * POST /api/expenses/:expenseId/approve
 */
const approveExpense = asyncHandler(async (req, res) => {
  const { expenseId } = req.params;
  const { notes } = req.body;
  const tenantId = req.tenantId;
  const reviewerId = req.userId;
  const userRole = req.role;

  const expense = await Expense.findOne({ _id: expenseId, tenantId })
    .populate('userId', 'firstName lastName email');

  if (!expense) {
    return res.status(404).json({
      success: false,
      message: 'Expense not found'
    });
  }

  // Check if user is authorized to approve
  const isAssignedReviewer = expense.reviewerId && expense.reviewerId.toString() === reviewerId;
  const isAdmin = userRole === 'admin';

  if (!isAssignedReviewer && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You are not authorized to approve this expense.'
    });
  }

  try {
    await expense.approve(reviewerId, notes);

    const updatedExpense = await Expense.findById(expense._id)
      .populate('userId', 'firstName lastName email')
      .populate('reviewerId', 'firstName lastName email');

    // TODO: Send email notification to employee

    res.status(200).json({
      success: true,
      message: 'Expense approved successfully',
      data: { expense: updatedExpense }
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Reject expense (Manager/Admin only)
 * POST /api/expenses/:expenseId/reject
 */
const rejectExpense = asyncHandler(async (req, res) => {
  const { expenseId } = req.params;
  const { notes } = req.body;
  const tenantId = req.tenantId;
  const reviewerId = req.userId;
  const userRole = req.role;

  if (!notes) {
    return res.status(400).json({
      success: false,
      message: 'Rejection notes are required'
    });
  }

  const expense = await Expense.findOne({ _id: expenseId, tenantId })
    .populate('userId', 'firstName lastName email');

  if (!expense) {
    return res.status(404).json({
      success: false,
      message: 'Expense not found'
    });
  }

  // Check if user is authorized to reject
  const isAssignedReviewer = expense.reviewerId && expense.reviewerId.toString() === reviewerId;
  const isAdmin = userRole === 'admin';

  if (!isAssignedReviewer && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You are not authorized to reject this expense.'
    });
  }

  try {
    await expense.reject(reviewerId, notes);

    const updatedExpense = await Expense.findById(expense._id)
      .populate('userId', 'firstName lastName email')
      .populate('reviewerId', 'firstName lastName email');

    // TODO: Send email notification to employee

    res.status(200).json({
      success: true,
      message: 'Expense rejected',
      data: { expense: updatedExpense }
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Get expense statistics
 * GET /api/expenses/stats
 */
const getExpenseStats = asyncHandler(async (req, res) => {
  const tenantId = new mongoose.Types.ObjectId(req.tenantId);
  const userId = req.userId;
  const userRole = req.role;

  // Date range (default: current month)
  const startDate = req.query.startDate 
    ? new Date(req.query.startDate) 
    : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  
  const endDate = req.query.endDate 
    ? new Date(req.query.endDate) 
    : new Date();

  const match = {
    tenantId,
    expenseDate: { $gte: startDate, $lte: endDate }
  };

  // Role-based filtering
  if (userRole === 'employee') {
    match.userId = new mongoose.Types.ObjectId(userId);
  } else if (userRole === 'manager') {
    match.$or = [
      { userId: new mongoose.Types.ObjectId(userId) },
      { reviewerId: new mongoose.Types.ObjectId(userId) }
    ];
  }

  // Total by status
  const byStatus = await Expense.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$status',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);

  // Total by category
  const byCategory = await Expense.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$category',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { totalAmount: -1 } }
  ]);

  // Overall totals
  const totals = await Expense.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        totalCount: { $sum: 1 },
        averageAmount: { $avg: '$amount' }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      dateRange: { startDate, endDate },
      totals: totals[0] || { totalAmount: 0, totalCount: 0, averageAmount: 0 },
      byStatus: byStatus.reduce((acc, item) => {
        acc[item._id] = { amount: item.totalAmount, count: item.count };
        return acc;
      }, {}),
      byCategory
    }
  });
});

module.exports = {
  createExpense,
  getAllExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  approveExpense,
  rejectExpense,
  getExpenseStats
};
