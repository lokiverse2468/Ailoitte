const { CartItem, Product } = require('../models');
const { validationResult } = require('express-validator');

const addToCart = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { productId } = req.body;
    const quantity = parseInt(req.body.quantity) || 1;
    const userId = req.user.id;

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Only ${product.stock} items available`
      });
    }

    const existingCartItem = await CartItem.findOne({
      where: { userId, productId }
    });

    if (existingCartItem) {
      const newQuantity = existingCartItem.quantity + quantity;
      if (product.stock < newQuantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock. Only ${product.stock} items available`
        });
      }

      await existingCartItem.update({
        quantity: newQuantity,
        priceAtAdded: parseFloat(product.price)
      });

      const updatedItem = await CartItem.findByPk(existingCartItem.id, {
        include: [{
          association: 'product',
          attributes: ['id', 'name', 'price', 'imageUrl']
        }]
      });

      return res.json({
        success: true,
        message: 'Cart updated successfully',
        data: { cartItem: updatedItem }
      });
    }

    const cartItem = await CartItem.create({
      userId,
      productId,
      quantity,
      priceAtAdded: parseFloat(product.price)
    });

    const cartItemWithProduct = await CartItem.findByPk(cartItem.id, {
      include: [{
        association: 'product',
        attributes: ['id', 'name', 'price', 'imageUrl']
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Item added to cart successfully',
      data: { cartItem: cartItemWithProduct }
    });
  } catch (error) {
    next(error);
  }
};

const getCart = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const cartItems = await CartItem.findAll({
      where: { userId },
      include: [{
        association: 'product',
        attributes: ['id', 'name', 'price', 'stock', 'imageUrl', 'description']
      }],
      order: [['createdAt', 'DESC']]
    });

    const total = cartItems.reduce((sum, item) => {
      return sum + (parseFloat(item.priceAtAdded) * item.quantity);
    }, 0);

    res.json({
      success: true,
      data: {
        cartItems,
        total: parseFloat(total.toFixed(2)),
        itemCount: cartItems.length
      }
    });
  } catch (error) {
    next(error);
  }
};

const updateCartItem = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { quantity } = req.body;
    const userId = req.user.id;

    const cartItem = await CartItem.findOne({
      where: { id, userId },
      include: [{
        association: 'product'
      }]
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }

    // Check stock availability
    if (cartItem.product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Only ${cartItem.product.stock} items available`
      });
    }

    await cartItem.update({ quantity: parseInt(quantity) });

    const updatedItem = await CartItem.findByPk(cartItem.id, {
      include: [{
        association: 'product',
        attributes: ['id', 'name', 'price', 'imageUrl']
      }]
    });

    res.json({
      success: true,
      message: 'Cart item updated successfully',
      data: { cartItem: updatedItem }
    });
  } catch (error) {
    next(error);
  }
};

const removeFromCart = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const cartItem = await CartItem.findOne({
      where: { id, userId }
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }

    await cartItem.destroy();

    res.json({
      success: true,
      message: 'Item removed from cart successfully'
    });
  } catch (error) {
    next(error);
  }
};

const clearCart = async (req, res, next) => {
  try {
    const userId = req.user.id;

    await CartItem.destroy({
      where: { userId }
    });

    res.json({
      success: true,
      message: 'Cart cleared successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart
};


