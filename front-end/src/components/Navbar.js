import React from 'react';
import './navbar.css';

export default function Navbar({ query, onChange, cartCount }) {
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
        <div className="cart-bubble">Cart ({cartCount})</div>
      </div>
    </nav>
  );
}
