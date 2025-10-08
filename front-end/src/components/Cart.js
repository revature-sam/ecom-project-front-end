import React from 'react';
import './cart.css';

export default function Cart({ items, onRemove }) {
  const total = items.reduce((s, it) => s + it.price * it.quantity, 0);

  return (
    <aside className="cart">
      <h2>Cart</h2>
      {items.length === 0 ? (
        <p className="empty">Your cart is empty</p>
      ) : (
        <ul className="cart-list">
          {items.map((it) => (
            <li key={it.id} className="cart-item">
              <div className="cart-item-info">
                <span className="cart-name">{it.name}</span>
                <span className="cart-qty">x{it.quantity}</span>
              </div>
              <div className="cart-item-actions">
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
    </aside>
  );
}
