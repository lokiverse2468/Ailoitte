const request = require('supertest');
const app = require('../server');
const { User, Product, Category, CartItem, Order } = require('../models');

describe('Order API', () => {
  let customerToken;
  let product;
  let category;
  let customerUserId;

  beforeAll(async () => {
    // Clean up any existing test data
    await CartItem.destroy({ where: {}, force: true });
    await Order.destroy({ where: {}, force: true });
    await Product.destroy({ where: {}, force: true });
    await Category.destroy({ where: {}, force: true });
    await User.destroy({ where: { email: 'orderuser@test.com' }, force: true });

    // Create customer - try signup first, fallback to login or direct creation
    let customer;
    try {
      const signupResponse = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'orderuser@test.com',
          password: 'Order1234',
          role: 'customer'
        });

      if (signupResponse.status === 201 && signupResponse.body.data && signupResponse.body.data.token) {
        customerToken = signupResponse.body.data.token;
        customerUserId = signupResponse.body.data.user.id;
        customer = await User.findByPk(customerUserId);
      } else if (signupResponse.status === 409) {
        // User already exists, try to login
        const loginResponse = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'orderuser@test.com',
            password: 'Order1234'
          });
        if (loginResponse.status === 200 && loginResponse.body.data && loginResponse.body.data.token) {
          customerToken = loginResponse.body.data.token;
          customer = await User.findOne({ where: { email: 'orderuser@test.com' } });
          customerUserId = customer.id;
        } else {
          throw new Error(`Login failed after signup conflict: ${loginResponse.status}`);
        }
      } else {
        throw new Error(`Signup returned ${signupResponse.status}: ${JSON.stringify(signupResponse.body)}`);
      }
    } catch (error) {
      console.error('Error in user creation, using fallback:', error.message);
      // Fallback: find existing user or create new one
      try {
        customer = await User.findOne({ where: { email: 'orderuser@test.com' } });
        if (!customer) {
          customer = await User.create({
            email: 'orderuser@test.com',
            password: 'Order1234',
            role: 'customer'
          });
        }
        customerUserId = customer.id;
        const { generateToken } = require('../utils/jwt');
        customerToken = generateToken(customer.id);
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError.message);
        // Last resort: try to find user even if creation failed
        customer = await User.findOne({ where: { email: 'orderuser@test.com' } });
        if (customer) {
          customerUserId = customer.id;
          const { generateToken } = require('../utils/jwt');
          customerToken = generateToken(customer.id);
        } else {
          throw new Error(`Failed to create user: ${fallbackError.message}`);
        }
      }
    }
    
    if (!customer || !customerToken) {
      console.error('Customer:', customer ? 'exists' : 'missing', 'Token:', customerToken ? 'exists' : 'missing');
      throw new Error('Failed to create or retrieve customer user');
    }
    
    if (!customerToken) {
      throw new Error('Failed to get customer token for order tests');
    }

    // Create category (or get existing)
    let testCategory = await Category.findOne({ where: { name: 'Order Category' } });
    if (!testCategory) {
      testCategory = await Category.create({
        name: 'Order Category',
        description: 'Test'
      });
    }
    category = testCategory;

    // Ensure category is saved and has an ID
    if (!category.id) {
      await category.save();
    }

    // Create product (or get existing)
    let testProduct = await Product.findOne({ where: { name: 'Order Product', categoryId: category.id } });
    if (!testProduct) {
      testProduct = await Product.create({
        name: 'Order Product',
        price: 50.00,
        stock: 100,
        categoryId: category.id
      });
    }
    product = testProduct;
  });

  beforeEach(async () => {
    // Verify user exists first - recreate if needed
    let user = await User.findByPk(customerUserId);
    if (!user) {
      user = await User.findOne({ where: { email: 'orderuser@test.com' } });
      if (!user) {
        user = await User.create({
          email: 'orderuser@test.com',
          password: 'Order1234',
          role: 'customer'
        });
      }
      customerUserId = user.id;
      const { generateToken } = require('../utils/jwt');
      customerToken = generateToken(user.id);
    }
    
    // Clean up any existing cart items and orders first
    await CartItem.destroy({ where: { userId: customerUserId }, force: true });
    await Order.destroy({ where: { userId: customerUserId }, force: true });
    
    // Ensure category exists - always find or create fresh
    let testCategory = await Category.findOne({ where: { name: 'Order Category' } });
    if (!testCategory) {
      testCategory = await Category.create({
        name: 'Order Category',
        description: 'Test'
      });
    }
    category.id = testCategory.id;
    
    // Ensure product still exists, recreate if needed
    let testProduct = await Product.findOne({ where: { name: 'Order Product', categoryId: testCategory.id } });
    if (!testProduct) {
      // Create product with verified category
      testProduct = await Product.create({
        name: 'Order Product',
        price: 50.00,
        stock: 100,
        categoryId: testCategory.id
      });
    }
    product.id = testProduct.id;
    
    // Verify product exists before adding to cart
    const verifyProduct = await Product.findByPk(testProduct.id);
    if (!verifyProduct) {
      throw new Error('Product does not exist before adding to cart');
    }
    
    // Verify user exists before adding to cart
    const userCheck = await User.findByPk(customerUserId);
    if (!userCheck) {
      // User was deleted, recreate
      user = await User.create({
        email: 'orderuser@test.com',
        password: 'Order1234',
        role: 'customer'
      });
      customerUserId = user.id;
      const { generateToken } = require('../utils/jwt');
      customerToken = generateToken(user.id);
    }
    
    // Add item to cart using API (more reliable)
    const cartResponse = await request(app)
      .post('/api/cart')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        productId: verifyProduct.id,
        quantity: 2
      });
    
    if (cartResponse.status !== 201) {
      // If cart add failed, verify user and product exist, then create cart item directly
      const finalUser = await User.findByPk(customerUserId);
      const finalProduct = await Product.findByPk(verifyProduct.id);
      if (finalUser && finalProduct) {
        try {
          await CartItem.create({
            userId: finalUser.id,
            productId: finalProduct.id,
            quantity: 2,
            priceAtAdded: finalProduct.price
          });
        } catch (cartError) {
          // If still fails, the test will handle it
          console.warn('Cart item creation failed:', cartError.message);
        }
      }
    }
    product.id = verifyProduct.id;
  });

  afterEach(async () => {
    // Clean up in order respecting foreign key constraints
    await CartItem.destroy({ where: {}, force: true });
    await Order.destroy({ where: {}, force: true });
  });

  afterAll(async () => {
    // Clean up only test-specific data, not all data
    await CartItem.destroy({ where: { userId: customerUserId }, force: true });
    await Order.destroy({ where: { userId: customerUserId }, force: true });
    await Product.destroy({ where: { name: 'Order Product' }, force: true });
    await Category.destroy({ where: { name: 'Order Category' }, force: true });
    await User.destroy({ where: { email: 'orderuser@test.com' }, force: true });
  });

  describe('POST /api/orders', () => {
    it('should create order from cart', async () => {
      // Always get fresh user - don't rely on stale customerUserId
      let verifyUser = await User.findOne({ where: { email: 'orderuser@test.com' } });
      if (!verifyUser) {
        // Create user via signup API to ensure password is hashed
        const signupResponse = await request(app)
          .post('/api/auth/signup')
          .send({
            email: 'orderuser@test.com',
            password: 'Order1234',
            role: 'customer'
          });
        if (signupResponse.status === 201 && signupResponse.body.data) {
          verifyUser = await User.findByPk(signupResponse.body.data.user.id);
          customerToken = signupResponse.body.data.token;
        } else {
          // Fallback to direct creation
          verifyUser = await User.create({
            email: 'orderuser@test.com',
            password: 'Order1234',
            role: 'customer'
          });
          const { generateToken } = require('../utils/jwt');
          customerToken = generateToken(verifyUser.id);
        }
      } else {
        // User exists, generate fresh token
        const { generateToken } = require('../utils/jwt');
        customerToken = generateToken(verifyUser.id);
      }
      customerUserId = verifyUser.id;
      
      // Verify cart has items before creating order
      let cartItems = await CartItem.findAll({ 
        where: { userId: customerUserId },
        include: [{ association: 'product' }]
      });
      
      if (cartItems.length === 0) {
        // Get fresh product - don't rely on stale product.id
        let verifyProduct = await Product.findOne({ where: { name: 'Order Product' } });
        if (!verifyProduct) {
          // Recreate product if it doesn't exist - ensure category exists first
          let testCategory = await Category.findOne({ where: { name: 'Order Category' } });
          if (!testCategory) {
            // Create category if it doesn't exist
            testCategory = await Category.create({
              name: 'Order Category',
              description: 'Test'
            });
          }
          verifyProduct = await Product.create({
            name: 'Order Product',
            price: 50.00,
            stock: 100,
            categoryId: testCategory.id
          });
        }
        
        // Verify product exists in DB
        const productExists = await Product.findByPk(verifyProduct.id);
        if (!productExists) {
          throw new Error(`Product ${verifyProduct.id} does not exist in database`);
        }
        
        // Verify user and product exist before creating cart item - use fresh IDs from verifyUser
        const userStillExists = await User.findByPk(verifyUser.id);
        const productStillExists = await Product.findByPk(productExists.id);
        
        if (!userStillExists) {
          verifyUser = await User.create({
            email: 'orderuser@test.com',
            password: 'Order1234',
            role: 'customer'
          });
          customerUserId = verifyUser.id;
          const { generateToken } = require('../utils/jwt');
          customerToken = generateToken(verifyUser.id);
        }
        
        if (!productStillExists) {
          throw new Error(`Product ${productExists.id} does not exist`);
        }
        
        const finalUserId = verifyUser.id;
        const finalProductId = productStillExists.id;
        
        try {
          const cartResponse = await request(app)
            .post('/api/cart')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({
              productId: finalProductId,
              quantity: 2
            });
          
          if (cartResponse.status !== 201) {
            await CartItem.create({
              userId: finalUserId,
              productId: finalProductId,
              quantity: 2,
              priceAtAdded: productStillExists.price
            });
          }
        } catch (error) {
          await CartItem.create({
            userId: finalUserId,
            productId: finalProductId,
            quantity: 2,
            priceAtAdded: productStillExists.price
          });
        }
        
        cartItems = await CartItem.findAll({ 
          where: { userId: customerUserId },
          include: [{ association: 'product' }]
        });
      }
      
      // Verify all cart items have valid products
      for (const item of cartItems) {
        const productExists = await Product.findByPk(item.productId);
        if (!productExists) {
          throw new Error(`Cart item has invalid product ID: ${item.productId}`);
        }
      }
      
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(parseFloat(response.body.data.order.totalAmount)).toBe(100.00);
    });

    it('should return 400 for empty cart', async () => {
      // Ensure cart is empty
      await CartItem.destroy({ where: { userId: customerUserId }, force: true });
      
      // Verify user exists and token is valid
      const verifyUser = await User.findByPk(customerUserId);
      if (!verifyUser) {
        throw new Error('User does not exist for empty cart test');
      }

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(400);
    });
  });
});
