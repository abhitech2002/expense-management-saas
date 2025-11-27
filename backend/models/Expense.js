const mongoose = require('mongoose');

/**
 * Expense Model
 * Core business entity with approval workflow
 */

const expenseSchema = new mongoose.Schema({
  // Multi-tenant field
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant ID is required'],
    index: true
  },

  // Who submitted the expense
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },

  // Expense details
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },

  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },

  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0'],
    max: [1000000, 'Amount cannot exceed 1,000,000']
  },

  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'INR']
  },

  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'Travel',
      'Meals',
      'Accommodation',
      'Transportation',
      'Office Supplies',
      'Software',
      'Equipment',
      'Entertainment',
      'Training',
      'Other'
    ]
  },

  // When the expense occurred (not when it was submitted)
  expenseDate: {
    type: Date,
    required: [true, 'Expense date is required'],
    validate: {
      validator: function(value) {
        // Cannot be in the future
        return value <= new Date();
      },
      message: 'Expense date cannot be in the future'
    }
  },

  // Receipt/proof
  receipt: {
    url: {
      type: String,
      default: null
    },
    publicId: {
      type: String, // Cloudinary public ID for deletion
      default: null
    },
    uploadedAt: {
      type: Date,
      default: null
    }
  },

   // Approval workflow
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true
  },

  // Manager who reviews this expense (from user's managerId)
  reviewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

   // Review details
  reviewedAt: {
    type: Date,
    default: null
  },

  reviewNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Review notes cannot exceed 500 characters']
  },

   // Additional metadata
  tags: [{
    type: String,
    trim: true
  }],

  // For reimbursement tracking
  reimbursed: {
    type: Boolean,
    default: false
  },

  reimbursedAt: {
    type: Date,
    default: null
  },

    // Merchant/vendor details
  merchant: {
    type: String,
    trim: true,
    maxlength: [100, 'Merchant name cannot exceed 100 characters']
  },

  // Project/department allocation
  project: {
    type: String,
    trim: true,
    maxlength: [100, 'Project name cannot exceed 100 characters']
  }
}, {
  timestamps: true // createdAt, updatedAt
});

expenseSchema.index({ tenantId: 1, userId: 1 });
expenseSchema.index({ tenantId: 1, reviewerId: 1, status: 1 });
expenseSchema.index({ tenantId: 1, expenseDate: 1 });
expenseSchema.index({ tenantId: 1, status: 1 });
expenseSchema.index({ tenantId: 1, category: 1 });

// Calculate if expense is overdue for review (pending > 7 days)
expenseSchema.virtual('isOverdue').get(function() {
  if (this.status !== 'pending') return false;
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return this.createdAt < sevenDaysAgo;
});


// Format amount with currency symbol
expenseSchema.virtual('formattedAmount').get(function() {
  const symbols = { USD: '$', EUR: '€', GBP: '£', INR: '₹' };
  return `${symbols[this.currency]}${this.amount.toFixed(2)}`;
});


/**
 * Approve expense
 */
expenseSchema.methods.approve = function(reviewerId, notes) {
  if (this.status !== 'pending') {
    throw new Error('Only pending expenses can be approved');
  }
  
  this.status = 'approved';
  this.reviewerId = reviewerId;
  this.reviewedAt = new Date();
  this.reviewNotes = notes || '';
  
  return this.save();
};

/**
 * Reject expense
 */
expenseSchema.methods.reject = function(reviewerId, notes) {
  if (this.status !== 'pending') {
    throw new Error('Only pending expenses can be rejected');
  }
  
  this.status = 'rejected';
  this.reviewerId = reviewerId;
  this.reviewedAt = new Date();
  this.reviewNotes = notes || 'Rejected';
  
  return this.save();
};

/**
 * Mark as reimbursed
 */
expenseSchema.methods.markAsReimbursed = function() {
  if (this.status !== 'approved') {
    throw new Error('Only approved expenses can be reimbursed');
  }
  
  this.reimbursed = true;
  this.reimbursedAt = new Date();
  
  return this.save();
};


/**
 * Get expenses by status for a user
 */
expenseSchema.statics.getByUserAndStatus = function(tenantId, userId, status) {
  return this.find({ tenantId, userId, status })
    .populate('reviewerId', 'firstName lastName')
    .sort({ createdAt: -1 });
};

/**
 * Get pending expenses for a manager
 */
expenseSchema.statics.getPendingForReviewer = function(tenantId, reviewerId) {
  return this.find({ tenantId, reviewerId, status: 'pending' })
    .populate('userId', 'firstName lastName email department')
    .sort({ createdAt: 1 }); // Oldest first
};


/**
 * Get expense statistics for a tenant
 */
expenseSchema.statics.getStats = async function(tenantId, startDate, endDate) {
  const match = { tenantId };
  
  if (startDate && endDate) {
    match.expenseDate = { $gte: startDate, $lte: endDate };
  }
  
  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$status',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);
  
  return stats;
};

// Ensure virtuals are included in JSON/Object
expenseSchema.set('toJSON', { virtuals: true });
expenseSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Expense', expenseSchema);