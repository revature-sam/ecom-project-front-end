import React, { useState, useRef, useEffect } from 'react';
import './navbar.css';
export default function Navbar({ query, onChange, suggestions = [], onSelectSuggestion, cartCount, onToggle, bump }) {
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef(null);

  useEffect(() => {
    setActiveIndex(-1);
  }, [suggestions]);

  function onKeyDown(e) {
    if (!suggestions.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0) {
        onSelectSuggestion(suggestions[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setActiveIndex(-1);
    }
  }

  return (
    <nav className="navbar">
      <div className="brand">E-commerce</div>
      <div className="search" ref={containerRef}>
        <input
          placeholder="Search products..."
          value={query}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          aria-autocomplete="list"
          aria-expanded={suggestions.length > 0}
        />

        {suggestions.length > 0 && (
          <ul className="suggestions" role="listbox">
            {suggestions.map((s, idx) => (
              <li
                key={s.name}
                className={`suggestion ${idx === activeIndex ? 'active' : ''}`}
                onMouseDown={() => onSelectSuggestion(s.name)}
                role="option"
                aria-selected={idx === activeIndex}
              >
                <img src={s.image} alt={s.name} className="suggestion-img" />
                <span className="suggestion-text">{s.name}</span>
              </li>
            ))}
          </ul>
        )}
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
