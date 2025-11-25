const request = require('supertest');
const app = require('../server');
const { User, Product, Category, CartItem } = require('../models');

describe('Cart API', () => {
  let customerToken;
  let product;
  let category;
  let customerUserId;

  beforeAll(async () => {
    // Clean up any existing test data
    await CartItem.destroy({ where: {}, force: true });
    await Product.destroy({ where: {}, force: true });
    await Category.destroy({ where: {}, force: true });
    await User.destroy({ where: { email: 'cartuser@test.com' }, force: true });

    // Create customer - try signup first, fallback to login or direct creation
    let customer;
    try {
      const signupResponse = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'cartuser@test.com',
          password: 'Cart1234',
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
            email: 'cartuser@test.com',
            password: 'Cart1234'
          });
        if (loginResponse.status === 200 && loginResponse.body.data && loginResponse.body.data.token) {
          customerToken = loginResponse.body.data.token;
          customer = await User.findOne({ where: { email: 'cartuser@test.com' } });
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
        customer = await User.findOne({ where: { email: 'cartuser@test.com' } });
        if (!customer) {
          customer = await User.create({
            email: 'cartuser@test.com',
            password: 'Cart1234',
            role: 'customer'
          });
        }
        customerUserId = customer.id;
        const { generateToken } = require('../utils/jwt');
        customerToken = generateToken(customer.id);
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError.message);
        // Last resort: try to find user even if creation failed
        customer = await User.findOne({ where: { email: 'cartuser@test.com' } });
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
      throw new Error('Failed to get customer token for cart tests');
    }
    
    // Debug: Log token to verify it's set
    if (!customerToken || customerToken.length < 10) {
      console.error('Invalid token generated:', customerToken);
      throw new Error('Token is invalid or undefined');
    }

    // Ensure category exists
    let existingCategory = await Category.findOne({ where: { name: 'Test Category' } });
    if (existingCategory) {
      category = existingCategory;
    } else {
      category = await Category.create({
        name: 'Test Category',
        description: 'Test'
      });
    }
    
    // Verify category has valid ID
    if (!category || !category.id) {
      throw new Error('Failed to create or retrieve category');
    }

    // Ensure product exists
    let existingProduct = await Product.findOne({ where: { name: 'Test Product', categoryId: category.id } });
    if (existingProduct) {
      product = existingProduct;
    } else {
      // Verify category still exists before creating product
      const verifyCategory = await Category.findByPk(category.id);
      if (!verifyCategory) {
        throw new Error('Category does not exist when creating product');
      }
      product = await Product.create({
        name: 'Test Product',
        price: 99.99,
        stock: 100,
        categoryId: verifyCategory.id
      });
    }
  });

  afterAll(async () => {
    // Clean up in order respecting foreign key constraints
    await CartItem.destroy({ where: {}, force: true });
    await Product.destroy({ where: {}, force: true });
    await Category.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
  });

  describe('POST /api/cart', () => {
    it('should add item to cart', async () => {
      // Verify token exists
      if (!customerToken) {
        throw new Error('Customer token is undefined');
      }
      
      const response = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId: product.id,
          quantity: 2
        });

      if (response.status === 401) {
        console.error('Auth failed. Response:', response.body);
        console.error('Token used:', customerToken ? customerToken.substring(0, 20) + '...' : 'undefined');
      }

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.cartItem.quantity).toBe(2);
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId: 99999,
          quantity: 1
        });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/cart', () => {
    it('should get user cart', async () => {
      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.cartItems).toBeDefined();
    });
  });
});
