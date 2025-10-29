import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './checkout.css';

export default function Checkout({ cart, onUpdateCart }) {
  const navigate = useNavigate();
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [discountError, setDiscountError] = useState('');

  // Mock discount codes
  const validDiscounts = {
    'SAVE10': { percent: 10, description: '10% off your order' },
    'WELCOME20': { percent: 20, description: '20% off for new customers' },
    'TECH15': { percent: 15, description: '15% off tech items' }
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = appliedDiscount ? (subtotal * appliedDiscount.percent / 100) : 0;
  const tax = (subtotal - discountAmount) * 0.08; // 8% tax
  const shipping = subtotal > 50 ? 0 : 9.99; // Free shipping over $50
  const total = subtotal - discountAmount + tax + shipping;

  function handleApplyDiscount() {
    const code = discountCode.trim().toUpperCase();
    if (validDiscounts[code]) {
      setAppliedDiscount(validDiscounts[code]);
      setDiscountError('');
    } else {
      setDiscountError('Invalid discount code');
      setAppliedDiscount(null);
    }
  }

  function handleRemoveDiscount() {
    setAppliedDiscount(null);
    setDiscountCode('');
    setDiscountError('');
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

  function handlePlaceOrder() {
    alert(`Order placed! Total: $${total.toFixed(2)}`);
    // In a real app, this would process the payment and clear the cart
    onUpdateCart([]);
    navigate('/');
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
                  <div className="item-controls">
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
                    <button 
                      className="remove-btn"
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="item-total">
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
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
                  disabled={appliedDiscount}
                />
                {!appliedDiscount ? (
                  <button className="apply-btn" onClick={handleApplyDiscount}>
                    Apply
                  </button>
                ) : (
                  <button className="remove-discount-btn" onClick={handleRemoveDiscount}>
                    Remove
                  </button>
                )}
              </div>
              {discountError && <p className="discount-error">{discountError}</p>}
              {appliedDiscount && (
                <p className="discount-success">✓ {appliedDiscount.description}</p>
              )}
            </div>
          </div>

          <div className="order-totals">
            <h2>Order Total</h2>
            <div className="totals-breakdown">
              <div className="total-line">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {appliedDiscount && (
                <div className="total-line discount-line">
                  <span>Discount ({appliedDiscount.percent}% off)</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="total-line">
                <span>Shipping</span>
                <span>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
              </div>
              <div className="total-line">
                <span>Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="total-line final-total">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            <button 
              className="place-order-btn"
              onClick={handlePlaceOrder}
              disabled={cart.length === 0}
            >
              Place Order
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