INSERT INTO users (email, password, role) VALUES
('admin@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin'),
('customer@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'customer')
ON CONFLICT (email) DO NOTHING;

INSERT INTO categories (name, description) VALUES
('Electronics', 'Electronic devices and gadgets'),
('Clothing', 'Apparel and fashion items'),
('Books', 'Books and reading materials'),
('Home & Garden', 'Home improvement and garden supplies'),
('Sports', 'Sports and outdoor equipment')
ON CONFLICT (name) DO NOTHING;

INSERT INTO products (name, description, price, stock, category_id) VALUES
('Laptop', 'High-performance laptop for work and gaming', 999.99, 50, 1),
('Smartphone', 'Latest smartphone with advanced features', 699.99, 100, 1),
('T-Shirt', 'Comfortable cotton t-shirt', 19.99, 200, 2),
('Jeans', 'Classic blue jeans', 49.99, 150, 2),
('Programming Book', 'Learn Node.js programming', 39.99, 75, 3),
('Garden Tools Set', 'Complete set of garden tools', 89.99, 30, 4),
('Basketball', 'Official size basketball', 24.99, 80, 5)
ON CONFLICT DO NOTHING;

