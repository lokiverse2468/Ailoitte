const express = require('express');
const router = express.Router();
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const {
  createProductValidator,
  updateProductValidator,
  productFilterValidator
} = require('../validators/productValidator');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', productFilterValidator, getAllProducts);
router.get('/:id', getProductById);

router.post(
  '/',
  authenticate,
  authorize('admin'),
  upload.single('image'),
  createProductValidator,
  createProduct
);
router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  upload.single('image'),
  updateProductValidator,
  updateProduct
);
router.delete('/:id', authenticate, authorize('admin'), deleteProduct);

module.exports = router;


