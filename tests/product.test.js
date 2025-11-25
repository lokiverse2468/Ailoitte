const request = require('supertest');
const app = require('../server');
const { User, Category, Product } = require('../models');

describe('Product API', () => {
  let adminToken;
  let customerToken;
  let category;

  beforeAll(async () => {
    // Clean up any existing test data first
    await Product.destroy({ where: {}, force: true });
    await Category.destroy({ where: {}, force: true });
    await User.destroy({ where: { email: ['admin@test.com', 'customer@test.com'] }, force: true });

    // Create admin user - try signup first, fallback to login or direct creation
    let adminUser;
    try {
      const adminSignup = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'admin@test.com',
          password: 'Admin123',
          role: 'admin'
        });

      if (adminSignup.status === 201 && adminSignup.body.data && adminSignup.body.data.token) {
        adminToken = adminSignup.body.data.token;
        adminUser = await User.findByPk(adminSignup.body.data.user.id);
      } else if (adminSignup.status === 409) {
        // User already exists, try to login
        const loginResponse = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'admin@test.com',
            password: 'Admin123'
          });
        if (loginResponse.status === 200 && loginResponse.body.data && loginResponse.body.data.token) {
          adminToken = loginResponse.body.data.token;
          adminUser = await User.findOne({ where: { email: 'admin@test.com' } });
        } else {
          throw new Error(`Login failed after signup conflict: ${loginResponse.status}`);
        }
      } else {
        throw new Error(`Admin signup returned ${adminSignup.status}: ${JSON.stringify(adminSignup.body)}`);
      }
    } catch (error) {
      console.error('Error in admin creation, using fallback:', error.message);
      // Fallback: find existing user or create new one
      try {
        adminUser = await User.findOne({ where: { email: 'admin@test.com' } });
        if (!adminUser) {
          adminUser = await User.create({
            email: 'admin@test.com',
            password: 'Admin123',
            role: 'admin'
          });
        }
        const { generateToken } = require('../utils/jwt');
        adminToken = generateToken(adminUser.id);
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError.message);
        // Last resort: try to find user even if creation failed
        adminUser = await User.findOne({ where: { email: 'admin@test.com' } });
        if (adminUser) {
          const { generateToken } = require('../utils/jwt');
          adminToken = generateToken(adminUser.id);
        } else {
          throw new Error(`Failed to create admin user: ${fallbackError.message}`);
        }
      }
    }
    
    if (!adminUser || !adminToken) {
      console.error('AdminUser:', adminUser ? 'exists' : 'missing', 'Token:', adminToken ? 'exists' : 'missing');
      throw new Error('Failed to create or retrieve admin user');
    }

    // Create customer user - try signup first, fallback to login or direct creation
    let customerUser;
    try {
      const customerSignup = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'customer@test.com',
          password: 'Customer123',
          role: 'customer'
        });

      if (customerSignup.status === 201 && customerSignup.body.data && customerSignup.body.data.token) {
        customerToken = customerSignup.body.data.token;
        customerUser = await User.findByPk(customerSignup.body.data.user.id);
      } else if (customerSignup.status === 409) {
        // User already exists, try to login
        const loginResponse = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'customer@test.com',
            password: 'Customer123'
          });
        if (loginResponse.status === 200 && loginResponse.body.data && loginResponse.body.data.token) {
          customerToken = loginResponse.body.data.token;
          customerUser = await User.findOne({ where: { email: 'customer@test.com' } });
        } else {
          throw new Error(`Login failed after signup conflict: ${loginResponse.status}`);
        }
      } else {
        throw new Error(`Customer signup returned ${customerSignup.status}: ${JSON.stringify(customerSignup.body)}`);
      }
    } catch (error) {
      console.error('Error in customer creation, using fallback:', error.message);
      // Fallback: find existing user or create new one
      try {
        customerUser = await User.findOne({ where: { email: 'customer@test.com' } });
        if (!customerUser) {
          customerUser = await User.create({
            email: 'customer@test.com',
            password: 'Customer123',
            role: 'customer'
          });
        }
        const { generateToken } = require('../utils/jwt');
        customerToken = generateToken(customerUser.id);
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError.message);
        // Last resort: try to find user even if creation failed
        customerUser = await User.findOne({ where: { email: 'customer@test.com' } });
        if (customerUser) {
          const { generateToken } = require('../utils/jwt');
          customerToken = generateToken(customerUser.id);
        } else {
          throw new Error(`Failed to create customer user: ${fallbackError.message}`);
        }
      }
    }
    
    if (!customerUser || !customerToken) {
      console.error('CustomerUser:', customerUser ? 'exists' : 'missing', 'Token:', customerToken ? 'exists' : 'missing');
      throw new Error('Failed to create or retrieve customer user');
    }
    
    if (!adminToken || !customerToken) {
      throw new Error('Failed to get tokens for product tests');
    }

    // Create category (or get existing one)
    const existingCategory = await Category.findOne({ where: { name: 'Electronics' } });
    if (existingCategory) {
      category = existingCategory;
    } else {
      category = await Category.create({
        name: 'Electronics',
        description: 'Electronic items'
      });
    }
  });

  afterAll(async () => {
    // Clean up in order respecting foreign key constraints
    // Only clean up test data, not all data
    await Product.destroy({ where: { name: ['Test Product', 'Product 1', 'Product 2'] }, force: true });
    await Category.destroy({ where: { name: 'Electronics' }, force: true });
    await User.destroy({ where: { email: ['admin@test.com', 'customer@test.com'] }, force: true });
  });

  describe('POST /api/products', () => {
    it('should create a product as admin', async () => {
      // Verify token and category exist
      if (!adminToken) {
        throw new Error('Admin token is undefined');
      }
      if (!category || !category.id) {
        throw new Error('Category is undefined or invalid');
      }
      
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Product',
          description: 'Test Description',
          price: 99.99,
          stock: 100,
          categoryId: category.id
        });

      if (response.status === 401) {
        console.error('Auth failed. Response:', response.body);
        console.error('Token used:', adminToken ? adminToken.substring(0, 20) + '...' : 'undefined');
      }

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.product.name).toBe('Test Product');
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          name: 'Test Product',
          price: 99.99,
          stock: 100
        });

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/products', () => {
    beforeEach(async () => {
      // Always get fresh category - find or create
      let testCategory = await Category.findOne({ where: { name: 'Electronics' } });
      if (!testCategory) {
        testCategory = await Category.create({
          name: 'Electronics',
          description: 'Electronic items'
        });
      }
      
      // Verify category exists in database - if not, recreate
      let verifyCategory = await Category.findByPk(testCategory.id);
      if (!verifyCategory) {
        // Recreate if somehow deleted
        verifyCategory = await Category.create({
          name: 'Electronics',
          description: 'Electronic items'
        });
      }
      
      category.id = verifyCategory.id;

      // Clean up existing products first to avoid duplicates
      await Product.destroy({ where: { name: ['Product 1', 'Product 2'] }, force: true });

      // Always get fresh category before creating products
      let finalCategory = await Category.findOne({ where: { name: 'Electronics' } });
      if (!finalCategory) {
        // Create category if it doesn't exist
        finalCategory = await Category.create({
          name: 'Electronics',
          description: 'Electronic items'
        });
      }
      
      // Verify category exists in database before using - query fresh instead of reload
      const categoryCheck = await Category.findByPk(finalCategory.id);
      if (!categoryCheck) {
        // Category was deleted, recreate it
        finalCategory = await Category.create({
          name: 'Electronics',
          description: 'Electronic items'
        });
      }
      
      const categoryId = finalCategory.id;

      // Create products with verified category ID - wrap in try-catch to handle foreign key errors
      try {
        await Product.create({
          name: 'Product 1',
          price: 50.00,
          stock: 50,
          categoryId: categoryId
        });
      } catch (error) {
        if (error.name === 'SequelizeForeignKeyConstraintError') {
          // Category was deleted, recreate it
          const newCategory = await Category.create({
            name: 'Electronics',
            description: 'Electronic items'
          });
          await Product.create({
            name: 'Product 1',
            price: 50.00,
            stock: 50,
            categoryId: newCategory.id
          });
          await Product.create({
            name: 'Product 2',
            price: 150.00,
            stock: 30,
            categoryId: newCategory.id
          });
          return; // Exit early if we recreated
        }
        throw error;
      }
      
      // Verify category still exists before creating second product - always get fresh
      let categoryForProduct2 = await Category.findByPk(categoryId);
      if (!categoryForProduct2) {
        // Recreate if deleted
        categoryForProduct2 = await Category.create({
          name: 'Electronics',
          description: 'Electronic items'
        });
      }
      
      // Create Product 2 with verified category - wrap in try-catch
      try {
        await Product.create({
          name: 'Product 2',
          price: 150.00,
          stock: 30,
          categoryId: categoryForProduct2.id
        });
      } catch (error) {
        if (error.name === 'SequelizeForeignKeyConstraintError') {
          // Category was deleted, recreate it and product
          const freshCategory = await Category.create({
            name: 'Electronics',
            description: 'Electronic items'
          });
          await Product.create({
            name: 'Product 2',
            price: 150.00,
            stock: 30,
            categoryId: freshCategory.id
          });
        } else {
          throw error;
        }
      }
    });

    afterEach(async () => {
      // Only destroy test products, keep categories
      await Product.destroy({ where: { name: ['Product 1', 'Product 2'] }, force: true });
    });

    it('should get all products', async () => {
      let productsBefore = await Product.findAll({ where: { name: ['Product 1', 'Product 2'] } });
      if (productsBefore.length === 0) {
        let testCategory = await Category.findOne({ where: { name: 'Electronics' } });
        if (!testCategory) {
          testCategory = await Category.create({
            name: 'Electronics',
            description: 'Electronic items'
          });
        }
        await Product.create({
          name: 'Product 1',
          price: 50.00,
          stock: 50,
          categoryId: testCategory.id
        });
        await Product.create({
          name: 'Product 2',
          price: 150.00,
          stock: 30,
          categoryId: testCategory.id
        });
        productsBefore = await Product.findAll({ where: { name: ['Product 1', 'Product 2'] } });
      }
      
      const response = await request(app)
        .get('/api/products');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.products.length).toBeGreaterThan(0);
    });

    it('should filter products by price range', async () => {
      const response = await request(app)
        .get('/api/products?minPrice=100&maxPrice=200');

      expect(response.status).toBe(200);
      expect(response.body.data.products.every(p => parseFloat(p.price) >= 100 && parseFloat(p.price) <= 200)).toBe(true);
    });

    it('should filter products by category', async () => {
      const response = await request(app)
        .get(`/api/products?categoryId=${category.id}`);

      expect(response.status).toBe(200);
      expect(response.body.data.products.every(p => p.categoryId === category.id)).toBe(true);
    });

    it('should search products by name', async () => {
      const response = await request(app)
        .get('/api/products?search=Product 1');

      expect(response.status).toBe(200);
      expect(response.body.data.products.some(p => p.name.includes('Product 1'))).toBe(true);
    });

    it('should paginate products', async () => {
      const response = await request(app)
        .get('/api/products?page=1&limit=1');

      expect(response.status).toBe(200);
      expect(response.body.data.products.length).toBe(1);
      expect(response.body.pagination).toBeDefined();
    });
  });
});
