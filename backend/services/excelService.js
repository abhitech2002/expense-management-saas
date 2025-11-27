const xlsx = require('xlsx');

/**
 * Generate Excel workbook from expenses
 */
const generateExpenseExcel = (expenses, summary = {}) => {
  // Create a new workbook
  const workbook = xlsx.utils.book_new();

  // ==========================================
  // SHEET 1: Summary
  // ==========================================
  const summaryData = [
    ['Expense Summary Report'],
    [''],
    ['Report Date:', new Date().toLocaleDateString()],
    ['Total Expenses:', expenses.length],
    ['Total Amount:', summary.totalAmount || 0],
    ['Average Amount:', summary.averageAmount || 0],
    [''],
    ['By Status'],
    ['Status', 'Count', 'Total Amount'],
    ...Object.entries(summary.byStatus || {}).map(([status, data]) => [
      status.charAt(0).toUpperCase() + status.slice(1),
      data.count,
      data.amount
    ]),
    [''],
    ['By Category'],
    ['Category', 'Count', 'Total Amount', 'Percentage'],
    ...Object.entries(summary.byCategory || {}).map(([category, data]) => [
      category,
      data.count,
      data.amount,
      `${((data.amount / summary.totalAmount) * 100).toFixed(1)}%`
    ])
  ];

  const summarySheet = xlsx.utils.aoa_to_sheet(summaryData);

  // Set column widths
  summarySheet['!cols'] = [
    { wch: 20 },  // Column A
    { wch: 15 },  // Column B
    { wch: 15 },  // Column C
    { wch: 15 }   // Column D
  ];

  // Add styling to summary sheet (title row)
  if (summarySheet['A1']) {
    summarySheet['A1'].s = {
      font: { bold: true, sz: 16 },
      alignment: { horizontal: 'left' }
    };
  }

  xlsx.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // ==========================================
  // SHEET 2: Expense Details
  // ==========================================
  const expenseData = expenses.map(expense => ({
    'Date': new Date(expense.expenseDate).toLocaleDateString(),
    'Title': expense.title,
    'Category': expense.category,
    'Amount': expense.amount,
    'Currency': expense.currency,
    'Status': expense.status.charAt(0).toUpperCase() + expense.status.slice(1),
    'Merchant': expense.merchant || '',
    'Project': expense.project || '',
    'Description': expense.description || '',
    'Submitted By': expense.user ? `${expense.user.firstName} ${expense.user.lastName}` : '',
    'Department': expense.user?.department || '',
    'Reviewer': expense.reviewer ? `${expense.reviewer.firstName} ${expense.reviewer.lastName}` : '',
    'Review Date': expense.reviewedAt ? new Date(expense.reviewedAt).toLocaleDateString() : '',
    'Review Notes': expense.reviewNotes || '',
    'Created At': new Date(expense.createdAt).toLocaleString()
  }));

  const detailsSheet = xlsx.utils.json_to_sheet(expenseData);

  // Set column widths for details sheet
  detailsSheet['!cols'] = [
    { wch: 12 },  // Date
    { wch: 25 },  // Title
    { wch: 15 },  // Category
    { wch: 12 },  // Amount
    { wch: 10 },  // Currency
    { wch: 12 },  // Status
    { wch: 20 },  // Merchant
    { wch: 20 },  // Project
    { wch: 40 },  // Description
    { wch: 20 },  // Submitted By
    { wch: 15 },  // Department
    { wch: 20 },  // Reviewer
    { wch: 12 },  // Review Date
    { wch: 40 },  // Review Notes
    { wch: 20 }   // Created At
  ];

  // Add auto-filter to headers
  detailsSheet['!autofilter'] = { ref: `A1:O${expenses.length + 1}` };

  xlsx.utils.book_append_sheet(workbook, detailsSheet, 'Expense Details');

  // ==========================================
  // SHEET 3: Category Analysis
  // ==========================================
  if (summary.byCategory) {
    const categoryData = Object.entries(summary.byCategory).map(([category, data]) => ({
      'Category': category,
      'Count': data.count,
      'Total Amount': data.amount,
      'Average Amount': (data.amount / data.count).toFixed(2),
      'Percentage of Total': `${((data.amount / summary.totalAmount) * 100).toFixed(1)}%`
    }));

    const categorySheet = xlsx.utils.json_to_sheet(categoryData);
    categorySheet['!cols'] = [
      { wch: 20 },
      { wch: 10 },
      { wch: 15 },
      { wch: 15 },
      { wch: 20 }
    ];

    xlsx.utils.book_append_sheet(workbook, categorySheet, 'Category Analysis');
  }

  // ==========================================
  // SHEET 4: Monthly Breakdown (if applicable)
  // ==========================================
  if (expenses.length > 0) {
    const monthlyData = {};
    
    expenses.forEach(expense => {
      const month = new Date(expense.expenseDate).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      });
      
      if (!monthlyData[month]) {
        monthlyData[month] = { count: 0, amount: 0 };
      }
      
      monthlyData[month].count++;
      monthlyData[month].amount += expense.amount;
    });

    const monthlySheetData = Object.entries(monthlyData).map(([month, data]) => ({
      'Month': month,
      'Expense Count': data.count,
      'Total Amount': data.amount,
      'Average Amount': (data.amount / data.count).toFixed(2)
    }));

    const monthlySheet = xlsx.utils.json_to_sheet(monthlySheetData);
    monthlySheet['!cols'] = [
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 }
    ];

    xlsx.utils.book_append_sheet(workbook, monthlySheet, 'Monthly Breakdown');
  }

  // Generate buffer
  const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  
  return buffer;
};

/**
 * Generate simple expense list Excel
 */
const generateSimpleExpenseExcel = (expenses) => {
  const workbook = xlsx.utils.book_new();

  const data = expenses.map(expense => ({
    'Date': new Date(expense.expenseDate).toLocaleDateString(),
    'Title': expense.title,
    'Category': expense.category,
    'Amount': expense.amount,
    'Currency': expense.currency,
    'Status': expense.status,
    'Merchant': expense.merchant || '',
    'Description': expense.description || ''
  }));

  const worksheet = xlsx.utils.json_to_sheet(data);
  
  // Auto-size columns
  worksheet['!cols'] = [
    { wch: 12 },
    { wch: 30 },
    { wch: 15 },
    { wch: 12 },
    { wch: 10 },
    { wch: 12 },
    { wch: 25 },
    { wch: 40 }
  ];

  xlsx.utils.book_append_sheet(workbook, worksheet, 'Expenses');

  const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  
  return buffer;
};

module.exports = {
  generateExpenseExcel,
  generateSimpleExpenseExcel
};