const express = require('express');
const router = express.Router();
const {
  downloadExpenseReport,
  downloadSummaryReport,
  downloadExpenseExcel
} = require('../controllers/report.controller');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Download single expense report
router.get('/expense/:expenseId', downloadExpenseReport);

// Download summary report
router.get('/summary', downloadSummaryReport);

// Excel Export
router.get('/excel', downloadExpenseExcel);

module.exports = router;
