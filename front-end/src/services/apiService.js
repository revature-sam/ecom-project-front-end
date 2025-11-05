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
        let rawText = ''; // Declare outside try block for catch access
        try {
          // Get raw text first to debug malformed JSON
          rawText = await response.text();
          console.log('🔍 Raw response text:', rawText);
          
          // Try to clean up malformed JSON if needed
          let cleanedText = rawText;
          
          // Check for duplicate closing brackets pattern
          if (rawText.includes('}]}}]}}]}}"')) {
            console.log('⚠️ Detected malformed JSON with duplicate brackets, attempting to clean...');
            // Remove extra brackets - keep only the first occurrence
            cleanedText = rawText.replace(/(\}+\]+\}+\]+\}+\]+\}+["\}]*)+$/, '}');
            console.log('🧹 Cleaned JSON text:', cleanedText);
          }
          
          const jsonResult = JSON.parse(cleanedText);
          console.log('📊 Parsed JSON Response:', jsonResult);
          return jsonResult;
        } catch (parseError) {
          console.error('❌ JSON parse error:', parseError);
          console.error('❌ Raw response causing error:', rawText);
          throw parseError;
        }
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
      message: response ? (response.message || (response.body && response.body.message)) : 'no message'
    });

    // Handle ResponseEntity structure - check both direct response and response.body
    let user = null;
    let message = null;
    
    if (response) {
      // Try direct access first
      user = response.user;
      message = response.message;
      
      // If not found, try ResponseEntity body structure
      if (!user && response.body) {
        user = response.body.user;
        message = message || response.body.message;
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
      await this.request('/users/logout', {
        method: 'POST'
      });
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
      console.log('🔄 Fetching cart from backend for user:', currentUser.username);
      const response = await this.request(`/cart/view/${currentUser.username}`, {
        method: 'GET'
      });
      
      console.log('📦 Raw cart response from backend:', response);
      
      // Check if response is a string (old behavior) or actual cart data
      if (typeof response === 'string') {
        console.warn('⚠️ Backend returned string response, cart API may not be fully implemented');
        return [];
      }
      
      // If response is an array of cart items, transform them to frontend format
      if (Array.isArray(response)) {
        const cartItems = response.map(cartItem => ({
          id: cartItem.item?.id || cartItem.itemId,
          name: cartItem.item?.name || cartItem.itemName || 'Unknown Item',
          price: cartItem.item?.price || cartItem.itemPrice || 0,
          quantity: cartItem.quantity || 1,
          image: cartItem.item?.imageUrl || cartItem.item?.image || null,
          category: cartItem.item?.category || 'Unknown'
        }));
        
        console.log('✅ Cart items transformed:', cartItems);
        return cartItems;
      }
      
      // If response has a specific structure, handle it accordingly
      if (response && response.items) {
        return response.items;
      }
      
      console.log('✅ Cart loaded from backend:', response);
      return response || [];
      
    } catch (error) {
      console.error('❌ Failed to fetch cart from backend:', error);
      environment.warn('Cart endpoint error:', error);
      throw new Error(`Failed to get cart: ${error.message}`);
    }
  }

  async addToCart(itemId, quantity = 1) {
    const currentUser = this.getCurrentUserData();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      // Try different parameter formats that Spring might expect
      console.log('🛒 Adding to cart:', { itemId, quantity, user: currentUser.username });
      
      // First try: JSON body format (common in Spring Boot)
      let response = await this.request('/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: currentUser.username,
          itemId: itemId,
          quantity: quantity
        })
      });
      
      if (response) {
        console.log('✅ Cart add successful (JSON body format)');
        return { success: true, message: 'Item added to cart' };
      }
    } catch (jsonError) {
      console.log('❌ JSON body format failed, trying query params...', jsonError);
      
      // If the error is about duplicate results, try to clear cart first
      if (jsonError.message && jsonError.message.includes('Query did not return a unique result')) {
        console.log('🧹 Detected duplicate cart entries, attempting to clear cart first...');
        try {
          await this.clearCart();
          console.log('✅ Cart cleared, retrying add operation...');
          
          // Retry the original request after clearing
          const response = await this.request('/cart/add', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              username: currentUser.username,
              itemId: itemId,
              quantity: quantity
            })
          });
          
          if (response) {
            console.log('✅ Cart add successful after clearing duplicates');
            return { success: true, message: 'Item added to cart (after clearing duplicates)' };
          }
        } catch (clearError) {
          console.warn('❌ Failed to clear cart duplicates:', clearError);
        }
      }
      
      try {
        // Second try: Query parameters with different parameter names
        const url = new URL(`${this.baseURL}/cart/add/${currentUser.username}`);
        url.searchParams.append('itemId', itemId); // Try itemId instead of itemID
        url.searchParams.append('quantity', quantity);
        
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          const text = await response.text();
          console.log('✅ Cart add successful (query params with itemId)');
          return { success: true, message: text };
        }
      } catch (queryError) {
        console.log('❌ Query params with itemId failed, trying original format...', queryError);
        
        try {
          // Third try: Original format with itemID
          const url = new URL(`${this.baseURL}/cart/add/${currentUser.username}`);
          url.searchParams.append('itemID', itemId);
          url.searchParams.append('quantity', quantity);
          
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (response.ok) {
            const text = await response.text();
            console.log('✅ Cart add successful (original format)');
            return { success: true, message: text };
          }
        } catch (originalError) {
          console.log('❌ All cart API formats failed');
          environment.warn('Add to cart backend error:', originalError);
          throw new Error('Failed to add item to cart: backend not available');
        }
      }
    }
    
    // If all attempts fail, throw error instead of using local storage
    throw new Error('Failed to add item to cart: all backend attempts failed');
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
      
      return { success: true, message: text };
    } catch (error) {
      environment.warn('Update cart backend error:', error);
      throw new Error('Failed to update cart item: backend not available');
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
      
      return { success: true, message: text };
    } catch (error) {
      environment.warn('Remove from cart backend error:', error);
      throw new Error('Failed to remove cart item: backend not available');
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
      
      return { success: true, message: text };
    } catch (error) {
      environment.warn('Clear cart backend error:', error);
      throw new Error('Failed to clear cart: backend not available');
    }
  }

  // Local storage fallback methods for cart (until backend implements REST mappings)
  getLocalCart() {
    try {
      const cart = localStorage.getItem('userCart');
      const parsedCart = cart ? JSON.parse(cart) : [];
      
      // Filter out invalid cart items (items with undefined/null/NaN prices or missing required fields)
      const validCart = parsedCart.filter(item => {
        const hasValidId = item.id && item.id !== 'undefined' && item.id !== 'null';
        const hasValidName = item.name && typeof item.name === 'string' && item.name !== 'undefined';
        const hasValidPrice = item.price !== undefined && item.price !== null && !isNaN(parseFloat(item.price));
        const hasValidQuantity = item.quantity !== undefined && item.quantity !== null && !isNaN(parseInt(item.quantity)) && parseInt(item.quantity) > 0;
        
        const isValid = hasValidId && hasValidName && hasValidPrice && hasValidQuantity;
        
        if (!isValid) {
          console.warn('🗑️ Removing invalid cart item:', item);
        }
        
        return isValid;
      });
      
      // If cart was cleaned up, save the cleaned version back to localStorage
      if (validCart.length !== parsedCart.length) {
        console.log('🧹 Cart cleaned up, saving valid items back to localStorage');
        localStorage.setItem('userCart', JSON.stringify(validCart));
      }
      
      return validCart;
    } catch (error) {
      environment.error('Failed to get local cart:', error);
      // Clear corrupted cart
      localStorage.setItem('userCart', JSON.stringify([]));
      return [];
    }
  }

  async addToLocalCart(itemId, quantity) {
    try {
      // Get product details first to store complete item information
      const product = await this.getProduct(itemId);
      if (!product) {
        console.warn('⚠️ Product not found for itemId:', itemId);
        return this.getLocalCart(); // Return current cart without adding
      }

      const cart = this.getLocalCart();
      const existingItem = cart.find(item => item.id === parseInt(itemId));
      
      if (existingItem) {
        existingItem.quantity += parseInt(quantity);
      } else {
        // Store complete product information for local cart
        cart.push({ 
          id: parseInt(itemId),
          itemId: parseInt(itemId), // Keep both for compatibility
          name: product.name,
          price: product.price,
          image: product.image || product.imageUrl,
          category: product.category,
          quantity: parseInt(quantity),
          addedAt: new Date().toISOString()
        });
      }
      
      localStorage.setItem('userCart', JSON.stringify(cart));
      console.log('✅ Item added to local cart:', cart[cart.length - 1] || 'updated existing');
      return cart;
    } catch (error) {
      console.error('❌ Error adding to local cart:', error);
      // Fallback: add minimal item info
      const cart = this.getLocalCart();
      const existingItem = cart.find(item => item.id === parseInt(itemId) || item.itemId === parseInt(itemId));
      
      if (existingItem) {
        existingItem.quantity += parseInt(quantity);
      } else {
        cart.push({ 
          id: parseInt(itemId),
          itemId: parseInt(itemId),
          name: `Item ${itemId}`, // Fallback name
          price: 0, // Fallback price
          quantity: parseInt(quantity),
          addedAt: new Date().toISOString()
        });
      }
      
      localStorage.setItem('userCart', JSON.stringify(cart));
      return cart;
    }
  }

  updateLocalCartItem(itemId, quantity) {
    const cart = this.getLocalCart();
    const itemIndex = cart.findIndex(item => item.id === parseInt(itemId) || item.itemId === parseInt(itemId));
    
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
    const filteredCart = cart.filter(item => item.id !== parseInt(itemId) && item.itemId !== parseInt(itemId));
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
    console.log('🔄 Submitting order to backend:', {
      userId,
      orderData,
      endpoint: `/checkout/submit/${userId}`
    });
    
    try {
      const response = await this.request(`/checkout/submit/${userId}`, {
        method: 'POST',
        body: JSON.stringify(orderData)
      });
      console.log('✅ Order submitted successfully:', response);
      
      return response;
    } catch (error) {
      console.error('❌ Backend order submission failed:', error);
      
      // Enhanced error logging
      console.log('🔍 Order submission error details:', {
        error: error.message,
        userId,
        orderDataKeys: Object.keys(orderData),
        orderDataSize: JSON.stringify(orderData).length
      });
      
      // Don't save to localStorage - let the error propagate
      throw error;
    }
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

  // Wishlist endpoints
  async getWishlist() {
    try {
      const currentUser = this.getCurrentUserData();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const username = currentUser.username || currentUser.email || currentUser.id;
      console.log('🌟 Fetching wishlist from backend for user:', username);
      const response = await this.request(`/wishlist/user/${encodeURIComponent(username)}`);
      
      console.log('📦 Raw backend wishlist response:', response);
      console.log('📦 Response type:', typeof response, 'Array?', Array.isArray(response));
      
      // Backend returns array of Wishlist objects, we need to extract the product data
      const wishlistItems = Array.isArray(response) ? response : [];
      console.log('📦 Extracted wishlist items:', wishlistItems);
      console.log('✅ Wishlist fetched successfully:', wishlistItems.length, 'items');
      
      // Transform wishlist items to include product information
      const transformedItems = wishlistItems.map(wishlistItem => {
        // If the wishlist item has product information, use it
        if (wishlistItem.product) {
          return {
            id: wishlistItem.product.id,
            name: wishlistItem.product.name,
            price: wishlistItem.product.price,
            image: wishlistItem.product.image,
            category: wishlistItem.product.category,
            // Include wishlist-specific data
            wishlistId: wishlistItem.id,
            notes: wishlistItem.notes,
            addedAt: wishlistItem.createdAt || wishlistItem.addedAt
          };
        }
        // Fallback if product data is not included
        return wishlistItem;
      });
      
      return transformedItems;
    } catch (error) {
      console.error('❌ Failed to fetch wishlist from backend:', error);
      throw error;
    }
  }

  async addToWishlist(productId, notes = null) {
    try {
      const currentUser = this.getCurrentUserData();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const username = currentUser.username || currentUser.email || currentUser.id;
      console.log('🌟 Adding item to wishlist:', { productId, username, notes });
      
      const requestBody = notes ? { notes } : {};
      const response = await this.request(`/wishlist/add/${encodeURIComponent(username)}/${productId}`, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });
      
      console.log('✅ Item added to wishlist successfully');
      return response;
    } catch (error) {
      console.error('❌ Failed to add item to wishlist:', error);
      throw error;
    }
  }

  async removeFromWishlist(productId) {
    try {
      const currentUser = this.getCurrentUserData();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const username = currentUser.username || currentUser.email || currentUser.id;
      console.log('🗑️ Removing item from wishlist:', { productId, username });
      
      const response = await this.request(`/wishlist/remove/${encodeURIComponent(username)}/${productId}`, {
        method: 'DELETE'
      });
      
      console.log('✅ Item removed from wishlist successfully');
      return response;
    } catch (error) {
      console.error('❌ Failed to remove item from wishlist:', error);
      throw error;
    }
  }

  async clearWishlist() {
    try {
      const currentUser = this.getCurrentUserData();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const username = currentUser.username || currentUser.email || currentUser.id;
      console.log('🗑️ Clearing entire wishlist for user:', username);
      
      const response = await this.request(`/wishlist/clear/${encodeURIComponent(username)}`, {
        method: 'DELETE'
      });
      
      console.log('✅ Wishlist cleared successfully');
      return response;
    } catch (error) {
      console.error('❌ Failed to clear wishlist:', error);
      throw error;
    }
  }

  async checkItemInWishlist(productId) {
    try {
      const currentUser = this.getCurrentUserData();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const username = currentUser.username || currentUser.email || currentUser.id;
      const response = await this.request(`/wishlist/check/${encodeURIComponent(username)}/${productId}`);
      
      return response.inWishlist || false;
    } catch (error) {
      console.error('❌ Failed to check item in wishlist:', error);
      return false;
    }
  }

  async getWishlistCount() {
    try {
      const currentUser = this.getCurrentUserData();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const username = currentUser.username || currentUser.email || currentUser.id;
      const response = await this.request(`/wishlist/count/${encodeURIComponent(username)}`);
      
      return response.count || 0;
    } catch (error) {
      console.error('❌ Failed to get wishlist count:', error);
      return 0;
    }
  }

  async toggleWishlistItem(productId, notes = null) {
    try {
      const currentUser = this.getCurrentUserData();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const username = currentUser.username || currentUser.email || currentUser.id;
      console.log('� Toggling wishlist item:', { productId, username, notes });
      
      const requestBody = notes ? { notes } : {};
      const response = await this.request(`/wishlist/toggle/${encodeURIComponent(username)}/${productId}`, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });
      
      console.log('✅ Wishlist item toggled successfully:', response.action);
      return response;
    } catch (error) {
      console.error('❌ Failed to toggle wishlist item:', error);
      throw error;
    }
  }

  async moveWishlistItemToCart(productId) {
    try {
      const currentUser = this.getCurrentUserData();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const username = currentUser.username || currentUser.email || currentUser.id;
      console.log('🛒 Moving wishlist item to cart:', { productId, username });
      
      const response = await this.request(`/wishlist/move-to-cart/${encodeURIComponent(username)}/${productId}`, {
        method: 'POST'
      });
      
      console.log('✅ Item moved from wishlist to cart successfully');
      return response;
    } catch (error) {
      console.error('❌ Failed to move item to cart:', error);
      throw error;
    }
  }

  async updateWishlistItemNotes(productId, notes) {
    try {
      const currentUser = this.getCurrentUserData();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const username = currentUser.username || currentUser.email || currentUser.id;
      console.log('� Updating wishlist item notes:', { productId, username, notes });
      
      const response = await this.request(`/wishlist/update-notes/${encodeURIComponent(username)}/${productId}`, {
        method: 'PUT',
        body: JSON.stringify({ notes })
      });
      
      console.log('✅ Wishlist item notes updated successfully');
      return response;
    } catch (error) {
      console.error('❌ Failed to update wishlist item notes:', error);
      throw error;
    }
  }

  // Order endpoints - Order History functionality
  async getOrders() {
    const currentUser = this.getCurrentUserData();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    return await this.getOrderHistory(currentUser.username || currentUser.id);
  }

  async getOrderHistory(userId) {
    console.log('🔄 Fetching order history for user:', userId);
    
    try {
      // Only get order history from backend order_history table
      const response = await this.request(`/orders/history/${userId}`, {
        method: 'GET'
      });
      
      console.log('✅ Order history fetched successfully from backend:', response);
      
      // Transform the response to group items by orderNumber
      const groupedOrders = this.transformOrderHistory(response || []);
      console.log('🔄 Transformed order history:', groupedOrders);
      
      return groupedOrders;
      
    } catch (error) {
      console.error('❌ Failed to fetch order history from backend:', error);
      console.log('📭 No localStorage fallback - returning empty array');
      
      // No fallback to localStorage - only show backend orders
      return [];
    }
  }

  // Transform individual order items into grouped orders
  transformOrderHistory(orderItems) {
    if (!orderItems || !Array.isArray(orderItems)) {
      return [];
    }

    // Group order items by orderNumber
    const orderGroups = orderItems.reduce((groups, orderItem) => {
      const orderNumber = orderItem.orderNumber;
      
      if (!groups[orderNumber]) {
        groups[orderNumber] = {
          id: orderNumber,
          orderNumber: orderNumber,
          date: orderItem.orderDate,
          total: orderItem.orderTotalAmount,
          status: 'Completed',
          items: []
        };
      }
      
      // Add the item to this order
      groups[orderNumber].items.push({
        id: orderItem.item.id,
        name: orderItem.item.name,
        price: orderItem.itemPrice,
        quantity: orderItem.quantity,
        image: orderItem.item.imageUrl,
        category: orderItem.item.category
      });
      
      return groups;
    }, {});

    // Convert to array and sort by date (newest first)
    return Object.values(orderGroups).sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    );
  }

  // Local fallback for order history
  getLocalOrderHistory(userId) {
    try {
      const orderHistory = localStorage.getItem(`orderHistory_${userId}`);
      return orderHistory ? JSON.parse(orderHistory) : [];
    } catch (error) {
      console.error('❌ Failed to parse local order history:', error);
      return [];
    }
  }

  // Save order to local history (fallback)
  saveOrderToLocalHistory(userId, orderData) {
    try {
      const existingHistory = this.getLocalOrderHistory(userId);
      const newOrder = {
        id: `local_${Date.now()}`,
        date: new Date().toISOString(),
        total: orderData.total || 0,
        status: 'Completed',
        items: orderData.items || [],
        userId: userId,
        ...orderData
      };
      
      const updatedHistory = [newOrder, ...existingHistory];
      localStorage.setItem(`orderHistory_${userId}`, JSON.stringify(updatedHistory));
      console.log('💾 Order saved to local history:', newOrder);
      
      return newOrder;
    } catch (error) {
      console.error('❌ Failed to save order to local history:', error);
      return null;
    }
  }

  async getOrder(orderId) {
    console.log('🔄 Fetching specific order:', orderId);
    
    try {
      const response = await this.request(`/orders/${orderId}`, {
        method: 'GET'
      });
      
      console.log('✅ Order fetched successfully:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Failed to fetch order:', error);
      
      // Fallback to check local storage
      const currentUser = this.getCurrentUserData();
      if (currentUser) {
        const localHistory = this.getLocalOrderHistory(currentUser.username || currentUser.id);
        return localHistory.find(order => order.id === orderId) || null;
      }
      
      return null;
    }
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