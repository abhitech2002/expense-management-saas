const injectTenantId = (req, res, next) => {
  if (req.tenantId && req.body) {
    req.body.tenantId = req.tenantId;
  }
  next();
};

module.exports = { injectTenantId };