const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus
} = require('../controllers/orderController');
const { authenticate, authorize } = require('../middleware/auth');
const { body } = require('express-validator');

router.post('/', authenticate, createOrder);
router.get('/my-orders', authenticate, getMyOrders);
router.get('/:id', authenticate, getOrderById);

router.get('/', authenticate, authorize('admin'), getAllOrders);
router.put(
  '/:id/status',
  authenticate,
  authorize('admin'),
  body('status')
    .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Invalid order status'),
  updateOrderStatus
);

module.exports = router;


