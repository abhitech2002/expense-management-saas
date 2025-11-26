const User = require('../models/User');
const Tenant = require('../models/Tenant');
const mongoose = require('mongoose');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Create new user (Admin only)
 * POST /api/users
 */
const createUser = asyncHandler(async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    password,
    role,
    employeeId,
    department,
    managerId,
    phone
  } = req.body;

  const tenantId = req.tenantId; // From authenticate middleware

  // 1. Validate required fields
  if (!firstName || !lastName || !email || !password || !role) {
    return res.status(400).json({
      success: false,
      message: 'First name, last name, email, password, and role are required.'
    });
  }

  // 2. Validate role
  const validRoles = ['admin', 'manager', 'employee'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid role. Must be admin, manager, or employee.'
    });
  }

  // 3. Check if email already exists in this tenant
  const existingUser = await User.findOne({
    email: email.toLowerCase(),
    tenantId
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'Email already exists in your organization.'
    });
  }

  // 4. Validate managerId if provided
  if (managerId) {
    const manager = await User.findOne({
      _id: managerId,
      tenantId,
      role: { $in: ['admin', 'manager'] } // Only admins/managers can be managers
    });

    if (!manager) {
      return res.status(404).json({
        success: false,
        message: 'Manager not found or invalid role.'
      });
    }
  }

  // 5. Check tenant user limit (optional - good for SaaS limits)
  const tenant = await Tenant.findById(tenantId);
  const userCount = await User.countDocuments({ tenantId });

  if (userCount >= tenant.maxUsers) {
    return res.status(403).json({
      success: false,
      message: `User limit reached (${tenant.maxUsers}). Please upgrade your plan.`
    });
  }

  // 6. Create user
  const user = await User.create({
    tenantId,
    firstName,
    lastName,
    email: email.toLowerCase(),
    password, // Will be hashed by pre-save middleware
    role,
    employeeId,
    department,
    managerId: managerId || null,
    phone,
    status: 'active'
  });

  // 7. Return user (without password)
  const userResponse = await User.findById(user._id)
    .select('-password -refreshToken')
    .populate('managerId', 'firstName lastName email role');

  res.status(201).json({
    success: true,
    message: 'User created successfully.',
    data: { user: userResponse }
  });
});


/**
 * Get all users in tenant (Admin/Manager)
 * GET /api/users
 * Query params: role, status, department, search, page, limit
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const userRole = req.role;
  const userId = req.userId;

  // Build query filters
  const filters = { tenantId };

  // If manager, only show their direct reports + themselves
  if (userRole === 'manager') {
    filters.$or = [
      { managerId: userId }, // Their direct reports
      { _id: userId }         // Themselves
    ];
  }

  // Additional filters from query params
  if (req.query.role) {
    filters.role = req.query.role;
  }

  if (req.query.status) {
    filters.status = req.query.status;
  }

  if (req.query.department) {
    filters.department = req.query.department;
  }

  // Search by name or email
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, 'i');
    filters.$or = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { email: searchRegex },
      { employeeId: searchRegex }
    ];
  }

  // Pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Sort
  const sortBy = req.query.sortBy || 'createdAt';
  const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

  // Execute query
  const users = await User.find(filters)
    .select('-password -refreshToken')
    .populate('managerId', 'firstName lastName email role')
    .sort({ [sortBy]: sortOrder })
    .skip(skip)
    .limit(limit);

  const totalUsers = await User.countDocuments(filters);

  res.status(200).json({
    success: true,
    data: {
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
        usersPerPage: limit
      }
    }
  });
});


/**
 * Get single user by ID (Admin/Manager for their reports/Employee for self)
 * GET /api/users/:userId
 */
const getUserById = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const tenantId = req.tenantId;
  const currentUserRole = req.role;
  const currentUserId = req.userId;

  const user = await User.findOne({ _id: userId, tenantId })
    .select('-password -refreshToken')
    .populate('managerId', 'firstName lastName email role department');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found.'
    });
  }

  // Authorization check: Admin sees all, Manager sees their reports, Employee sees only self
  if (currentUserRole === 'employee' && userId !== currentUserId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only view your own profile.'
    });
  }

  if (currentUserRole === 'manager') {
    // Manager can see themselves and their direct reports
    const isOwnProfile = userId === currentUserId;
    const isDirectReport = user.managerId && user.managerId._id.toString() === currentUserId;

    if (!isOwnProfile && !isDirectReport) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your direct reports.'
      });
    }
  }

  res.status(200).json({
    success: true,
    data: { user }
  });
});


/**
 * Update user (Admin updates any, users update own profile)
 * PUT /api/users/:userId
 */
const updateUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const tenantId = req.tenantId;
  const currentUserRole = req.role;
  const currentUserId = req.userId;

  const {
    firstName,
    lastName,
    phone,
    department,
    employeeId,
    managerId,
    role,
    status,
    profilePicture
  } = req.body;

  // Find user
  const user = await User.findOne({ _id: userId, tenantId });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found.'
    });
  }

  // Authorization: Employee can only update self and limited fields
  if (currentUserRole === 'employee') {
    if (userId !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own profile.'
      });
    }

    // Employees can only update these fields
    if (role || status || managerId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You cannot modify role, status, or manager.'
      });
    }
  }

  // Manager can only update their direct reports (not role/manager)
  if (currentUserRole === 'manager' && userId !== currentUserId) {
    const isDirectReport = user.managerId && user.managerId.toString() === currentUserId;

    if (!isDirectReport) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your direct reports.'
      });
    }

    // Managers cannot change role or assign managers
    if (role || managerId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admins can modify roles and managers.'
      });
    }
  }

  // Update allowed fields
  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (phone !== undefined) user.phone = phone;
  if (profilePicture !== undefined) user.profilePicture = profilePicture;

  // Admin-only fields
  if (currentUserRole === 'admin') {
    if (department !== undefined) user.department = department;
    if (employeeId !== undefined) user.employeeId = employeeId;
    if (status) user.status = status;
    if (role) user.role = role;

    // Validate and update managerId
    if (managerId !== undefined) {
      if (managerId) {
        const manager = await User.findOne({
          _id: managerId,
          tenantId,
          role: { $in: ['admin', 'manager'] }
        });

        if (!manager) {
          return res.status(404).json({
            success: false,
            message: 'Manager not found or invalid role.'
          });
        }
      }
      user.managerId = managerId || null;
    }
  }

  await user.save();

  // Return updated user with populated manager
  const updatedUser = await User.findById(user._id)
    .select('-password -refreshToken')
    .populate('managerId', 'firstName lastName email role');

  res.status(200).json({
    success: true,
    message: 'User updated successfully.',
    data: { user: updatedUser }
  });
});

/**
 * Delete user (Admin only)
 * DELETE /api/users/:userId
 */
const deleteUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const tenantId = req.tenantId;
  const currentUserId = req.userId;

  // Prevent self-deletion
  if (userId === currentUserId) {
    return res.status(400).json({
      success: false,
      message: 'You cannot delete your own account.'
    });
  }

  const user = await User.findOne({ _id: userId, tenantId });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found.'
    });
  }

  // Check if user is a manager with direct reports
  const directReportsCount = await User.countDocuments({
    tenantId,
    managerId: userId
  });

  if (directReportsCount > 0) {
    return res.status(400).json({
      success: false,
      message: `Cannot delete user. They are managing ${directReportsCount} employee(s). Please reassign them first.`
    });
  }

  // Soft delete (mark as inactive) instead of hard delete
  // This preserves historical data (expenses, approvals)
  user.status = 'inactive';
  user.email = `deleted_${Date.now()}_${user.email}`; // Allow email reuse
  await user.save();

  // Alternative: Hard delete (uncomment if preferred)
  // await User.findByIdAndDelete(userId);

  res.status(200).json({
    success: true,
    message: 'User deleted successfully.'
  });
});


/**
 * Get user statistics (Admin only)
 * GET /api/users/stats
 */
const getUserStats = asyncHandler(async (req, res) => {
  const tenantId = new mongoose.Types.ObjectId(req.tenantId); // Convert to ObjectId

  // Total users by role
  const usersByRole = await User.aggregate([
    { $match: { tenantId: tenantId } },
    { $group: { _id: '$role', count: { $sum: 1 } } }
  ]);

  // Total users by status
  const usersByStatus = await User.aggregate([
    { $match: { tenantId: tenantId } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  // Users by department
  const usersByDepartment = await User.aggregate([
    { $match: { tenantId: tenantId, department: { $ne: null, $ne: '' } } },
    { $group: { _id: '$department', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  // Total users
  const totalUsers = await User.countDocuments({ tenantId: req.tenantId }); // Regular query uses string

  // Recent users (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentUsers = await User.countDocuments({
    tenantId: req.tenantId,
    createdAt: { $gte: sevenDaysAgo }
  });

  // Tenant limits
  const tenant = await Tenant.findById(req.tenantId);

  res.status(200).json({
    success: true,
    data: {
      totalUsers,
      recentUsers,
      usersByRole: usersByRole.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      usersByStatus: usersByStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      usersByDepartment,
      limits: {
        maxUsers: tenant.maxUsers,
        remaining: tenant.maxUsers - totalUsers
      }
    }
  });
});
/**
 * Get managers list (for dropdowns)
 * GET /api/users/managers
 */
const getManagers = asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;

  const managers = await User.find({
    tenantId,
    role: { $in: ['admin', 'manager'] },
    status: 'active'
  })
    .select('firstName lastName email role department')
    .sort({ firstName: 1 });

  res.status(200).json({
    success: true,
    data: { managers }
  });
});

/**
 * Change user password (Self or Admin)
 * PUT /api/users/:userId/password
 */
const changePassword = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const tenantId = req.tenantId;
  const currentUserId = req.userId;
  const currentUserRole = req.role;

  const { currentPassword, newPassword } = req.body;

  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'New password must be at least 8 characters.'
    });
  }

  // Only self or admin can change password
  if (currentUserRole !== 'admin' && userId !== currentUserId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only change your own password.'
    });
  }

  const user = await User.findOne({ _id: userId, tenantId }).select('+password');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found.'
    });
  }

  // If changing own password, verify current password
  if (userId === currentUserId) {
    if (!currentPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password is required.'
      });
    }

    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect.'
      });
    }
  }

  // Update password (will be hashed by pre-save middleware)
  user.password = newPassword;
  user.passwordChangedAt = new Date();
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password changed successfully.'
  });
});

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserStats,
  getManagers,
  changePassword
};