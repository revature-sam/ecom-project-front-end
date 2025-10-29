// EXAMPLE: How App.js would change for backend integration
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import './App.css';
import Home from './components/Home';
import Checkout from './components/Checkout';
import Login from './components/Login';
import Account from './components/Account';
import Cart from './components/Cart';
import Navbar from './components/Navbar';
import apiService from './services/apiService';

// Sample products would come from backend
const sampleProducts = [
  { id: 't1', name: 'Aurora Smartphone', category: 'Phones', price: 799.99, image: 'https://via.placeholder.com/400x300?text=Aurora+Phone' },
  // ... rest of products
];

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [cart, setCart] = useState([]);
  const [query, setQuery] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [bump, setBump] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState(sampleProducts);
  const [loading, setLoading] = useState(true);
  
  const isHomePage = location.pathname === '/';
  
  // Load user and products from backend on app start
  useEffect(() => {
    async function initializeApp() {
      try {
        setLoading(true);
        
        // Load products from backend
        const productsData = await apiService.getProducts();
        setProducts(productsData);
        
        // Check if user is already logged in
        const token = localStorage.getItem('authToken');
        if (token) {
          const userData = await apiService.getCurrentUser();
          setUser(userData);
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
        // Fallback to sample data if backend unavailable
        setProducts(sampleProducts);
      } finally {
        setLoading(false);
      }
    }
    
    initializeApp();
  }, []);
  
  const suggestions = query.trim().length > 0
    ? (() => {
        const q = query.trim().toLowerCase();
        const seen = new Set();
        return products
          .filter((p) => p.name.toLowerCase().includes(q) && !seen.has(p.name) && (seen.add(p.name), true))
          .slice(0, 6)
          .map((p) => ({ name: p.name, image: p.image }));
      })()
    : [];

  // ... existing cart handlers remain the same ...

  async function handleLogin(userData) {
    try {
      // Login is handled in the Login component
      // Just update local state here
      setUser(userData);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async function handleLogout() {
    try {
      await apiService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
      // Still clear local state even if API call fails
      setUser(null);
    }
  }

  async function handlePlaceOrder(orderData) {
    try {
      if (user) {
        // Create order via API
        const newOrder = await apiService.createOrder({
          items: orderData.items,
          total: orderData.total,
          subtotal: orderData.subtotal,
          discountAmount: orderData.discountAmount,
          tax: orderData.tax,
          shipping: orderData.shipping
        });
        
        // Update user's orders in local state
        const updatedUser = {
          ...user,
          orders: [newOrder, ...(user.orders || [])]
        };
        setUser(updatedUser);
      }
      
      // Clear cart after order
      setCart([]);
    } catch (error) {
      console.error('Failed to place order:', error);
      throw error;
    }
  }

  if (loading) {
    return (
      <div className="App">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <Navbar
        query={query}
        onChange={setQuery}
        suggestions={suggestions}
        onSelectSuggestion={(s) => setQuery(s)}
        cartCount={cart.reduce((s, c) => s + c.quantity, 0)}
        onToggle={() => setCartOpen((v) => !v)}
        bump={bump}
        user={user}
        isHomePage={isHomePage}
      />
      <div className={isHomePage ? "app-grid" : ""}>
        <Routes>
          <Route 
            path="/" 
            element={
              <Home
                products={products}
                onAddToCart={handleAdd}
                query={query}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />
            } 
          />
          <Route 
            path="/checkout" 
            element={
              <Checkout
                cart={cart}
                onUpdateCart={setCart}
                onPlaceOrder={handlePlaceOrder}
              />
            } 
          />
          <Route 
            path="/login" 
            element={
              <Login onLogin={handleLogin} />
            } 
          />
          <Route 
            path="/account" 
            element={
              user ? (
                <Account user={user} onLogout={handleLogout} />
              ) : (
                <Login onLogin={handleLogin} />
              )
            } 
          />
        </Routes>

        {isHomePage && (
          <>
            <Cart 
              items={cart} 
              onRemove={handleRemove} 
              onChangeQuantity={handleChangeQuantity} 
              onCheckout={handleCheckout}
              className={cartOpen ? 'open' : ''} 
            />
            <div className={`overlay ${cartOpen ? 'open' : ''}`} onClick={() => setCartOpen(false)} />
          </>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}