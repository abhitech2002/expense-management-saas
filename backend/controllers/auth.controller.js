const User = require('../models/User');
const Tenant = require('../models/Tenant');
const { generateTokens, verifyRefreshToken } = require('../utils/jwt');
const { asyncHandler } = require('../middleware/errorHandler');

const registerTenant = asyncHandler(async (req, res) => {
  const {
    companyName,
    subdomain,
    tenantEmail,
    phone,
    firstName,
    lastName,
    email,
    password
  } = req.body;

  if (!companyName || !subdomain || !tenantEmail || !firstName || !lastName || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required.'
    });
  }

  const existingTenant = await Tenant.findOne({ subdomain: subdomain.toLowerCase() });
  if (existingTenant) {
    return res.status(400).json({
      success: false,
      message: 'Subdomain already taken. Please choose another.'
    });
  }

  const tenant = await Tenant.create({
    companyName,
    subdomain: subdomain.toLowerCase(),
    email: tenantEmail,
    phone,
    status: 'trial'
  });

  const adminUser = await User.create({
    tenantId: tenant._id,
    firstName,
    lastName,
    email: email.toLowerCase(),
    password,
    role: 'admin',
    status: 'active'
  });

  const tokens = generateTokens(adminUser);

  adminUser.refreshToken = tokens.refreshToken;
  await adminUser.save();

  res.status(201).json({
    success: true,
    message: 'Tenant registered successfully. Trial period: 14 days.',
    data: {
      tenant: {
        id: tenant._id,
        companyName: tenant.companyName,
        subdomain: tenant.subdomain,
        status: tenant.status,
        trialEndsAt: tenant.trialEndsAt
      },
      user: {
        id: adminUser._id,
        firstName: adminUser.firstName,
        lastName: adminUser.lastName,
        email: adminUser.email,
        role: adminUser.role
      },
      tokens
    }
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password, subdomain } = req.body;

  if (!email || !password || !subdomain) {
    return res.status(400).json({
      success: false,
      message: 'Email, password, and subdomain are required.'
    });
  }

  const tenant = await Tenant.findOne({ subdomain: subdomain.toLowerCase() });
  if (!tenant) {
    return res.status(404).json({
      success: false,
      message: 'Company not found. Please check your subdomain.'
    });
  }

  if (tenant.status === 'suspended' || tenant.status === 'cancelled') {
    return res.status(403).json({
      success: false,
      message: `Account ${tenant.status}. Please contact support.`
    });
  }

  const user = await User.findOne({
    email: email.toLowerCase(),
    tenantId: tenant._id
  }).select('+password +refreshToken');

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password.'
    });
  }

  if (user.status !== 'active') {
    return res.status(403).json({
      success: false,
      message: `Your account is ${user.status}. Please contact your administrator.`
    });
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password.'
    });
  }

  const tokens = generateTokens(user);

  user.refreshToken = tokens.refreshToken;
  user.lastLogin = new Date();
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Login successful.',
    data: {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId
      },
      tenant: {
        id: tenant._id,
        companyName: tenant.companyName,
        subdomain: tenant.subdomain,
        status: tenant.status
      },
      tokens
    }
  });
});

const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      message: 'Refresh token is required.'
    });
  }

  const decoded = verifyRefreshToken(refreshToken);

  const user = await User.findById(decoded.userId).select('+refreshToken');
  
  if (!user || user.refreshToken !== refreshToken) {
    return res.status(401).json({
      success: false,
      message: 'Invalid refresh token. Please login again.'
    });
  }

  if (user.status !== 'active') {
    return res.status(403).json({
      success: false,
      message: 'Your account is inactive. Please contact administrator.'
    });
  }

  const tokens = generateTokens(user);

  user.refreshToken = tokens.refreshToken;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Token refreshed successfully.',
    data: {
      tokens
    }
  });
});

const logout = asyncHandler(async (req, res) => {
  const userId = req.userId;

  await User.findByIdAndUpdate(userId, { refreshToken: null });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully.'
  });
});

const getProfile = asyncHandler(async (req, res) => {
  const user = req.user;

  res.status(200).json({
    success: true,
    data: { user }
  });
});

module.exports = {
  registerTenant,
  login,
  refreshToken,
  logout,
  getProfile
};