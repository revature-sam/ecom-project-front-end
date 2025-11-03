import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import './App.css';
import Home from './components/Home';
import Checkout from './components/Checkout';
import Login from './components/Login';
import Account from './components/Account';
import Cart from './components/Cart';
import Navbar from './components/Navbar';
import Notification from './components/Notification';
import apiService from './services/apiService';

// Fallback products for offline mode
const sampleProducts = [
  { id: 't1', name: 'Aurora Smartphone', category: 'Phones', price: 799.99, image: 'https://via.placeholder.com/400x300?text=Aurora+Phone' },
  { id: 't2', name: 'Nebula Laptop Pro', category: 'Laptops', price: 1299.0, image: 'https://via.placeholder.com/400x300?text=Nebula+Laptop' },
  { id: 't3', name: 'Quantum Earbuds', category: 'Audio', price: 149.99, image: 'https://via.placeholder.com/400x300?text=Quantum+Earbuds' },
  { id: 't4', name: 'Photon Charger', category: 'Accessories', price: 29.99, image: 'https://via.placeholder.com/400x300?text=Photon+Charger' },
  { id: 't5', name: 'Horizon Tablet', category: 'Laptops', price: 599.99, image: 'https://via.placeholder.com/400x300?text=Horizon+Tablet' },
  { id: 't6', name: 'Voyager Smartwatch', category: 'Accessories', price: 199.0, image: 'https://via.placeholder.com/400x300?text=Voyager+Watch' },
  { id: 't7', name: 'Echo Studio Speaker', category: 'Audio', price: 249.5, image: 'https://via.placeholder.com/400x300?text=Echo+Speaker' },
  { id: 't8', name: 'Pulse Gaming Phone', category: 'Phones', price: 999.99, image: 'https://via.placeholder.com/400x300?text=Pulse+Phone' },
  { id: 't9', name: 'Atlas Mechanical Keyboard', category: 'Accessories', price: 119.99, image: 'https://via.placeholder.com/400x300?text=Atlas+Keyboard' },
  { id: 't10', name: 'Nimbus Ultrabook', category: 'Laptops', price: 1499.99, image: 'https://via.placeholder.com/400x300?text=Nimbus+Ultrabook' },
];

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [query, setQuery] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [bump, setBump] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [user, setUser] = useState(null);
  const [priceRange, setPriceRange] = useState([0, 1500]);
  const [sortBy, setSortBy] = useState('name');
  const [notification, setNotification] = useState({ message: '', type: 'info', isVisible: false });
  const [products, setProducts] = useState(sampleProducts);
  const [loading, setLoading] = useState(true);
  const [backendAvailable, setBackendAvailable] = useState(false);
  
  const isHomePage = location.pathname === '/';
  
  // Initialize app - try backend first, fallback to localStorage
  useEffect(() => {
    async function initializeApp() {
      try {
        setLoading(true);
        
        // Try to connect to backend and load products
        try {
          const productsData = await apiService.getProducts();
          setProducts(productsData);
          setBackendAvailable(true);
          
          // Check if user is already logged in via token
          const token = localStorage.getItem('authToken');
          if (token) {
            const userData = await apiService.getCurrentUser();
            setUser(userData);
            
            // Load user's wishlist from backend
            const userWishlist = await apiService.getWishlist();
            setWishlist(userWishlist);
          }
          
        } catch (backendError) {
          console.warn('Backend not available, using localStorage fallback:', backendError);
          setBackendAvailable(false);
          
          // Fallback to localStorage logic
          initializeWithLocalStorage();
        }
        
      } catch (error) {
        console.error('Failed to initialize app:', error);
        showNotification('Failed to load application data', 'error');
      } finally {
        setLoading(false);
      }
    }
    
    function initializeWithLocalStorage() {
      // Create demo user if no users exist
      const existingUsers = JSON.parse(localStorage.getItem('mockUsers') || '[]');
      if (existingUsers.length === 0) {
        const demoUser = {
          id: 1,
          email: 'demo@example.com',
          firstName: 'Demo',
          lastName: 'User',
          password: 'demo123',
          orders: [
            {
              id: 1001,
              date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
              items: [
                { id: 't1', name: 'Aurora Smartphone', price: 799.99, quantity: 1, image: 'https://via.placeholder.com/400x300?text=Aurora+Phone' },
                { id: 't3', name: 'Quantum Earbuds', price: 149.99, quantity: 2, image: 'https://via.placeholder.com/400x300?text=Quantum+Earbuds' }
              ],
              total: 1099.97,
              status: 'Delivered'
            }
          ]
        };
        localStorage.setItem('mockUsers', JSON.stringify([demoUser]));
      }
      
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    }

    initializeApp();
  }, []);
  
  const suggestions = query.trim().length > 0
    ? (() => {
        const q = query.trim().toLowerCase();
        const seen = new Set();
        return sampleProducts
          .filter((p) => p.name.toLowerCase().includes(q) && !seen.has(p.name) && (seen.add(p.name), true))
          .slice(0, 6)
          .map((p) => ({ name: p.name, image: p.image }));
      })()
    : [];

  function handleAdd(product) {
    setCart((cur) => {
      const prevCount = cur.reduce((s, c) => s + c.quantity, 0);
      const exists = cur.find((c) => c.id === product.id);
      let next;
      if (exists) {
        next = cur.map((c) => c.id === product.id ? { ...c, quantity: c.quantity + 1 } : c);
      } else {
        next = [...cur, { ...product, quantity: 1 }];
      }

      const nextCount = next.reduce((s, c) => s + c.quantity, 0);
      if (nextCount > prevCount) {
        setBump(true);
        window.setTimeout(() => setBump(false), 380);
      }

      return next;
    });
  }

  function handleRemove(productId) {
    setCart((cur) => cur.filter((c) => c.id !== productId));
  }

  function handleChangeQuantity(productId, newQuantity) {
    setCart((cur) => {
      if (newQuantity <= 0) return cur.filter((c) => c.id !== productId);
      return cur.map((c) => c.id === productId ? { ...c, quantity: newQuantity } : c);
    });
  }

  function handleClearCart() {
    setCart([]);
  }

  async function handleToggleWishlist(product) {
    if (!user) {
      showNotification('Please log in to manage your wishlist', 'warning');
      return;
    }
    
    try {
      if (backendAvailable) {
        const isInWishlist = wishlist.some(item => item.id === product.id);
        if (isInWishlist) {
          await apiService.removeFromWishlist(product.id);
          setWishlist(current => current.filter(item => item.id !== product.id));
          showNotification('Removed from wishlist', 'info');
        } else {
          await apiService.addToWishlist(product.id);
          setWishlist(current => [...current, product]);
          showNotification('Added to wishlist', 'success');
        }
      } else {
        // Fallback to localStorage
        setWishlist((current) => {
          const isInWishlist = current.some(item => item.id === product.id);
          if (isInWishlist) {
            return current.filter(item => item.id !== product.id);
          } else {
            return [...current, product];
          }
        });
      }
    } catch (error) {
      console.error('Error updating wishlist:', error);
      showNotification('Failed to update wishlist', 'error');
    }
  }

  function showNotification(message, type = 'info') {
    setNotification({ message, type, isVisible: true });
  }

  function hideNotification() {
    setNotification(prev => ({ ...prev, isVisible: false }));
  }

  function handleCheckout() {
    setCartOpen(false);
    navigate('/checkout');
  }

  async function handleLogin(userData) {
    try {
      if (backendAvailable) {
        // userData should already include the token from Login component
        setUser(userData);
        localStorage.setItem('authToken', userData.token);
        
        // Load user's wishlist from backend
        const userWishlist = await apiService.getWishlist();
        setWishlist(userWishlist);
      } else {
        // Fallback to localStorage
        setUser(userData);
        localStorage.setItem('currentUser', JSON.stringify(userData));
      }
    } catch (error) {
      console.error('Error during login:', error);
      showNotification('Failed to load user data', 'error');
    }
  }

  async function handleLogout() {
    try {
      if (backendAvailable) {
        await apiService.logout();
        localStorage.removeItem('authToken');
      } else {
        localStorage.removeItem('currentUser');
      }
      setUser(null);
      setWishlist([]);
    } catch (error) {
      console.error('Error during logout:', error);
      // Continue with logout even if backend call fails
      setUser(null);
      setWishlist([]);
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
    }
  }

  async function handlePlaceOrder(orderData) {
    if (!user) {
      showNotification('Please log in to place an order', 'warning');
      return;
    }
    
    try {
      if (backendAvailable) {
        await apiService.createOrder(orderData);
        showNotification('Order placed successfully!', 'success');
        setCart([]); // Clear cart after successful order
        navigate('/account'); // Redirect to account to see order
      } else {
        // Fallback to localStorage
        const mockUsers = JSON.parse(localStorage.getItem('mockUsers') || '[]');
        const userIndex = mockUsers.findIndex(u => u.id === user.id);
        
        if (userIndex !== -1) {
          const newOrder = {
            id: Date.now(),
            date: new Date().toISOString(),
            items: orderData.items,
            total: orderData.total,
            status: 'Processing'
          };
          
          mockUsers[userIndex].orders = mockUsers[userIndex].orders || [];
          mockUsers[userIndex].orders.unshift(newOrder);
          
          localStorage.setItem('mockUsers', JSON.stringify(mockUsers));
          
          // Update current user session
          const updatedUser = { ...user, orders: mockUsers[userIndex].orders };
          setUser(updatedUser);
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        }
        
        showNotification('Order placed successfully!', 'success');
        setCart([]);
        navigate('/account');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      showNotification('Failed to place order. Please try again.', 'error');
    }
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
        currentPath={location.pathname}
      />
      <div className={isHomePage ? "app-grid" : ""}>
        <Routes>
          <Route 
            path="/" 
            element={
              loading ? (
                <div className="flex justify-center items-center min-h-screen">
                  <div className="text-white text-xl">Loading...</div>
                </div>
              ) : (
                <Home
                  products={products}
                  onAddToCart={handleAdd}
                  query={query}
                  selectedCategory={selectedCategory}
                  onSelectCategory={setSelectedCategory}
                  priceRange={priceRange}
                  onPriceRangeChange={setPriceRange}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  wishlist={wishlist}
                  onToggleWishlist={handleToggleWishlist}
                  user={user}
                  showNotification={showNotification}
                />
              )
            } 
          />
          <Route 
            path="/checkout" 
            element={
              <Checkout
                cart={cart}
                onUpdateCart={setCart}
                onPlaceOrder={handlePlaceOrder}
                showNotification={showNotification}
                currentUser={user}
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
                <Account 
                  user={user} 
                  onLogout={handleLogout}
                  wishlist={wishlist}
                  onToggleWishlist={handleToggleWishlist}
                  onAddToCart={handleAdd}
                />
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
              onClearCart={handleClearCart}
              className={cartOpen ? 'open' : ''} 
            />
            <div className={`overlay ${cartOpen ? 'open' : ''}`} onClick={() => setCartOpen(false)} />
          </>
        )}
        
        <Notification
          message={notification.message}
          type={notification.type}
          isVisible={notification.isVisible}
          onClose={hideNotification}
        />
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
