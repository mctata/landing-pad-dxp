const express = require('express');
const router = express.Router();
const multer = require('multer');
const imageController = require('../controllers/imageController');
const authMiddleware = require('../middleware/auth');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Apply auth middleware to all routes
router.use(authMiddleware.authenticate);

// Image upload and management
router.post('/upload', upload.single('image'), imageController.uploadImage);
router.delete('/:imageId', imageController.deleteImage);
router.get('/:imageId', imageController.getImageDetails);
router.post('/:imageId/optimize', imageController.optimizeImage);

// Stock photo APIs
router.get('/stock/search', imageController.searchStockPhotos);
router.get('/stock/random', imageController.getRandomStockPhotos);
router.post('/stock/save', imageController.saveUnsplashImage);

// Storage health check
router.get('/storage-check', imageController.checkStorage);

module.exports = router;