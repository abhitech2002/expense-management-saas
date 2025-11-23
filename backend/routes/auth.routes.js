const express = require('express');
const router = express.Router();
const {
  registerTenant,
  login,
  refreshToken,
  logout,
  getProfile
} = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');

router.post('/register', registerTenant);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getProfile);

module.exports = router;