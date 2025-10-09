import React from 'react';
import './navbar.css';

export default function Navbar({ query, onChange, cartCount, onToggle, bump }) {
  return (
    <nav className="navbar">
      <div className="brand">E-commerce</div>
      <div className="search">
        <input
          placeholder="Search products..."
          value={query}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <div className="nav-actions">
        <button className="cart-button" onClick={onToggle} aria-label={`Open cart with ${cartCount} items`}>
          <span className={`badge ${bump ? 'bump' : ''}`}>{cartCount}</span>
          <span className="cart-text">Cart</span>
        </button>
      </div>
    </nav>
  );
}
