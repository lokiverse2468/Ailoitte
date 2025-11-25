import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/products`);
      setProducts(response.data.data.products);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>E-Commerce Store</h1>
        {loading && <p>Loading products...</p>}
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
        {!loading && !error && (
          <div className="products-container">
            <h2>Products ({products.length})</h2>
            <div className="products-grid">
              {products.map(product => (
                <div key={product.id} className="product-card">
                  {product.imageUrl && (
                    <img src={product.imageUrl} alt={product.name} className="product-image" />
                  )}
                  <h3>{product.name}</h3>
                  <p className="price">${product.price}</p>
                  <p className="stock">Stock: {product.stock}</p>
                  {product.description && <p className="description">{product.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;

