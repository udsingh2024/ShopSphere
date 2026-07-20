const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload.middleware');
const { protect } = require('../middlewares/auth.middleware');
const {
  visualSearch,
  indexProduct,
  getHistory,
  deleteHistory,
} = require('../controllers/visual-search.controller');
const { uploadLimiter } = require('../middlewares/rateLimiter');

router.post('/', uploadLimiter, upload.single('image'), visualSearch);
router.post('/index-product', protect, indexProduct);
router.get('/history', protect, getHistory);
router.delete('/history', protect, deleteHistory);

module.exports = router;
