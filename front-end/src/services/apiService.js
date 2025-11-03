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
    const config = {
      headers: this.getAuthHeaders(),
      ...options
    };

    try {
      const response = await fetch(url, config);
      
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
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return response;
    } catch (error) {
      environment.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Authentication endpoints - Updated for Spring backend
  async login(username, password) {
    // Spring backend uses GET with query parameters for login
    const params = new URLSearchParams({ username, password });
    const response = await this.request(`/users/login?${params}`);
    
    if (response) {
      // Store user data instead of token
      localStorage.setItem('currentUser', JSON.stringify(response));
      environment.log('User logged in successfully:', response.username);
    }
    
    return response;
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

  // Product endpoints - ItemController is stub, will return empty for now
  async getProducts() {
    // Backend ItemController returns null, implementing fallback
    try {
      return await this.request('/items');
    } catch (error) {
      environment.warn('Items endpoint not implemented, returning empty array');
      return [];
    }
  }

  async getProduct(productId) {
    try {
      return await this.request(`/items/${productId}`);
    } catch (error) {
      environment.warn('Get item endpoint not implemented');
      return null;
    }
  }

  async searchProducts(query, filters = {}) {
    // Backend doesn't have search implemented yet
    environment.warn('Search not implemented in backend');
    return [];
  }

  // Cart endpoints - Updated for Spring backend Cart Service
  async getCart() {
    const currentUser = this.getCurrentUserData();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Note: CartController doesn't have REST mappings yet
    // Will need to implement in backend or use local storage fallback
    try {
      return await this.request(`/cart/${currentUser.id}`);
    } catch (error) {
      environment.warn('Cart endpoint not implemented, using local storage');
      return this.getLocalCart();
    }
  }

  async addToCart(itemId, quantity = 1) {
    const currentUser = this.getCurrentUserData();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      // When backend implements CartController REST mappings
      return await this.request('/cart', {
        method: 'POST',
        body: JSON.stringify({ 
          userId: currentUser.id.toString(), 
          itemId: parseInt(itemId), 
          quantity: parseInt(quantity) 
        })
      });
    } catch (error) {
      environment.warn('Add to cart endpoint not implemented, using local storage');
      return this.addToLocalCart(itemId, quantity);
    }
  }

  async updateCartItem(itemId, quantity) {
    const currentUser = this.getCurrentUserData();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      return await this.request(`/cart/${itemId}`, {
        method: 'PATCH',
        body: JSON.stringify({ 
          userId: currentUser.id.toString(), 
          quantity: parseInt(quantity) 
        })
      });
    } catch (error) {
      environment.warn('Update cart endpoint not implemented, using local storage');
      return this.updateLocalCartItem(itemId, quantity);
    }
  }

  async removeFromCart(itemId) {
    const currentUser = this.getCurrentUserData();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      return await this.request(`/cart/${itemId}`, {
        method: 'DELETE',
        body: JSON.stringify({ userId: currentUser.id.toString() })
      });
    } catch (error) {
      environment.warn('Remove from cart endpoint not implemented, using local storage');
      return this.removeFromLocalCart(itemId);
    }
  }

  async clearCart() {
    const currentUser = this.getCurrentUserData();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      return await this.request('/cart', {
        method: 'DELETE',
        body: JSON.stringify({ userId: currentUser.id.toString() })
      });
    } catch (error) {
      environment.warn('Clear cart endpoint not implemented, using local storage');
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