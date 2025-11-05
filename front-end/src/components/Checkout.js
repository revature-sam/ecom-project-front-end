import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './checkout.css';
import apiService from '../services/apiService';

export default function Checkout({ cart, onUpdateCart, onPlaceOrder, showNotification, currentUser }) {
  const navigate = useNavigate();
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [discountError, setDiscountError] = useState('');
  const [availableDiscounts, setAvailableDiscounts] = useState({});
  const [checkoutSummary, setCheckoutSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState('credit-card');
  const [shippingAddress, setShippingAddress] = useState('');

  // Helper function to get the actual logged-in user (same as apiService uses)
  function getLoggedInUser() {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch (e) {
        console.warn('Failed to parse stored user:', e);
      }
    }
    return null;
  }

  // Helper function to safely get user identifier
  function getUserId() {
    // First try the actual logged-in user (same as cart operations use)
    const loggedInUser = getLoggedInUser();
    if (loggedInUser) {
      return loggedInUser.username || loggedInUser.id || loggedInUser.userId || loggedInUser.email;
    }

    // Fallback to prop-based currentUser
    if (currentUser) {
      return currentUser.username || currentUser.id || currentUser.userId || currentUser.email;
    }
    
    return 'anonymous';
  }

  // Check if user is authenticated
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    loadAvailableDiscounts();
    loadCheckoutSummary();
  }, [currentUser, cart]);

  async function loadAvailableDiscounts() {
    try {
      const discounts = await apiService.getAvailableDiscounts();
      setAvailableDiscounts(discounts.codes || {});
    } catch (error) {
      console.warn('Failed to load discounts from backend, using fallback:', error);
      // Fallback to hardcoded discounts
      setAvailableDiscounts({
        'SAVE10': { description: '10% off your order', discount: 0.10 },
        'SAVE20': { description: '20% off your order', discount: 0.20 },
        'WELCOME5': { description: '5% welcome discount', discount: 0.05 },
        'STUDENT15': { description: '15% student discount', discount: 0.15 }
      });
    }
  }

  async function loadCheckoutSummary() {
    if (!currentUser) return;

    try {
      setIsLoading(true);
      const userId = getUserId();
      const summary = await apiService.getCheckoutSummary(userId);
      setCheckoutSummary(summary);
    } catch (error) {
      console.warn('Failed to load checkout summary from backend, using fallback calculation:', error);
      calculateFallbackSummary();
    } finally {
      setIsLoading(false);
    }
  }

  function calculateFallbackSummary() {
    const subtotal = cart.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity) || 0;
      return sum + (price * quantity);
    }, 0);
    const discountAmount = appliedDiscount ? (subtotal * appliedDiscount.discount) : 0;
    const tax = (subtotal - discountAmount) * 0.08; // 8% tax
    const shipping = subtotal > 50 ? 0 : 9.99; // Free shipping over $50
    const total = subtotal - discountAmount + tax + shipping;

    setCheckoutSummary({
      subtotal,
      discountAmount,
      tax,
      shipping,
      total
    });
  }

  async function handleApplyDiscount() {
    const code = discountCode.trim().toUpperCase();
    setDiscountError('');

    if (!code) {
      setDiscountError('Please enter a discount code');
      return;
    }

    try {
      setIsLoading(true);
      const userId = getUserId();
      const response = await apiService.applyDiscountCode(userId, code);
      
      if (response.success) {
        setAppliedDiscount({
          code: response.appliedCode,
          discount: response.discountAmount,
          description: `Discount applied: ${response.appliedCode}`
        });
        await loadCheckoutSummary(); // Refresh summary
        
        if (showNotification) {
          showNotification('Discount code applied successfully!', 'success');
        }
      }
    } catch (error) {
      console.warn('Backend discount failed, trying local validation:', error);
      
      // Fallback to local discount validation
      if (availableDiscounts[code]) {
        setAppliedDiscount({
          code,
          discount: availableDiscounts[code].discount,
          description: availableDiscounts[code].description
        });
        calculateFallbackSummary();
        
        if (showNotification) {
          showNotification('Discount code applied!', 'success');
        }
      } else {
        setDiscountError('Invalid discount code');
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRemoveDiscount() {
    try {
      const userId = getUserId();
      await apiService.removeDiscountCode(userId);
      setAppliedDiscount(null);
      setDiscountCode('');
      setDiscountError('');
      await loadCheckoutSummary();
      
      if (showNotification) {
        showNotification('Discount code removed', 'info');
      }
    } catch (error) {
      console.warn('Backend remove discount failed, using local removal:', error);
      setAppliedDiscount(null);
      setDiscountCode('');
      setDiscountError('');
      calculateFallbackSummary();
    }
  }

  async function handleShippingMethodChange(method) {
    setShippingMethod(method);
    
    try {
      const userId = getUserId();
      await apiService.selectShippingMethod(userId, method, shippingAddress);
      await loadCheckoutSummary();
    } catch (error) {
      console.warn('Failed to update shipping method in backend:', error);
      calculateFallbackSummary();
    }
  }

  async function handlePaymentMethodChange(method) {
    setPaymentMethod(method);
    
    try {
      const userId = getUserId();
      await apiService.selectPaymentMethod(userId, method);
    } catch (error) {
      console.warn('Failed to update payment method in backend:', error);
    }
  }

  function handleQuantityChange(itemId, newQuantity) {
    if (newQuantity <= 0) {
      onUpdateCart(cart.filter(item => item.id !== itemId));
    } else {
      onUpdateCart(cart.map(item => 
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      ));
    }
  }

  function handleRemoveItem(itemId) {
    onUpdateCart(cart.filter(item => item.id !== itemId));
  }

  async function handlePlaceOrder() {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // Debug logging
    const loggedInUser = getLoggedInUser();
    console.log('🔍 Detailed User Analysis:', {
      propCurrentUser: currentUser,
      storedCurrentUser: loggedInUser,
      getUserIdResult: getUserId(),
      localStorageRaw: localStorage.getItem('currentUser'),
      usingSameUser: getUserId() === (loggedInUser?.username || loggedInUser?.id)
    });

    console.log('🔍 Cart Analysis:', {
      cartLength: cart.length,
      cartItems: cart,
      hasItems: cart && cart.length > 0
    });

    // Check if cart is empty on frontend
    if (!cart || cart.length === 0) {
      if (showNotification) {
        showNotification('Your cart is empty. Please add items before checkout.', 'error');
      }
      return;
    }

    try {
      setIsLoading(true);

      const userId = getUserId();
      
      // Note: Cart should already be synchronized with backend from add-to-cart operations
      console.log('🔄 Proceeding with order submission for user:', userId);

      // Validate checkout
      try {
        await apiService.validateCheckout(userId);
        console.log('✅ Checkout validation passed');
      } catch (validationError) {
        console.warn('⚠️ Backend validation failed, proceeding with frontend validation:', validationError);
        
        // Frontend fallback validation
        if (!cart || cart.length === 0) {
          throw new Error('Cart is empty');
        }
        if (!userId || userId === 'anonymous') {
          throw new Error('User not properly authenticated');
        }
        console.log('✅ Frontend validation passed');
      }

      const orderData = {
        items: cart,
        total: Math.round((checkoutSummary?.total || 0) * 100) / 100,
        subtotal: Math.round((checkoutSummary?.subtotal || 0) * 100) / 100,
        discountAmount: Math.round((checkoutSummary?.discountAmount || 0) * 100) / 100,
        tax: Math.round((checkoutSummary?.tax || 0) * 100) / 100,
        shipping: Math.round((checkoutSummary?.shipping || 0) * 100) / 100,
        shippingMethod,
        paymentMethod,
        userId: userId
      };

      console.log('🔍 Complete order data being sent:', JSON.stringify(orderData, null, 2));

      // Submit order to backend
      try {
        const response = await apiService.submitOrder(userId, orderData);

        // Call the parent's order handler if provided
        if (onPlaceOrder) {
          onPlaceOrder({ ...orderData, orderId: response.orderId, success: true });
        }

        if (showNotification) {
          showNotification(`Order placed successfully! Order ID: ${response.orderId}`, 'success');
        }

        navigate('/');
      } catch (orderError) {
        console.error('❌ Backend order submission failed:', orderError);
        
        // No local fallback - just notify user of failure
        if (onPlaceOrder) {
          onPlaceOrder({ ...orderData, success: false, error: orderError.message });
        }

        if (showNotification) {
          showNotification(
            `Order submission failed: ${orderError.message}. Please try again.`, 
            'error'
          );
        }

        // Don't navigate away on failure - let user try again
      }
    } catch (error) {
      console.error('Failed to place order:', error);
      
      if (showNotification) {
        showNotification(`Failed to place order: ${error.message}`, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  }

  const summary = checkoutSummary || {
    subtotal: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    discountAmount: 0,
    tax: 0,
    shipping: 0,
    total: 0
  };

  if (!currentUser) {
    return (
      <div className="checkout-page">
        <div className="checkout-container">
          <div className="auth-required">
            <h2>Please log in to continue with checkout</h2>
            <button onClick={() => navigate('/login')} className="login-btn">
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <header className="checkout-header">
          <button className="back-btn" onClick={() => navigate('/')}>
            ← Back to Shopping
          </button>
          <h1>Checkout</h1>
        </header>

        <div className="checkout-content">
          <div className="order-summary">
            <h2>Order Summary</h2>
            <div className="items-list">
              {cart.map(item => (
                <div key={item.id} className="checkout-item">
                  <img src={item.image} alt={item.name} className="item-image" />
                  <div className="item-details">
                    <h3 className="item-name">{item.name}</h3>
                    <p className="item-price">${(parseFloat(item.price) || 0).toFixed(2)}</p>
                  </div>
                  <div className="quantity-controls">
                    <button 
                      className="qty-btn"
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                    >
                      -
                    </button>
                    <span className="quantity">{item.quantity}</span>
                    <button 
                      className="qty-btn"
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                  <div className="item-total">
                    ${((parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0)).toFixed(2)}
                  </div>
                  <button 
                    className="remove-btn"
                    onClick={() => handleRemoveItem(item.id)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="discount-section">
              <h3>Discount Code</h3>
              <div className="discount-input">
                <input
                  type="text"
                  placeholder="Enter discount code"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  disabled={appliedDiscount || isLoading}
                />
                {!appliedDiscount ? (
                  <button 
                    className="apply-btn" 
                    onClick={handleApplyDiscount}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Applying...' : 'Apply'}
                  </button>
                ) : (
                  <button 
                    className="remove-discount-btn" 
                    onClick={handleRemoveDiscount}
                    disabled={isLoading}
                  >
                    Remove
                  </button>
                )}
              </div>
              {discountError && <p className="discount-error">{discountError}</p>}
              {appliedDiscount && (
                <p className="discount-success">✓ {appliedDiscount.description}</p>
              )}
            </div>

            {/* Payment Options */}
          </div>

          <div className="order-totals">
            <h2>Order Total</h2>
            {isLoading && <div className="loading">Calculating totals...</div>}
            <div className="totals-breakdown">
              <div className="total-line">
                <span>Subtotal</span>
                <span>${(summary?.subtotal || 0).toFixed(2)}</span>
              </div>
              {(summary?.discountAmount || 0) > 0 && (
                <div className="total-line discount-line">
                  <span>Discount</span>
                  <span>-${(summary?.discountAmount || 0).toFixed(2)}</span>
                </div>
              )}
              <div className="total-line">
                <span>Shipping</span>
                <span>{(summary?.shipping || 0) === 0 ? 'FREE' : `$${(summary?.shipping || 0).toFixed(2)}`}</span>
              </div>
              <div className="total-line">
                <span>Tax</span>
                <span>${(summary?.tax || 0).toFixed(2)}</span>
              </div>
              <div className="total-line final-total">
                <span>Total</span>
                <span>${(summary?.total || 0).toFixed(2)}</span>
              </div>
            </div>
            
            <button 
              className="place-order-btn" 
              onClick={handlePlaceOrder}
              disabled={cart.length === 0 || isLoading}
            >
              {isLoading ? 'Processing...' : `Place Order - $${(summary?.total || 0).toFixed(2)}`}
            </button>

            <div className="payment-info">
              <p>🔒 Secure checkout</p>
              <p>📦 Free shipping on orders over $50</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}