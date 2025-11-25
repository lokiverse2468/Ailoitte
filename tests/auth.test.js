const request = require('supertest');
const app = require('../server');
const { User } = require('../models');

describe('Authentication API', () => {
  beforeEach(async () => {
    // Clean up test data - delete only test users (not all users)
    await User.destroy({ where: { email: ['test@example.com'] }, force: true });
  });

  describe('POST /api/auth/signup', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'Test1234',
          role: 'customer'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.token).toBeDefined();
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'invalid-email',
          password: 'Test1234'
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 for weak password', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: '123'
        });

      expect(response.status).toBe(400);
    });

    it('should return 409 for duplicate email', async () => {
      await User.create({
        email: 'test@example.com',
        password: 'Test1234',
        role: 'customer'
      });

      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'Test1234'
        });

      expect(response.status).toBe(409);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await User.create({
        email: 'test@example.com',
        password: 'Test1234',
        role: 'customer'
      });
      // Wait for password hashing to complete
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test1234'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
    });

    it('should return 401 for invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrong@example.com',
          password: 'Test1234'
        });

      expect(response.status).toBe(401);
    });

    it('should return 401 for invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/auth/profile', () => {
    let token;
    let user;

    beforeEach(async () => {
      await User.destroy({ where: { email: 'test@example.com' }, force: true });
      
      const signupResponse = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'Test1234',
          role: 'customer'
        });

      if (signupResponse.status === 201 && signupResponse.body.data && signupResponse.body.data.token) {
        token = signupResponse.body.data.token;
        user = await User.findOne({ where: { email: 'test@example.com' } });
      } else if (signupResponse.status === 409) {
        const loginResponse = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'test@example.com',
            password: 'Test1234'
          });
        if (loginResponse.status === 200 && loginResponse.body.data && loginResponse.body.data.token) {
          token = loginResponse.body.data.token;
          user = await User.findOne({ where: { email: 'test@example.com' } });
        } else {
          throw new Error(`Login failed: ${loginResponse.status} - ${JSON.stringify(loginResponse.body)}`);
        }
      } else {
        throw new Error(`Signup failed: ${signupResponse.status} - ${JSON.stringify(signupResponse.body)}`);
      }
    });

    it('should get user profile with valid token', async () => {
      let verifyUser = await User.findByPk(user.id);
      if (!verifyUser) {
        verifyUser = await User.findOne({ where: { email: 'test@example.com' } });
        if (!verifyUser) {
          const signupResponse = await request(app)
            .post('/api/auth/signup')
            .send({
              email: 'test@example.com',
              password: 'Test1234',
              role: 'customer'
            });
          if (signupResponse.status === 201 && signupResponse.body.data) {
            verifyUser = await User.findByPk(signupResponse.body.data.user.id);
            token = signupResponse.body.data.token;
          }
        } else {
          const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
              email: 'test@example.com',
              password: 'Test1234'
            });
          if (loginResponse.status === 200 && loginResponse.body.data && loginResponse.body.data.token) {
            token = loginResponse.body.data.token;
          }
        }
        user = verifyUser;
      }
      
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.user.email).toBe('test@example.com');
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile');

      expect(response.status).toBe(401);
    });
  });
});


