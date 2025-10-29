import React from 'react';
import './cart.css';

export default function Cart({ items, onRemove, onChangeQuantity, className, onCheckout, onClearCart }) {
  const total = items.reduce((s, it) => s + it.price * it.quantity, 0);

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      onClearCart();
    }
  };

  return (
    <aside className={`cart ${className || ''}`}>
      <div className="cart-header">
        <h2 className="cart-title">Cart</h2>
        <button 
          className={`clear-cart-btn ${items.length === 0 ? 'disabled' : ''}`}
          onClick={handleClearCart}
          disabled={items.length === 0}
        >
          Clear Cart
        </button>
      </div>
      {items.length === 0 ? (
        <p className="empty">Your cart is empty</p>
      ) : (
        <ul className="cart-list">
          {items.map((it) => (
            <li key={it.id} className="cart-item">
              <div className="cart-item-info">
                <span className="cart-name" title={it.name}>{it.name}</span>
              </div>
              <div className="cart-item-actions">
                <div className="qty-controls">
                  <button className="qty-btn" onClick={() => onChangeQuantity(it.id, it.quantity - 1)}>-</button>
                  <span className="cart-qty">{it.quantity}</span>
                  <button className="qty-btn" onClick={() => onChangeQuantity(it.id, it.quantity + 1)}>+</button>
                </div>
                <span className="cart-price">${(it.price * it.quantity).toFixed(2)}</span>
                <button className="btn-remove" onClick={() => onRemove(it.id)}>Remove</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="cart-total">
        <strong>Total:</strong>
        <span>${total.toFixed(2)}</span>
      </div>
      <div className="cart-actions">
        <button
          className="checkout-btn"
          disabled={items.length === 0}
          onClick={() => {
            if (onCheckout) onCheckout(items, total);
            else console.log('Checkout clicked', { items, total });
          }}
        >
          Proceed to Checkout
        </button>
      </div>
    </aside>
  );
}
