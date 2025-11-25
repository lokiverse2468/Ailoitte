# Ailoitte - E-Commerce REST API

A comprehensive RESTful API for an e-commerce platform built with Node.js, Express.js, and PostgreSQL. This API supports user authentication, product management with Cloudinary image upload, category management, product filtering, shopping cart with persistent pricing, and order processing.

## Features

- **User Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (Admin & Customer)
  - Secure password hashing with bcrypt

- **Product Management**
  - CRUD operations for products
  - Cloudinary image upload
  - Category assignment
  - Stock management

- **Category Management**
  - CRUD operations for categories
  - Admin-only access

- **Product Filtering**
  - Filter by price range
  - Filter by category
  - Search by product name
  - Pagination support

- **Shopping Cart**
  - Add/remove items
  - Update quantities
  - Persistent pricing (price at time of adding to cart)

- **Order Management**
  - Place orders from cart
  - View order history
  - Order status tracking
  - Persistent pricing in orders

- **API Documentation**
  - Swagger/OpenAPI documentation
  - Interactive API explorer

- **Testing**
  - Comprehensive test suite with Jest
  - Test coverage for all major features

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer + Cloudinary
- **Validation**: express-validator
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest, Supertest
- **Security**: Helmet, CORS

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- Cloudinary account (for image uploads)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone https://github.com/lokiverse2468/Ailoitte.git
cd Ailoitte
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory:
```env
PORT=3000
NODE_ENV=development

DATABASE_URL=your_postgresql_connection_string
# OR use individual parameters:
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ecommerce_db
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

4. Set up the database:
   - Create a PostgreSQL database
   - Run the SQL schema file: `database/schema.sql`
   - Optionally, run the seed file for sample data: `database/seed.sql`

5. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## API Documentation

Once the server is running, access the Swagger API documentation at:
```
http://localhost:3000/api-docs
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get current user profile

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get category by ID
- `POST /api/categories` - Create category (Admin only)
- `PUT /api/categories/:id` - Update category (Admin only)
- `DELETE /api/categories/:id` - Delete category (Admin only)

### Products
- `GET /api/products` - Get all products (with filters)
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product (Admin only)
- `PUT /api/products/:id` - Update product (Admin only)
- `DELETE /api/products/:id` - Delete product (Admin only)

**Product Filters:**
- `?minPrice=10` - Minimum price
- `?maxPrice=100` - Maximum price
- `?categoryId=1` - Filter by category
- `?search=laptop` - Search by name
- `?page=1&limit=10` - Pagination

### Cart
- `GET /api/cart` - Get user's cart
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/:id` - Update cart item quantity
- `DELETE /api/cart/:id` - Remove item from cart
- `DELETE /api/cart` - Clear cart

### Orders
- `POST /api/orders` - Create order from cart
- `GET /api/orders/my-orders` - Get user's orders
- `GET /api/orders/:id` - Get order by ID
- `GET /api/orders` - Get all orders (Admin only)
- `PUT /api/orders/:id/status` - Update order status (Admin only)

## Testing

Run the test suite:
```bash
npm test
```

Run tests with coverage:
```bash
npm test -- --coverage
```

## Project Structure

```
├── config/           # Configuration files (database, cloudinary)
├── controllers/      # Request handlers
├── database/         # SQL schema and seed files
├── middleware/       # Custom middleware (auth, upload, error handling)
├── models/           # Sequelize models
├── routes/           # API routes
├── swagger/          # Swagger documentation
├── tests/            # Test files
├── utils/            # Utility functions
├── validators/       # Input validation rules
├── server.js         # Application entry point
└── package.json      # Dependencies and scripts
```

## Security Features

- JWT authentication for protected routes
- Password hashing with bcrypt
- Input validation with express-validator
- Helmet for security headers
- CORS configuration
- Environment variable management

## Persistent Cart Pricing

The API implements persistent pricing for cart items and orders:
- When a product is added to cart, the current price is stored in `priceAtAdded`
- When an order is placed, the cart item prices are preserved in `priceAtOrder`
- This ensures that price changes don't affect items already in cart or completed orders

## Error Handling

The API includes comprehensive error handling:
- Validation errors
- Authentication/authorization errors
- Database errors
- File upload errors
- Custom error messages with appropriate HTTP status codes

## License

ISC

## Author

Developed as part of Ailoitte Technologies assignment
