const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload.middleware');
const validate = require('../middlewares/validation.middleware');
const { createProductSchema } = require('../validators/product.validator');
const { protect, adminOnly } = require('../middlewares/auth.middleware');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  visualSearch,
} = require('../controllers/product.controller');

router.get('/', getProducts);
router.post('/visual-search', upload.single('image'), visualSearch);
router.get('/:id', getProductById);

// Admin-protected catalog editing
router.post(
  '/',
  protect,
  adminOnly,
  upload.array('images', 5),
  validate(createProductSchema),
  createProduct
);

router.put(
  '/:id',
  protect,
  adminOnly,
  upload.array('images', 5),
  updateProduct
);

router.delete('/:id', protect, adminOnly, deleteProduct);

module.exports = router;
