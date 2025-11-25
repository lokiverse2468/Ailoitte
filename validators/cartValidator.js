const { body } = require('express-validator');

const addToCartValidator = [
  body('productId')
    .isInt()
    .withMessage('Product ID must be an integer'),
  body('quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer')
];

const updateCartItemValidator = [
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer')
];

module.exports = {
  addToCartValidator,
  updateCartItemValidator
};


