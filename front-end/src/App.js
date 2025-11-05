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
          console.log('🔄 Attempting to load products from backend...');
          const productsData = await apiService.getProducts();
          console.log('📦 Backend response for products:', productsData);
          
          // Only use backend data if we actually get products
          if (productsData && productsData.length > 0) {
            console.log('✅ Using backend products:', productsData.length, 'items found');
            setProducts(productsData);
            setBackendAvailable(true);
            console.log('✅ Backend connected: Loaded', productsData.length, 'products');
          } else {
            // Backend responded but no products - keep sample products
            console.warn('⚠️ Backend responded but returned no/empty products:', productsData);
            console.warn('⚠️ Keeping sample data instead');
            setBackendAvailable(true);
          }
          
          // Check if user is already logged in via currentUser storage (not token)
          const currentUser = apiService.getCurrentUserData();
          console.log('🔍 App startup - Retrieved user from localStorage:', currentUser);
          console.log('🔍 User object type:', typeof currentUser);
          console.log('🔍 User properties:', currentUser ? Object.keys(currentUser) : 'No user');
          
          if (currentUser) {
            setUser(currentUser);
            console.log('✅ User restored from localStorage on startup:', currentUser.username || currentUser.email || 'Unknown user');
            
            // Try to load user's cart from backend only
            try {
              console.log('🛒 Loading user cart from backend...');
              const userCart = await apiService.getCart();
              console.log('🛒 Backend cart loaded:', userCart);
              
              // Additional validation to ensure cart items are valid
              const validCart = (userCart || []).filter(item => {
                const isValid = item && item.id && item.name && 
                              item.price !== undefined && !isNaN(parseFloat(item.price)) &&
                              item.quantity !== undefined && !isNaN(parseInt(item.quantity)) &&
                              parseInt(item.quantity) > 0;
                if (!isValid) {
                  console.warn('🗑️ Filtering out invalid cart item during startup:', item);
                }
                return isValid;
              });
              
              setCart(validCart);
              console.log('✅ Cart loaded from backend successfully:', validCart.length, 'items');
            } catch (cartError) {
              console.warn('⚠️ Could not load cart from backend:', cartError);
              // Start with empty cart if backend cart fails
              setCart([]);
              console.log('🛒 Starting with empty cart due to backend cart unavailable');
            }
            
            // Try to load user's wishlist from backend
            try {
              console.log('🌟 Loading user wishlist from backend...');
              await reloadWishlistFromBackend(currentUser);
            } catch (wishlistError) {
              console.warn('⚠️ Could not load wishlist from backend:', wishlistError);
              // Start with empty wishlist if backend wishlist fails
              setWishlist([]);
              console.log('🌟 Starting with empty wishlist due to backend unavailable');
            }
          } else {
            console.log('❌ No user data found in localStorage during startup');
          }
          
        } catch (backendError) {
          console.warn('❌ Backend not available, using localStorage fallback:', backendError);
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
      console.log('🔄 Initializing with localStorage fallback...');
      
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
      console.log('🔍 localStorage fallback - checking for saved user:', savedUser);
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        console.log('✅ Restored user from localStorage:', parsedUser.username || parsedUser.email);
        
        // Load cart from localStorage when user is restored
        const localCart = apiService.getLocalCart();
        
        // Validate cart items
        const validCart = localCart.filter(item => {
          const isValid = item && item.id && item.name && 
                        item.price !== undefined && !isNaN(parseFloat(item.price)) &&
                        item.quantity !== undefined && !isNaN(parseInt(item.quantity));
          if (!isValid) {
            console.warn('🗑️ Filtering out invalid cart item during localStorage init:', item);
          }
          return isValid;
        });
        
        setCart(validCart || []);
        console.log('🛒 Restored cart from localStorage:', validCart);
      } else {
        console.log('❌ No saved user found in localStorage');
      }
    }

    initializeApp();
  }, []);

  // Helper function to reload cart from backend
  const reloadCartFromBackend = async () => {
    if (!user) return;
    
    try {
      console.log('🔄 Reloading cart from backend...');
      const userCart = await apiService.getCart();
      console.log('🛒 Cart reloaded:', userCart);
      
      const validCart = (userCart || []).filter(item => {
        const isValid = item && item.id && item.name && 
                      item.price !== undefined && !isNaN(parseFloat(item.price)) &&
                      item.quantity !== undefined && !isNaN(parseInt(item.quantity)) &&
                      parseInt(item.quantity) > 0;
        return isValid;
      });
      
      setCart(validCart);
      console.log('✅ Cart reloaded successfully:', validCart.length, 'items');
      return validCart;
    } catch (error) {
      console.error('❌ Failed to reload cart:', error);
      return [];
    }
  };
  
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

  async function handleAdd(product) {
    // Validate product before adding to cart
    if (!product || !product.id || !product.name || product.price === undefined || product.price === null || isNaN(parseFloat(product.price))) {
      console.error('❌ Invalid product, cannot add to cart:', product);
      showNotification('Error: Invalid product data', 'error');
      return;
    }

    if (!user) {
      showNotification('Please log in to add items to cart', 'warning');
      return;
    }

    try {
      // Add to backend cart first
      console.log('🛒 Adding item to backend cart:', product.name);
      await apiService.addToCart(product.id, 1);
      
      // Reload cart from backend to get the current state
      await reloadCartFromBackend();
      
      // Show animation effect
      setBump(true);
      window.setTimeout(() => setBump(false), 380);

      showNotification(`${product.name} added to cart!`, 'success');
    } catch (error) {
      console.error('❌ Failed to add item to backend cart:', error);
      showNotification(`Failed to add ${product.name} to cart. ${error.message}`, 'error');
    }
  }

  async function handleRemove(productId) {
    if (!user) {
      showNotification('Please log in to modify cart', 'warning');
      return;
    }

    try {
      // Remove from backend cart first
      console.log('🛒 Removing item from backend cart:', productId);
      await apiService.removeFromCart(productId);
      
      // Reload cart from backend to get the current state
      await reloadCartFromBackend();

      showNotification('Item removed from cart', 'success');
    } catch (error) {
      console.error('❌ Failed to remove item from backend cart:', error);
      showNotification(`Failed to remove item from cart. ${error.message}`, 'error');
    }
  }

  async function handleChangeQuantity(productId, newQuantity) {
    if (!user) {
      showNotification('Please log in to modify cart', 'warning');
      return;
    }

    try {
      if (newQuantity <= 0) {
        // If quantity is 0 or less, remove the item
        await handleRemove(productId);
        return;
      }

      // Update quantity in backend cart first
      console.log('🛒 Updating item quantity in backend cart:', { productId, newQuantity });
      await apiService.updateCartItem(productId, newQuantity);
      
      // Reload cart from backend to get the current state
      await reloadCartFromBackend();

      showNotification('Cart updated', 'success');
    } catch (error) {
      console.error('❌ Failed to update cart quantity in backend:', error);
      showNotification(`Failed to update cart. ${error.message}`, 'error');
    }
  }

  async function handleClearCart() {
    if (!user) {
      showNotification('Please log in to clear cart', 'warning');
      return;
    }

    try {
      // Clear backend cart first
      console.log('🛒 Clearing backend cart');
      await apiService.clearCart();
      
      // Reload cart from backend to get the current state (should be empty)
      await reloadCartFromBackend();

      showNotification('Cart cleared', 'success');
    } catch (error) {
      console.error('❌ Failed to clear backend cart:', error);
      showNotification(`Failed to clear cart. ${error.message}`, 'error');
    }
  }

  // Helper function to reload wishlist from backend
  const reloadWishlistFromBackend = async (userToUse = null) => {
    // Use provided user or current user state or get from localStorage
    const activeUser = userToUse || user || apiService.getCurrentUserData();
    
    if (!activeUser) {
      console.log('🌟 No user available for wishlist loading');
      return;
    }
    
    try {
      console.log('🔄 Reloading wishlist from backend for user:', activeUser.username || activeUser.email);
      const userWishlist = await apiService.getWishlist();
      console.log('🌟 Raw wishlist response from backend:', userWishlist);
      console.log('🌟 Wishlist type:', typeof userWishlist, 'Array?', Array.isArray(userWishlist));
      
      // Validate and transform wishlist items from backend format
      const validWishlist = (userWishlist || []).filter(item => {
        console.log('🔍 Validating wishlist item:', item);
        // Check if this is a backend format with nested item structure
        const productData = item.item || item;
        const isValid = item && productData && productData.id && productData.name && 
                      productData.price !== undefined && !isNaN(parseFloat(productData.price));
        if (!isValid) {
          console.warn('⚠️ Invalid wishlist item found:', item);
        }
        return isValid;
      }).map(item => {
        // Transform backend format to frontend format if needed
        if (item.item) {
          // Backend format: flatten the nested structure
          return {
            ...item.item,
            wishlistId: item.id, // Keep the wishlist entry ID separate
            addedDate: item.addedDate,
            notes: item.notes
          };
        }
        // Already in frontend format
        return item;
      });
      
      console.log('✅ Valid wishlist items:', validWishlist);
      console.log('🔍 Sample transformed item:', validWishlist[0]); // Log first item structure
      setWishlist(validWishlist);
      console.log('✅ Wishlist reloaded successfully:', validWishlist.length, 'items');
      return validWishlist;
    } catch (error) {
      console.error('❌ Failed to reload wishlist:', error);
      return [];
    }
  };

  async function handleToggleWishlist(product) {
    if (!user) {
      showNotification('Please log in to manage your wishlist', 'warning');
      return;
    }
    
    try {
      // Use backend toggle endpoint which handles add/remove automatically
      console.log('🔄 Toggling wishlist item in backend:', product.id);
      const response = await apiService.toggleWishlistItem(product.id);
      
      // Reload wishlist from backend to get the current state
      await reloadWishlistFromBackend();
      
      // Show appropriate message based on backend response
      if (response.action === 'added') {
        showNotification('Added to wishlist', 'success');
      } else if (response.action === 'removed') {
        showNotification('Removed from wishlist', 'info');
      } else {
        showNotification('Wishlist updated', 'success');
      }
    } catch (error) {
      console.error('❌ Failed to update wishlist:', error);
      showNotification(`Failed to update wishlist. ${error.message}`, 'error');
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
    console.log('🔍 App handleLogin received userData:', userData);
    console.log('🔍 userData type:', typeof userData);
    console.log('🔍 userData properties:', userData ? Object.keys(userData) : 'No userData');
    
    if (!userData) {
      console.error('❌ No userData provided to handleLogin');
      showNotification('Login failed - no user data', 'error');
      return;
    }
    
    try {
      // Set user immediately
      setUser(userData);
      localStorage.setItem('currentUser', JSON.stringify(userData));
      console.log('✅ User stored successfully:', userData);

      // Try to load additional data, but don't let it break the login
      if (backendAvailable) {
        // Load cart and wishlist in background - don't wait or fail on errors
        setTimeout(async () => {
          try {
            const userCart = await apiService.getCart();
            console.log('🛒 Cart loaded after login:', userCart);
            
            // Validate cart items
            const validCart = userCart.filter(item => {
              const isValid = item && item.id && item.name && 
                            item.price !== undefined && !isNaN(parseFloat(item.price)) &&
                            item.quantity !== undefined && !isNaN(parseInt(item.quantity));
              if (!isValid) {
                console.warn('🗑️ Filtering out invalid cart item during login:', item);
              }
              return isValid;
            });
            
            setCart(validCart || []);
          } catch (cartError) {
            console.warn('⚠️ Could not load cart after login:', cartError);
            const localCart = apiService.getLocalCart();
            setCart(localCart || []);
            console.log('🛒 Using local cart after login:', localCart);
          }
          
          try {
            console.log('🌟 Loading user wishlist after login...');
            await reloadWishlistFromBackend();
          } catch (wishlistError) {
            console.warn('⚠️ Could not load wishlist after login:', wishlistError);
            setWishlist([]);
          }
        }, 100);
      } else {
        // Fallback to localStorage
        console.log('🔄 Loading cart from localStorage in fallback mode');
        
        // Load cart from localStorage in fallback mode
        const localCart = apiService.getLocalCart();
        
        // Validate cart items
        const validCart = localCart.filter(item => {
          const isValid = item && item.id && item.name && 
                        item.price !== undefined && !isNaN(parseFloat(item.price)) &&
                        item.quantity !== undefined && !isNaN(parseInt(item.quantity));
          if (!isValid) {
            console.warn('🗑️ Filtering out invalid cart item during fallback login:', item);
          }
          return isValid;
        });
        
        setCart(validCart || []);
        console.log('🛒 Loaded local cart after login:', validCart);
      }
      
    } catch (error) {
      console.error('❌ Error during login setup:', error);
      // Still set the user even if additional data loading fails
      if (!user) {
        setUser(userData);
        localStorage.setItem('currentUser', JSON.stringify(userData));
        console.log('✅ User stored successfully despite errors');
      }
      showNotification('Login successful, but some data may not be available', 'warning');
    }
  }

  async function handleLogout() {
    console.log('🔄 Logging out user...');
    try {
      if (backendAvailable) {
        await apiService.logout();
      }
      
      // Always clear all authentication data regardless of backend availability
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      console.log('✅ Cleared all authentication data from localStorage');
      
      setUser(null);
      setCart([]); // Clear cart on logout
      setWishlist([]);
      console.log('✅ Cleared user state and cart in App');
    } catch (error) {
      console.error('Error during logout:', error);
      // Continue with logout even if backend call fails
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      setUser(null);
      setCart([]); // Clear cart on logout even if error
      setWishlist([]);
      console.log('⚠️ Logout completed despite backend error');
    }
  }

  async function handleRefreshProducts() {
    try {
      console.log('🔄 Refreshing products list...');
      const productsData = await apiService.getProducts();
      
      if (productsData && productsData.length > 0) {
        setProducts(productsData);
        console.log('✅ Products refreshed:', productsData.length, 'items loaded');
      } else {
        console.warn('⚠️ Refresh returned no products');
      }
    } catch (error) {
      console.error('❌ Failed to refresh products:', error);
    }
  }

  async function handlePlaceOrder(orderData) {
    if (!user) {
      showNotification('Please log in to place an order', 'warning');
      return;
    }
    
    console.log('🛒 App handling order completion:', orderData);
    
    try {
      // Note: This is called AFTER the Checkout component has tried backend submission
      // This function handles the order processing result
      
      if (orderData.success === false) {
        console.log('❌ Backend order submission failed');
        showNotification('Order submission failed. Please try again.', 'error');
      } else {
        console.log('✅ Backend order submitted successfully');
        showNotification('Order placed successfully!', 'success');
      }

      // Always clear cart after order attempt (successful or failed)
      setCart([]); // Clear cart after order
      localStorage.setItem('userCart', JSON.stringify([])); // Clear cart from localStorage too
      console.log('🛒 Cart cleared from state and localStorage after order completion');
      
      // Don't save orders to localStorage - orders will only come from backend
      console.log('📋 Order history will be fetched from backend only');
      
    } catch (error) {
      console.error('❌ Error in handlePlaceOrder:', error);
      showNotification('An error occurred. Please try again.', 'error');
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
                  onRefreshProducts={handleRefreshProducts}
                  showNotification={showNotification}
                />
              ) : (
                <Login onLogin={handleLogin} />
              )
            } 
          />
        </Routes>

        {(isHomePage || location.pathname === '/account') && (
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
