const { generatePDF } = require('../config/pdf');

/**
 * Generate single expense report PDF
 */
const generateExpenseReportPDF = async (expense, user, tenant) => {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Helvetica', 'Arial', sans-serif;
      color: #1f2937;
      padding: 40px;
      line-height: 1.6;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #2563eb;
    }
    .company-info h1 {
      color: #2563eb;
      font-size: 28px;
      margin-bottom: 5px;
    }
    .company-info p {
      color: #6b7280;
      font-size: 14px;
    }
    .report-info {
      text-align: right;
    }
    .report-info h2 {
      font-size: 18px;
      color: #6b7280;
      margin-bottom: 10px;
    }
    .report-info p {
      font-size: 14px;
      color: #9ca3af;
    }
    .expense-title {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 30px;
      color: #111827;
    }
    .details-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-bottom: 30px;
    }
    .detail-item {
      background: #f9fafb;
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid #2563eb;
    }
    .detail-label {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }
    .detail-value {
      font-size: 16px;
      font-weight: 600;
      color: #111827;
    }
    .amount-box {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: white;
      padding: 25px;
      border-radius: 12px;
      text-align: center;
      margin-bottom: 30px;
    }
    .amount-label {
      font-size: 14px;
      opacity: 0.9;
      margin-bottom: 5px;
    }
    .amount-value {
      font-size: 36px;
      font-weight: bold;
    }
    .description-box {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .description-box h3 {
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 10px;
    }
    .description-box p {
      font-size: 14px;
      color: #374151;
    }
    .status-badge {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .status-pending {
      background: #fef3c7;
      color: #92400e;
    }
    .status-approved {
      background: #dcfce7;
      color: #166534;
    }
    .status-rejected {
      background: #fee2e2;
      color: #991b1b;
    }
    .review-section {
      background: #fef3c7;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #f59e0b;
      margin-top: 30px;
    }
    .review-section h3 {
      color: #92400e;
      margin-bottom: 15px;
    }
    .receipt-section {
      margin-top: 30px;
      page-break-before: always;
    }
    .receipt-section h3 {
      margin-bottom: 15px;
      color: #111827;
    }
    .receipt-image {
      width: 100%;
      max-width: 600px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      margin-top: 15px;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-info">
      <h1>${tenant.companyName}</h1>
      <p>Expense Report</p>
    </div>
    <div class="report-info">
      <h2>EXPENSE #${expense._id.toString().slice(-8).toUpperCase()}</h2>
      <p>Generated: ${new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}</p>
    </div>
  </div>

  <h1 class="expense-title">${expense.title}</h1>

  <div class="amount-box">
    <div class="amount-label">Total Amount</div>
    <div class="amount-value">${expense.currency === 'USD' ? '$' : expense.currency} ${expense.amount.toFixed(2)}</div>
  </div>

  <div class="details-grid">
    <div class="detail-item">
      <div class="detail-label">Submitted By</div>
      <div class="detail-value">${user.firstName} ${user.lastName}</div>
    </div>
    <div class="detail-item">
      <div class="detail-label">Category</div>
      <div class="detail-value">${expense.category}</div>
    </div>
    <div class="detail-item">
      <div class="detail-label">Expense Date</div>
      <div class="detail-value">${new Date(expense.expenseDate).toLocaleDateString()}</div>
    </div>
    <div class="detail-item">
      <div class="detail-label">Status</div>
      <div class="detail-value">
        <span class="status-badge status-${expense.status}">${expense.status}</span>
      </div>
    </div>
    ${expense.merchant ? `
      <div class="detail-item">
        <div class="detail-label">Merchant</div>
        <div class="detail-value">${expense.merchant}</div>
      </div>
    ` : ''}
    ${expense.project ? `
      <div class="detail-item">
        <div class="detail-label">Project</div>
        <div class="detail-value">${expense.project}</div>
      </div>
    ` : ''}
  </div>

  ${expense.description ? `
    <div class="description-box">
      <h3>Description</h3>
      <p>${expense.description}</p>
    </div>
  ` : ''}

  ${expense.status !== 'pending' && expense.reviewerId ? `
    <div class="review-section">
      <h3>Review Information</h3>
      <div class="details-grid">
        <div class="detail-item" style="background: white;">
          <div class="detail-label">Reviewed By</div>
          <div class="detail-value">${expense.reviewerId.firstName} ${expense.reviewerId.lastName}</div>
        </div>
        <div class="detail-item" style="background: white;">
          <div class="detail-label">Reviewed On</div>
          <div class="detail-value">${new Date(expense.reviewedAt).toLocaleDateString()}</div>
        </div>
      </div>
      ${expense.reviewNotes ? `
        <div style="margin-top: 15px;">
          <strong>Review Notes:</strong>
          <p style="margin-top: 5px;">${expense.reviewNotes}</p>
        </div>
      ` : ''}
    </div>
  ` : ''}

  ${expense.receipt?.url && !expense.receipt.url.endsWith('.pdf') ? `
    <div class="receipt-section">
      <h3>Receipt</h3>
      <img src="${expense.receipt.url}" class="receipt-image" alt="Receipt" />
    </div>
  ` : ''}

  <div class="footer">
    <p>This is an automatically generated expense report from ${tenant.companyName}</p>
    <p>Report ID: ${expense._id}</p>
  </div>
</body>
</html>
  `;

  const pdf = await generatePDF(html, {
    format: 'A4',
    displayHeaderFooter: false,
    margin: {
      top: '15mm',
      right: '15mm',
      bottom: '15mm',
      left: '15mm'
    }
  });

  return pdf;
};

/**
 * Generate summary report PDF for multiple expenses
 */
const generateExpenseSummaryPDF = async (expenses, user, tenant, dateRange) => {
  const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const byCategory = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {});
  const byStatus = expenses.reduce((acc, exp) => {
    acc[exp.status] = (acc[exp.status] || 0) + 1;
    return acc;
  }, {});

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Helvetica', 'Arial', sans-serif;
      color: #1f2937;
      padding: 40px;
      line-height: 1.6;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #2563eb;
    }
    .header h1 {
      color: #2563eb;
      font-size: 28px;
    }
    .summary-cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 40px;
    }
    .card {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: white;
      padding: 25px;
      border-radius: 12px;
      text-align: center;
    }
    .card-label {
      font-size: 14px;
      opacity: 0.9;
      margin-bottom: 5px;
    }
    .card-value {
      font-size: 32px;
      font-weight: bold;
    }
    h2 {
      font-size: 20px;
      margin-bottom: 20px;
      color: #111827;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 40px;
      background: white;
    }
    th {
      background: #f9fafb;
      padding: 12px;
      text-align: left;
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 2px solid #e5e7eb;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
    }
    tr:hover {
      background: #f9fafb;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }
    .status-pending {
      background: #fef3c7;
      color: #92400e;
    }
    .status-approved {
      background: #dcfce7;
      color: #166534;
    }
    .status-rejected {
      background: #fee2e2;
      color: #991b1b;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>${tenant.companyName}</h1>
      <p>Expense Summary Report</p>
    </div>
    <div style="text-align: right;">
      <p>${dateRange.start} to ${dateRange.end}</p>
      <p style="font-size: 12px; color: #6b7280;">Generated: ${new Date().toLocaleDateString()}</p>
    </div>
  </div>

  <div class="summary-cards">
    <div class="card">
      <div class="card-label">Total Expenses</div>
      <div class="card-value">${expenses.length}</div>
    </div>
    <div class="card">
      <div class="card-label">Total Amount</div>
      <div class="card-value">$${totalAmount.toFixed(2)}</div>
    </div>
    <div class="card" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
      <div class="card-label">Approved</div>
      <div class="card-value">${byStatus.approved || 0}</div>
    </div>
  </div>

  <h2>Expenses by Category</h2>
  <table>
    <thead>
      <tr>
        <th>Category</th>
        <th style="text-align: right;">Amount</th>
        <th style="text-align: right;">Percentage</th>
      </tr>
    </thead>
    <tbody>
      ${Object.entries(byCategory)
        .sort(([,a], [,b]) => b - a)
        .map(([category, amount]) => `
          <tr>
            <td>${category}</td>
            <td style="text-align: right; font-weight: 600;">$${amount.toFixed(2)}</td>
            <td style="text-align: right;">${((amount / totalAmount) * 100).toFixed(1)}%</td>
          </tr>
        `).join('')}
    </tbody>
    <tfoot style="border-top: 2px solid #e5e7eb;">
      <tr>
        <td style="font-weight: bold;">Total</td>
        <td style="text-align: right; font-weight: bold;">$${totalAmount.toFixed(2)}</td>
        <td style="text-align: right; font-weight: bold;">100%</td>
      </tr>
    </tfoot>
  </table>

  <h2>Expense Details</h2>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Title</th>
        <th>Category</th>
        <th style="text-align: right;">Amount</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${expenses.map(expense => `
        <tr>
          <td>${new Date(expense.expenseDate).toLocaleDateString()}</td>
          <td>${expense.title}</td>
          <td>${expense.category}</td>
          <td style="text-align: right; font-weight: 600;">$${expense.amount.toFixed(2)}</td>
          <td><span class="status-badge status-${expense.status}">${expense.status}</span></td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="footer">
    <p>This is an automatically generated expense summary report from ${tenant.companyName}</p>
    <p>Generated for: ${user.firstName} ${user.lastName}</p>
  </div>
</body>
</html>
  `;

  const pdf = await generatePDF(html);
  return pdf;
};

module.exports = {
  generateExpenseReportPDF,
  generateExpenseSummaryPDF
};