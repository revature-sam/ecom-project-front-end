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
      const summary = await apiService.getCheckoutSummary(currentUser.id.toString());
      setCheckoutSummary(summary);
    } catch (error) {
      console.warn('Failed to load checkout summary from backend, using fallback calculation:', error);
      calculateFallbackSummary();
    } finally {
      setIsLoading(false);
    }
  }

  function calculateFallbackSummary() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
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
      const response = await apiService.applyDiscountCode(currentUser.id.toString(), code);
      
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
      await apiService.removeDiscountCode(currentUser.id.toString());
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
      await apiService.selectShippingMethod(currentUser.id.toString(), method, shippingAddress);
      await loadCheckoutSummary();
    } catch (error) {
      console.warn('Failed to update shipping method in backend:', error);
      calculateFallbackSummary();
    }
  }

  async function handlePaymentMethodChange(method) {
    setPaymentMethod(method);
    
    try {
      await apiService.selectPaymentMethod(currentUser.id.toString(), method);
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

    try {
      setIsLoading(true);

      // Validate checkout first
      await apiService.validateCheckout(currentUser.id.toString());

      const orderData = {
        items: cart,
        total: checkoutSummary?.total || 0,
        subtotal: checkoutSummary?.subtotal || 0,
        discountAmount: checkoutSummary?.discountAmount || 0,
        tax: checkoutSummary?.tax || 0,
        shipping: checkoutSummary?.shipping || 0,
        shippingMethod,
        paymentMethod,
        userId: currentUser.id
      };

      // Submit order to backend
      const response = await apiService.submitOrder(currentUser.id.toString(), orderData);

      if (response.success) {
        // Call the parent's order handler if provided
        if (onPlaceOrder) {
          onPlaceOrder(orderData);
        }

        if (showNotification) {
          showNotification(`Order placed successfully! Order ID: ${response.orderId}`, 'success');
        }

        navigate('/');
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
                    <p className="item-price">${item.price.toFixed(2)}</p>
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
                    ${(item.price * item.quantity).toFixed(2)}
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
              
              {/* Show available discount codes */}
              <div className="available-discounts">
                <h4>Available Discounts:</h4>
                <div className="discount-codes">
                  {Object.entries(availableDiscounts).map(([code, details]) => (
                    <div key={code} className="discount-code-item">
                      <strong>{code}</strong>: {details.description}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Shipping Options */}
            <div className="shipping-section">
              <h3>Shipping Method</h3>
              <div className="shipping-options">
                <label className="shipping-option">
                  <input
                    type="radio"
                    name="shipping"
                    value="standard"
                    checked={shippingMethod === 'standard'}
                    onChange={(e) => handleShippingMethodChange(e.target.value)}
                  />
                  <span>Standard Shipping (5-7 days) - FREE over $50</span>
                </label>
                <label className="shipping-option">
                  <input
                    type="radio"
                    name="shipping"
                    value="express"
                    checked={shippingMethod === 'express'}
                    onChange={(e) => handleShippingMethodChange(e.target.value)}
                  />
                  <span>Express Shipping (2-3 days) - $15.99</span>
                </label>
                <label className="shipping-option">
                  <input
                    type="radio"
                    name="shipping"
                    value="overnight"
                    checked={shippingMethod === 'overnight'}
                    onChange={(e) => handleShippingMethodChange(e.target.value)}
                  />
                  <span>Overnight Shipping (1 day) - $29.99</span>
                </label>
              </div>
              
              <div className="shipping-address">
                <label>Shipping Address:</label>
                <textarea
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Enter your shipping address"
                  rows="3"
                />
              </div>
            </div>

            {/* Payment Options */}
            <div className="payment-section">
              <h3>Payment Method</h3>
              <div className="payment-options">
                <label className="payment-option">
                  <input
                    type="radio"
                    name="payment"
                    value="credit-card"
                    checked={paymentMethod === 'credit-card'}
                    onChange={(e) => handlePaymentMethodChange(e.target.value)}
                  />
                  <span>Credit Card</span>
                </label>
                <label className="payment-option">
                  <input
                    type="radio"
                    name="payment"
                    value="paypal"
                    checked={paymentMethod === 'paypal'}
                    onChange={(e) => handlePaymentMethodChange(e.target.value)}
                  />
                  <span>PayPal</span>
                </label>
                <label className="payment-option">
                  <input
                    type="radio"
                    name="payment"
                    value="apple-pay"
                    checked={paymentMethod === 'apple-pay'}
                    onChange={(e) => handlePaymentMethodChange(e.target.value)}
                  />
                  <span>Apple Pay</span>
                </label>
              </div>
            </div>
          </div>

          <div className="order-totals">
            <h2>Order Total</h2>
            {isLoading && <div className="loading">Calculating totals...</div>}
            <div className="totals-breakdown">
              <div className="total-line">
                <span>Subtotal</span>
                <span>${summary.subtotal.toFixed(2)}</span>
              </div>
              {summary.discountAmount > 0 && (
                <div className="total-line discount-line">
                  <span>Discount</span>
                  <span>-${summary.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="total-line">
                <span>Shipping</span>
                <span>{summary.shipping === 0 ? 'FREE' : `$${summary.shipping.toFixed(2)}`}</span>
              </div>
              <div className="total-line">
                <span>Tax</span>
                <span>${summary.tax.toFixed(2)}</span>
              </div>
              <div className="total-line final-total">
                <span>Total</span>
                <span>${summary.total.toFixed(2)}</span>
              </div>
            </div>
            
            <button 
              className="place-order-btn" 
              onClick={handlePlaceOrder}
              disabled={cart.length === 0 || isLoading}
            >
              {isLoading ? 'Processing...' : `Place Order - $${summary.total.toFixed(2)}`}
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