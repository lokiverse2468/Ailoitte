const express = require('express');
const router = express.Router();
const {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');
const {
  createCategoryValidator,
  updateCategoryValidator
} = require('../validators/categoryValidator');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', getAllCategories);
router.get('/:id', getCategoryById);

router.post('/', authenticate, authorize('admin'), createCategoryValidator, createCategory);
router.put('/:id', authenticate, authorize('admin'), updateCategoryValidator, updateCategory);
router.delete('/:id', authenticate, authorize('admin'), deleteCategory);

module.exports = router;


