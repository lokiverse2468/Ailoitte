const express = require('express');
const router = express.Router();
const {
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart
} = require('../controllers/cartController');
const {
  addToCartValidator,
  updateCartItemValidator
} = require('../validators/cartValidator');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, addToCartValidator, addToCart);
router.get('/', authenticate, getCart);
router.put('/:id', authenticate, updateCartItemValidator, updateCartItem);
router.delete('/:id', authenticate, removeFromCart);
router.delete('/', authenticate, clearCart);

module.exports = router;


