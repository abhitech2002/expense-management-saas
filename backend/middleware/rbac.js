const authorize = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.role) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!allowedRoles.includes(req.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

const checkOwnershipOrRole = (paramName = 'userId') => {
  return (req, res, next) => {
    const resourceOwnerId = req.params[paramName];
    const currentUserId = req.userId;
    const currentUserRole = req.role;

    if (currentUserRole === 'admin' || currentUserRole === 'manager') {
      return next();
    }

    if (resourceOwnerId === currentUserId) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own resources.'
    });
  };
};

module.exports = { authorize, checkOwnershipOrRole };