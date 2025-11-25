const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'E-Commerce REST API',
      version: '1.0.0',
      description: 'E-Commerce REST API with Cloudinary Image Upload, Categories, Product Filters, and Persistent Cart Pricing',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['admin', 'customer'] }
          }
        },
        Category: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            description: { type: 'string' }
          }
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number', format: 'float' },
            stock: { type: 'integer' },
            categoryId: { type: 'integer' },
            imageUrl: { type: 'string' }
          }
        },
        CartItem: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            productId: { type: 'integer' },
            quantity: { type: 'integer' },
            priceAtAdded: { type: 'number', format: 'float' }
          }
        },
        Order: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            userId: { type: 'integer' },
            totalAmount: { type: 'number', format: 'float' },
            status: { type: 'string', enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./routes/*.js', './swagger/paths/*.js']
};

const specs = swaggerJsdoc(options);

module.exports = { swaggerUi, specs };


