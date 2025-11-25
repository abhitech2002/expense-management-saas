const express = require('express');
const router = express.Router();
const {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserStats,
  getManagers,
  changePassword
} = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth');
const { authorize, checkOwnershipOrRole } = require('../middleware/rbac');

// All routes require authentication
router.use(authenticate);

// Statistics (admin only) - must be before /:userId to avoid route conflict
router.get('/stats', authorize(['admin']), getUserStats);

// Get managers list (all authenticated users can access for dropdowns)
router.get('/managers', getManagers);

// Create user (admin only)
router.post('/', authorize(['admin']), createUser);

// Get all users (admin: all users, manager: their reports, employee: denied by controller)
router.get('/', authorize(['admin', 'manager']), getAllUsers);

// Get single user (admin: any, manager: their reports, employee: self only)
router.get('/:userId', checkOwnershipOrRole('userId'), getUserById);

// Update user (admin: any, manager: their reports with limits, employee: self with limits)
router.put('/:userId', checkOwnershipOrRole('userId'), updateUser);

// Change password (admin: any user, others: self only)
router.put('/:userId/password', checkOwnershipOrRole('userId'), changePassword);

// Delete user (admin only)
router.delete('/:userId', authorize(['admin']), deleteUser);

module.exports = router;