const sequelize = require('../config/database');
const User = require('./User');
const Category = require('./Category');
const Product = require('./Product');
const CartItem = require('./CartItem');
const Order = require('./Order');
const OrderItem = require('./OrderItem');

Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products' });

CartItem.belongsTo(User, { foreignKey: 'userId', as: 'user' });
CartItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
User.hasMany(CartItem, { foreignKey: 'userId', as: 'cartItems' });
Product.hasMany(CartItem, { foreignKey: 'productId', as: 'cartItems' });

Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'orderItems' });
User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });

OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
Product.hasMany(OrderItem, { foreignKey: 'productId', as: 'orderItems' });

module.exports = {
  sequelize,
  User,
  Category,
  Product,
  CartItem,
  Order,
  OrderItem
};


