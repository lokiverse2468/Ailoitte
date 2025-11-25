const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CartItem = sequelize.define('CartItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
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
    defaultValue: 1,
    validate: {
      min: 1
    }
  },
  priceAtAdded: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Price at the time item was added to cart'
  }
}, {
  tableName: 'cart_items',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'product_id']
    }
  ]
});

module.exports = CartItem;

