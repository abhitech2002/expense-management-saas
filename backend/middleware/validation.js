const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware to check validation results
 * Use after validation chains
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  
  next();
};

/**
 * Validation for creating user
 */
const validateCreateUser = [
  body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required')
    .isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters'),
  
  body('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Last name must be 2-50 characters'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('role')
    .notEmpty().withMessage('Role is required')
    .isIn(['admin', 'manager', 'employee']).withMessage('Invalid role'),
  
  body('employeeId')
    .optional()
    .trim()
    .isLength({ max: 20 }).withMessage('Employee ID cannot exceed 20 characters'),
  
  body('department')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Department cannot exceed 50 characters'),
  
  body('managerId')
    .optional()
    .isMongoId().withMessage('Invalid manager ID'),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^[0-9+\-\s()]+$/).withMessage('Invalid phone number format'),
  
  validate
];

/**
 * Validation for updating user
 */
const validateUpdateUser = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters'),
  
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Last name must be 2-50 characters'),
  
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  
  body('role')
    .optional()
    .isIn(['admin', 'manager', 'employee']).withMessage('Invalid role'),
  
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'suspended']).withMessage('Invalid status'),
  
  body('employeeId')
    .optional()
    .trim()
    .isLength({ max: 20 }).withMessage('Employee ID cannot exceed 20 characters'),
  
  body('department')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Department cannot exceed 50 characters'),
  
  body('managerId')
    .optional()
    .custom((value) => {
      if (value === null || value === '') return true; // Allow null/empty to remove manager
      // Check if it's a valid MongoDB ObjectId format
      if (!/^[a-f\d]{24}$/i.test(value)) {
        throw new Error('Invalid manager ID');
      }
      return true;
    }),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^[0-9+\-\s()]+$/).withMessage('Invalid phone number format'),
  
  body('profilePicture')
    .optional()
    .trim()
    .isURL().withMessage('Profile picture must be a valid URL'),
  
  validate
];

/**
 * Validation for changing password
 */
const validateChangePassword = [
  body('currentPassword')
    .optional() // Optional because admin can change without current password
    .notEmpty().withMessage('Current password is required'),
  
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  validate
];

/**
 * Validation for user ID parameter
 */
const validateUserId = [
  param('userId')
    .isMongoId().withMessage('Invalid user ID'),
  
  validate
];

/**
 * Validation for query parameters (filtering, pagination)
 */
const validateUserQuery = [
  query('role')
    .optional()
    .isIn(['admin', 'manager', 'employee']).withMessage('Invalid role'),
  
  query('status')
    .optional()
    .isIn(['active', 'inactive', 'suspended']).withMessage('Invalid status'),
  
  query('department')
    .optional()
    .trim(),
  
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('Search must be 1-100 characters'),
  
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  
  query('sortBy')
    .optional()
    .isIn(['firstName', 'lastName', 'email', 'role', 'status', 'createdAt', 'department'])
    .withMessage('Invalid sort field'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
  
  validate
];

module.exports = {
  validateCreateUser,
  validateUpdateUser,
  validateChangePassword,
  validateUserId,
  validateUserQuery
};
