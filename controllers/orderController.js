const { Order, OrderItem, CartItem, Product } = require('../models');
const { Op } = require('sequelize');

const createOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const cartItems = await CartItem.findAll({
      where: { userId },
      include: [{
        association: 'product'
      }]
    });

    if (cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty. Add items to cart before placing an order'
      });
    }

    let totalAmount = 0;
    const orderItemsData = [];

    for (const cartItem of cartItems) {
      if (!cartItem.product) {
        return res.status(400).json({
          success: false,
          message: `Product with ID ${cartItem.productId} no longer exists`
        });
      }

      if (cartItem.product.stock < cartItem.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${cartItem.product.name}. Only ${cartItem.product.stock} items available`
        });
      }

      const itemTotal = parseFloat(cartItem.priceAtAdded) * cartItem.quantity;
      totalAmount += itemTotal;

      orderItemsData.push({
        productId: cartItem.productId,
        quantity: cartItem.quantity,
        priceAtOrder: cartItem.priceAtAdded
      });
    }

    const order = await Order.create({
      userId,
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      status: 'pending'
    });

    const orderItems = await Promise.all(
      orderItemsData.map(itemData =>
        OrderItem.create({
          orderId: order.id,
          ...itemData
        })
      )
    );

    for (const cartItem of cartItems) {
      await Product.update(
        { stock: cartItem.product.stock - cartItem.quantity },
        { where: { id: cartItem.productId } }
      );
    }

    await CartItem.destroy({ where: { userId } });

    const orderWithDetails = await Order.findByPk(order.id, {
      include: [{
        association: 'orderItems',
        include: [{
          association: 'product',
          attributes: ['id', 'name', 'imageUrl']
        }]
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: { order: orderWithDetails }
    });
  } catch (error) {
    next(error);
  }
};

const getMyOrders = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Order.findAndCountAll({
      where: { userId },
      include: [{
        association: 'orderItems',
        include: [{
          association: 'product',
          attributes: ['id', 'name', 'imageUrl']
        }]
      }],
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / parseInt(limit))
      },
      data: { orders: rows }
    });
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const where = { id };
    if (!isAdmin) {
      where.userId = userId;
    }

    const order = await Order.findOne({
      where,
      include: [{
        association: 'orderItems',
        include: [{
          association: 'product',
          attributes: ['id', 'name', 'imageUrl', 'description']
        }]
      }]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: { order }
    });
  } catch (error) {
    next(error);
  }
};

const getAllOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    if (status) {
      where.status = status;
    }

    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [{
        association: 'user',
        attributes: ['id', 'email']
      }, {
        association: 'orderItems',
        include: [{
          association: 'product',
          attributes: ['id', 'name', 'imageUrl']
        }]
      }],
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / parseInt(limit))
      },
      data: { orders: rows }
    });
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    await order.update({ status });

    const updatedOrder = await Order.findByPk(order.id, {
      include: [{
        association: 'orderItems',
        include: [{
          association: 'product',
          attributes: ['id', 'name', 'imageUrl']
        }]
      }]
    });

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: { order: updatedOrder }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus
};


