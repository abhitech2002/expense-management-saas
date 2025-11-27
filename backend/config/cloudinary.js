const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();


// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Cloudinary storage for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'expense-receipts', // Folder in Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }], // Max dimensions
    resource_type: 'auto' // Auto-detect file type
  }
});

// Create Multer upload instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and PDF are allowed.'));
    }
  }
});

/**
 * Delete file from Cloudinary
 */
const deleteFile = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
    console.log(`Deleted file from Cloudinary: ${publicId}`);
  } catch (error) {
    console.error('Error deleting file from Cloudinary:', error);
    throw error;
  }
};

/**
 * Upload file to Cloudinary (manual upload without Multer)
 */
const uploadFile = async (filePath, folder = 'expense-receipts') => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'auto',
      transformation: [{ width: 1000, height: 1000, crop: 'limit' }]
    });
    return result;
  } catch (error) {
    console.error('Error uploading file to Cloudinary:', error);
    throw error;
  }
};

module.exports = {
  cloudinary,
  upload,
  deleteFile,
  uploadFile
};