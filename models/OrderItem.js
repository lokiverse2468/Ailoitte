const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OrderItem = sequelize.define('OrderItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'orders',
      key: 'id'
    }
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  priceAtOrder: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Price at the time order was placed'
  }
}, {
  tableName: 'order_items',
  timestamps: true,
  updatedAt: false  // order_items table doesn't have updated_at column
});

module.exports = OrderItem;


