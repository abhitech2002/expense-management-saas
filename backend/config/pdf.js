const puppeteer = require('puppeteer');

/**
 * Generate PDF from HTML
 */
const generatePDF = async (html, options = {}) => {
  let browser;
  
  try {
    // Launch headless browser
    browser = await puppeteer.launch({
      headless: 'new', // Use new headless mode
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage', // Overcome limited resource problems
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    
    // Set content
    await page.setContent(html, {
      waitUntil: 'networkidle0' // Wait for all resources to load
    });

    // Generate PDF
    const pdf = await page.pdf({
      format: options.format || 'A4',
      printBackground: true, // Include background colors/images
      margin: options.margin || {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      },
      ...options
    });

    return pdf;
  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};


/**
 * Generate PDF and save to file
 */
const generatePDFFile = async (html, outputPath, options = {}) => {
  let browser;
  
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    await page.pdf({
      path: outputPath,
      format: options.format || 'A4',
      printBackground: true,
      margin: options.margin || {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      },
      ...options
    });

    console.log(`✅ PDF generated: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error('PDF file generation error:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

module.exports = {
  generatePDF,
  generatePDFFile
};