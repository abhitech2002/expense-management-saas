const { sendEmail } = require('../config/email');

/**
 * Base email template wrapper
 */
const emailTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .content {
      background: #ffffff;
      padding: 30px;
      border: 1px solid #e5e7eb;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background: #2563eb;
      color: white !important;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #6b7280;
      font-size: 14px;
      border-top: 1px solid #e5e7eb;
    }
    .status-badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 6px;
      font-weight: bold;
      font-size: 14px;
    }
    .status-approved {
      background: #dcfce7;
      color: #166534;
    }
    .status-rejected {
      background: #fee2e2;
      color: #991b1b;
    }
    .expense-details {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>💼 Expense Manager</h1>
  </div>
  <div class="content">
    ${content}
  </div>
  <div class="footer">
    <p>This is an automated message from Expense Manager</p>
    <p>&copy; ${new Date().getFullYear()} Expense Manager. All rights reserved.</p>
  </div>
</body>
</html>
`;

/**
 * Send expense approved email
 */
const sendExpenseApprovedEmail = async (expense, user, reviewer) => {
  const content = `
    <h2>✅ Expense Approved</h2>
    <p>Hi ${user.firstName},</p>
    <p>Good news! Your expense has been approved.</p>
    
    <div class="expense-details">
      <h3>${expense.title}</h3>
      <div class="detail-row">
        <span>Amount:</span>
        <strong style="color: #059669;">$${expense.amount.toFixed(2)}</strong>
      </div>
      <div class="detail-row">
        <span>Category:</span>
        <span>${expense.category}</span>
      </div>
      <div class="detail-row">
        <span>Date:</span>
        <span>${new Date(expense.expenseDate).toLocaleDateString()}</span>
      </div>
      ${expense.reviewNotes ? `
        <div class="detail-row">
          <span>Reviewer Notes:</span>
          <span>${expense.reviewNotes}</span>
        </div>
      ` : ''}
    </div>

    <p><strong>Approved by:</strong> ${reviewer.firstName} ${reviewer.lastName}</p>
    <p><strong>Approved on:</strong> ${new Date(expense.reviewedAt).toLocaleString()}</p>

    <a href="${process.env.FRONTEND_URL}/expenses" class="button">View Expenses</a>

    <p>Your expense will be processed for reimbursement shortly.</p>
  `;

  const html = emailTemplate(content);
  const text = `
Expense Approved

Hi ${user.firstName},

Your expense "${expense.title}" for $${expense.amount.toFixed(2)} has been approved by ${reviewer.firstName} ${reviewer.lastName}.

${expense.reviewNotes ? `Notes: ${expense.reviewNotes}` : ''}

View your expenses at: ${process.env.FRONTEND_URL}/expenses
  `;

  return await sendEmail({
    to: user.email,
    subject: `✅ Expense Approved: ${expense.title}`,
    html,
    text
  });
};

/**
 * Send expense rejected email
 */
const sendExpenseRejectedEmail = async (expense, user, reviewer) => {
  const content = `
    <h2>❌ Expense Rejected</h2>
    <p>Hi ${user.firstName},</p>
    <p>Your expense has been rejected and requires revision.</p>
    
    <div class="expense-details">
      <h3>${expense.title}</h3>
      <div class="detail-row">
        <span>Amount:</span>
        <strong style="color: #dc2626;">$${expense.amount.toFixed(2)}</strong>
      </div>
      <div class="detail-row">
        <span>Category:</span>
        <span>${expense.category}</span>
      </div>
      <div class="detail-row">
        <span>Date:</span>
        <span>${new Date(expense.expenseDate).toLocaleDateString()}</span>
      </div>
    </div>

    <div style="background: #fef2f2; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0;">
      <strong>Reason for Rejection:</strong>
      <p style="margin: 10px 0 0 0;">${expense.reviewNotes}</p>
    </div>

    <p><strong>Rejected by:</strong> ${reviewer.firstName} ${reviewer.lastName}</p>
    <p><strong>Rejected on:</strong> ${new Date(expense.reviewedAt).toLocaleString()}</p>

    <a href="${process.env.FRONTEND_URL}/expenses" class="button">View Expenses</a>

    <p>Please review the feedback and resubmit if necessary.</p>
  `;

  const html = emailTemplate(content);
  const text = `
Expense Rejected

Hi ${user.firstName},

Your expense "${expense.title}" for $${expense.amount.toFixed(2)} has been rejected by ${reviewer.firstName} ${reviewer.lastName}.

Reason: ${expense.reviewNotes}

View your expenses at: ${process.env.FRONTEND_URL}/expenses
  `;

  return await sendEmail({
    to: user.email,
    subject: `❌ Expense Rejected: ${expense.title}`,
    html,
    text
  });
};

/**
 * Send welcome email to new user
 */
const sendWelcomeEmail = async (user, tenant, tempPassword = null) => {
  const content = `
    <h2>👋 Welcome to Expense Manager!</h2>
    <p>Hi ${user.firstName},</p>
    <p>Your account has been created for <strong>${tenant.companyName}</strong>.</p>
    
    <div class="expense-details">
      <h3>Your Account Details</h3>
      <div class="detail-row">
        <span>Email:</span>
        <strong>${user.email}</strong>
      </div>
      <div class="detail-row">
        <span>Role:</span>
        <span style="text-transform: capitalize;">${user.role}</span>
      </div>
      <div class="detail-row">
        <span>Department:</span>
        <span>${user.department || 'Not assigned'}</span>
      </div>
    </div>

    ${tempPassword ? `
      <div style="background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0;">
        <strong>Temporary Password:</strong>
        <p style="margin: 10px 0 0 0; font-family: monospace; font-size: 16px;">${tempPassword}</p>
        <p style="margin: 10px 0 0 0; font-size: 14px;">Please change this password after your first login.</p>
      </div>
    ` : ''}

    <a href="${process.env.FRONTEND_URL}/login" class="button">Login to Your Account</a>

    <p>If you have any questions, please contact your administrator.</p>
  `;

  const html = emailTemplate(content);
  const text = `
Welcome to Expense Manager!

Hi ${user.firstName},

Your account has been created for ${tenant.companyName}.

Email: ${user.email}
Role: ${user.role}
${tempPassword ? `Temporary Password: ${tempPassword}\nPlease change this after your first login.` : ''}

Login at: ${process.env.FRONTEND_URL}/login
  `;

  return await sendEmail({
    to: user.email,
    subject: `Welcome to ${tenant.companyName} - Expense Manager`,
    html,
    text
  });
};

/**
 * Send new expense notification to manager
 */
const sendNewExpenseNotification = async (expense, employee, manager) => {
  const content = `
    <h2>📋 New Expense Pending Review</h2>
    <p>Hi ${manager.firstName},</p>
    <p>A new expense requires your approval.</p>
    
    <div class="expense-details">
      <h3>${expense.title}</h3>
      <div class="detail-row">
        <span>Submitted by:</span>
        <strong>${employee.firstName} ${employee.lastName}</strong>
      </div>
      <div class="detail-row">
        <span>Amount:</span>
        <strong style="color: #2563eb;">$${expense.amount.toFixed(2)}</strong>
      </div>
      <div class="detail-row">
        <span>Category:</span>
        <span>${expense.category}</span>
      </div>
      <div class="detail-row">
        <span>Date:</span>
        <span>${new Date(expense.expenseDate).toLocaleDateString()}</span>
      </div>
      ${expense.description ? `
        <div class="detail-row">
          <span>Description:</span>
          <span>${expense.description}</span>
        </div>
      ` : ''}
    </div>

    <a href="${process.env.FRONTEND_URL}/expenses" class="button">Review Expense</a>

    <p>Please review and approve/reject this expense at your earliest convenience.</p>
  `;

  const html = emailTemplate(content);
  const text = `
New Expense Pending Review

Hi ${manager.firstName},

${employee.firstName} ${employee.lastName} submitted a new expense for your approval.

Expense: ${expense.title}
Amount: $${expense.amount.toFixed(2)}
Category: ${expense.category}
Date: ${new Date(expense.expenseDate).toLocaleDateString()}

Review at: ${process.env.FRONTEND_URL}/expenses
  `;

  return await sendEmail({
    to: manager.email,
    subject: `📋 New Expense: ${expense.title} - ${employee.firstName} ${employee.lastName}`,
    html,
    text
  });
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  
  const content = `
    <h2>🔒 Password Reset Request</h2>
    <p>Hi ${user.firstName},</p>
    <p>You requested to reset your password. Click the button below to create a new password:</p>
    
    <a href="${resetUrl}" class="button">Reset Password</a>

    <p>This link will expire in 1 hour.</p>

    <p>If you didn't request this, please ignore this email or contact your administrator if you're concerned.</p>

    <p style="color: #6b7280; font-size: 14px;">Reset link: ${resetUrl}</p>
  `;

  const html = emailTemplate(content);
  const text = `
Password Reset Request

Hi ${user.firstName},

You requested to reset your password. Use this link to create a new password:

${resetUrl}

This link will expire in 1 hour.

If you didn't request this, please ignore this email.
  `;

  return await sendEmail({
    to: user.email,
    subject: '🔒 Password Reset Request - Expense Manager',
    html,
    text
  });
};

module.exports = {
  sendExpenseApprovedEmail,
  sendExpenseRejectedEmail,
  sendWelcomeEmail,
  sendNewExpenseNotification,
  sendPasswordResetEmail
};
