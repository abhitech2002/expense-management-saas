const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    const user = await User.findOne({
      _id: decoded.userId,
      tenantId: decoded.tenantId,
      status: 'active'
    }).select('-password -refreshToken');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive.'
      });
    }

    req.user = user;
    req.userId = decoded.userId;
    req.tenantId = decoded.tenantId;
    req.role = decoded.role;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message || 'Invalid token.'
    });
  }
};

module.exports = { authenticate };