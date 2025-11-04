// Enhanced API service layer for Spring Backend integration
import environment from '../config/environment';

const API_BASE_URL = environment.getApiBaseUrl();

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    
    // Validate environment configuration on initialization
    try {
      environment.validateConfig();
      environment.log('ApiService initialized with base URL:', this.baseURL);
    } catch (error) {
      environment.error('Failed to initialize ApiService:', error);
      throw error;
    }
  }

  // Helper method to get auth headers (Basic auth for Spring backend)
  getAuthHeaders() {
    const currentUser = this.getCurrentUserData();
    return {
      'Content-Type': 'application/json',
      ...(currentUser && { 'X-User-ID': currentUser.id })
    };
  }

  // Helper method to get current user data from localStorage
  getCurrentUserData() {
    try {
      const userData = localStorage.getItem('currentUser');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      environment.error('Failed to parse user data:', error);
      return null;
    }
  }

  // Helper method for making requests
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    console.log('🌐 Making API request to:', url);
    const config = {
      headers: this.getAuthHeaders(),
      ...options
    };
    console.log('🔧 Request config:', config);

    try {
      const response = await fetch(url, config);
      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.status === 401) {
        // Authentication failed
        localStorage.removeItem('currentUser');
        throw new Error('Authentication required');
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      console.log('📄 Content-Type:', contentType);
      if (contentType && contentType.includes('application/json')) {
        const jsonResult = await response.json();
        console.log('📊 JSON Response:', jsonResult);
        return jsonResult;
      }
      
      console.log('📄 Non-JSON response returned');
      return response;
    } catch (error) {
      console.error('❌ API request failed for', endpoint, ':', error);
      environment.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Authentication endpoints - Updated for Spring backend
  async login(username, password) {
    // Spring backend uses @RequestBody User loginRequest
    const response = await this.request('/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    
    console.log('🔍 Login response analysis:', {
      hasResponse: !!response,
      responseKeys: response ? Object.keys(response) : 'no response',
      fullResponse: response,
      hasDirectUser: !!(response && response.user),
      hasBodyUser: !!(response && response.body && response.body.user),
      userValue: response ? (response.user || (response.body && response.body.user)) : 'no response',
      message: response ? (response.messgae || response.message || (response.body && response.body.message)) : 'no message'
    });

    // Handle ResponseEntity structure - check both direct response and response.body
    let user = null;
    let message = null;
    
    if (response) {
      // Try direct access first
      user = response.user;
      message = response.messgae || response.message;
      
      // If not found, try ResponseEntity body structure
      if (!user && response.body) {
        user = response.body.user;
        message = message || response.body.messgae || response.body.message;
      }
    }

    if (user) {
      // Store user data instead of token
      localStorage.setItem('currentUser', JSON.stringify(user));
      environment.log('User logged in successfully:', user.username);
      return { user, message };
    } else if (message) {
      // Backend returned a message but no user - likely authentication failure
      console.log('🚫 Login failed with message:', message);
      throw new Error(`Login failed: ${message}`);
    }
    
    throw new Error('Login failed - invalid response');
  }

  async register(username, password, email) {
    // Spring backend uses form parameters for registration
    const params = new URLSearchParams({ username, password, email });
    
    const response = await this.request('/users/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });
    
    if (response) {
      // Store user data after successful registration
      localStorage.setItem('currentUser', JSON.stringify(response));
      environment.log('User registered successfully:', response.username);
    }
    
    return response;
  }

  async logout() {
    try {
      await this.request('/users/logout');
    } finally {
      localStorage.removeItem('currentUser');
      environment.log('User logged out');
    }
  }

  async getCurrentUser() {
    return this.getCurrentUserData();
  }

  async getUserProfile(userId) {
    const params = new URLSearchParams({ userId });
    return await this.request(`/users/profile?${params}`);
  }

  async updateProfile(user) {
    return await this.request('/users/profile', {
      method: 'POST',
      body: JSON.stringify(user)
    });
  }

  async changePassword(userId, newPassword) {
    const params = new URLSearchParams({ userId, newPassword });
    return await this.request('/users/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });
  }

  // Product endpoints - Updated for Spring ItemController
  async getProducts() {
    try {
      console.log('🔄 ApiService.getProducts() - Making request to /items');
      // Spring ItemController has /api/items endpoint
      const result = await this.request('/items');
      console.log('📦 ApiService.getProducts() - Response received:', result);
      console.log('📦 Response type:', typeof result);
      console.log('📦 Response length:', result ? result.length : 'N/A');
      return result;
    } catch (error) {
      console.error('❌ ApiService.getProducts() - Error:', error);
      environment.warn('Items endpoint error:', error);
      return [];
    }
  }

  async getProduct(productId) {
    try {
      // Spring ItemController has /api/items/{itemId} endpoint
      return await this.request(`/items/${productId}`);
    } catch (error) {
      environment.warn('Get item endpoint error:', error);
      return null;
    }
  }

  async getProductsSorted(sortBy, order = 'asc') {
    try {
      // Spring ItemController has sorting endpoints
      if (sortBy === 'price') {
        return await this.request(`/items/sorted/price/${order}`);
      } else if (sortBy === 'name') {
        return await this.request(`/items/sorted/name/${order}`);
      } else {
        return await this.getProducts();
      }
    } catch (error) {
      environment.warn('Get sorted items error:', error);
      return [];
    }
  }

  async searchProducts(query, filters = {}) {
    // Backend doesn't have search implemented yet, filter locally
    try {
      const products = await this.getProducts();
      if (!query) return products;
      
      return products.filter(product => 
        product.name?.toLowerCase().includes(query.toLowerCase()) ||
        product.description?.toLowerCase().includes(query.toLowerCase()) ||
        product.category?.toLowerCase().includes(query.toLowerCase())
      );
    } catch (error) {
      environment.warn('Search error:', error);
      return [];
    }
  }

  // Cart endpoints - Updated for Spring backend CartController with actual REST mappings
  async getCart() {
    const currentUser = this.getCurrentUserData();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Spring CartController has /api/cart/view/{userID} endpoint
    try {
      const response = await fetch(`${this.baseURL}/cart/view/${currentUser.username}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // CartController returns "Cart viewed" string, not actual cart data
      const text = await response.text();
      environment.log('Cart view response:', text);
      
      // For now, fall back to local storage since backend doesn't return cart data
      return this.getLocalCart();
    } catch (error) {
      environment.warn('Cart endpoint error, using local storage:', error);
      return this.getLocalCart();
    }
  }

  async addToCart(itemId, quantity = 1) {
    const currentUser = this.getCurrentUserData();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      // Spring CartController: POST /api/cart/add/{userID}?itemID=x&quantity=y
      const url = new URL(`${this.baseURL}/cart/add/${currentUser.username}`);
      url.searchParams.append('itemID', itemId);
      url.searchParams.append('quantity', quantity);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text(); // Returns "Item added to cart"
      environment.log('Add to cart response:', text);
      
      // Also update local storage for consistency
      this.addToLocalCart(itemId, quantity);
      
      return { success: true, message: text };
    } catch (error) {
      environment.warn('Add to cart backend error, using local storage:', error);
      return this.addToLocalCart(itemId, quantity);
    }
  }

  async updateCartItem(itemId, quantity) {
    const currentUser = this.getCurrentUserData();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      // Spring CartController: PUT /api/cart/update/{userID}?itemID=x&newQuantity=y
      const url = new URL(`${this.baseURL}/cart/update/${currentUser.username}`);
      url.searchParams.append('itemID', itemId);
      url.searchParams.append('newQuantity', quantity);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text(); // Returns "Item quantity updated"
      environment.log('Update cart response:', text);
      
      // Also update local storage for consistency
      this.updateLocalCartItem(itemId, quantity);
      
      return { success: true, message: text };
    } catch (error) {
      environment.warn('Update cart backend error, using local storage:', error);
      return this.updateLocalCartItem(itemId, quantity);
    }
  }

  async removeFromCart(itemId) {
    const currentUser = this.getCurrentUserData();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      // Spring CartController: DELETE /api/cart/remove/{userID}?itemID=x
      const url = new URL(`${this.baseURL}/cart/remove/${currentUser.username}`);
      url.searchParams.append('itemID', itemId);
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text(); // Returns "Item removed from cart"
      environment.log('Remove from cart response:', text);
      
      // Also update local storage for consistency
      this.removeFromLocalCart(itemId);
      
      return { success: true, message: text };
    } catch (error) {
      environment.warn('Remove from cart backend error, using local storage:', error);
      return this.removeFromLocalCart(itemId);
    }
  }

  async clearCart() {
    const currentUser = this.getCurrentUserData();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      // Spring CartController: DELETE /api/cart/clear/{userID}
      const response = await fetch(`${this.baseURL}/cart/clear/${currentUser.username}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text(); // Returns "Cart cleared"
      environment.log('Clear cart response:', text);
      
      // Also clear local storage for consistency
      this.clearLocalCart();
      
      return { success: true, message: text };
    } catch (error) {
      environment.warn('Clear cart backend error, using local storage:', error);
      return this.clearLocalCart();
    }
  }

  // Local storage fallback methods for cart (until backend implements REST mappings)
  getLocalCart() {
    try {
      const cart = localStorage.getItem('userCart');
      return cart ? JSON.parse(cart) : [];
    } catch (error) {
      environment.error('Failed to get local cart:', error);
      return [];
    }
  }

  addToLocalCart(itemId, quantity) {
    const cart = this.getLocalCart();
    const existingItem = cart.find(item => item.itemId === parseInt(itemId));
    
    if (existingItem) {
      existingItem.quantity += parseInt(quantity);
    } else {
      cart.push({ 
        itemId: parseInt(itemId), 
        quantity: parseInt(quantity),
        addedAt: new Date().toISOString()
      });
    }
    
    localStorage.setItem('userCart', JSON.stringify(cart));
    return cart;
  }

  updateLocalCartItem(itemId, quantity) {
    const cart = this.getLocalCart();
    const itemIndex = cart.findIndex(item => item.itemId === parseInt(itemId));
    
    if (itemIndex !== -1) {
      if (quantity <= 0) {
        cart.splice(itemIndex, 1);
      } else {
        cart[itemIndex].quantity = parseInt(quantity);
      }
    }
    
    localStorage.setItem('userCart', JSON.stringify(cart));
    return cart;
  }

  removeFromLocalCart(itemId) {
    const cart = this.getLocalCart();
    const filteredCart = cart.filter(item => item.itemId !== parseInt(itemId));
    localStorage.setItem('userCart', JSON.stringify(filteredCart));
    return filteredCart;
  }

  clearLocalCart() {
    localStorage.removeItem('userCart');
    return [];
  }

  // Checkout endpoints - Updated for Spring backend CheckoutController
  async getCheckoutSummary(userId) {
    return await this.request(`/checkout/summary/${userId}`);
  }

  async getDetailedCheckoutSummary(userId) {
    return await this.request(`/checkout/summary/${userId}/detailed`);
  }

  async submitOrder(userId, orderData = {}) {
    return await this.request(`/checkout/submit/${userId}`, {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  }

  async validateCheckout(userId) {
    return await this.request(`/checkout/validate/${userId}`);
  }

  async getOrderTotal(userId) {
    return await this.request(`/checkout/total/${userId}`);
  }

  // Discount management
  async applyDiscountCode(userId, code) {
    return await this.request(`/checkout/discount/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ code })
    });
  }

  async removeDiscountCode(userId) {
    return await this.request(`/checkout/discount/${userId}`, {
      method: 'DELETE'
    });
  }

  async getAvailableDiscounts() {
    return await this.request('/checkout/discounts/available');
  }

  // Shipping management
  async selectShippingMethod(userId, shippingMethod, address) {
    return await this.request(`/checkout/shipping/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ shippingMethod, address })
    });
  }

  // Payment management
  async selectPaymentMethod(userId, paymentMethod) {
    return await this.request(`/checkout/payment/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ paymentMethod })
    });
  }

  // Wishlist endpoints (not implemented in backend yet)
  async getWishlist() {
    environment.warn('Wishlist not implemented in backend');
    return [];
  }

  async addToWishlist(productId) {
    environment.warn('Add to wishlist not implemented in backend');
    return { success: false, message: 'Not implemented' };
  }

  async removeFromWishlist(productId) {
    environment.warn('Remove from wishlist not implemented in backend');
    return { success: false, message: 'Not implemented' };
  }

  async clearWishlist() {
    environment.warn('Clear wishlist not implemented in backend');
    return { success: false, message: 'Not implemented' };
  }

  // Order endpoints (not fully implemented in backend yet)
  async getOrders() {
    const currentUser = this.getCurrentUserData();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    environment.warn('Get orders not implemented in backend');
    return [];
  }

  async getOrder(orderId) {
    environment.warn('Get order not implemented in backend');
    return null;
  }

  // Category endpoints (not implemented in backend)
  async getCategories() {
    environment.warn('Categories not implemented in backend');
    return [];
  }

  // Health check endpoint
  async healthCheck() {
    try {
      // Test with a simple endpoint
      const response = await fetch(`${this.baseURL}/checkout/discounts/available`);
      return { 
        status: response.ok ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

const apiServiceInstance = new ApiService();
export default apiServiceInstance;