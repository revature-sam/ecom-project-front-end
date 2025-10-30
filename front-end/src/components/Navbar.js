import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './navbar.css';

export default function Navbar({ 
  query, 
  onChange, 
  suggestions = [], 
  onSelectSuggestion, 
  cartCount, 
  onToggle, 
  bump, 
  user, 
  isHomePage,
  currentPath
}) {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    setActiveIndex(-1);
    setShowSuggestions(suggestions.length > 0 && query.length > 0);
  }, [suggestions, query]);

  // Handle clicking outside to close suggestions
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setActiveIndex(-1);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelectSuggestion(suggestionName) {
    onSelectSuggestion(suggestionName);
    setShowSuggestions(false);
    setActiveIndex(-1);
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (showSuggestions && suggestions.length > 0) {
        setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (showSuggestions && suggestions.length > 0) {
        setActiveIndex((i) => Math.max(i - 1, 0));
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (showSuggestions && activeIndex >= 0 && suggestions.length > 0) {
        const selectedSuggestion = suggestions[activeIndex];
        const productName = typeof selectedSuggestion === 'string' 
          ? selectedSuggestion 
          : selectedSuggestion.name;
        onChange(productName);
      }
      setShowSuggestions(false);
      setActiveIndex(-1);
      navigate('/');
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setActiveIndex(-1);
    }
  }

  function handleInputFocus() {
    if (suggestions.length > 0 && query.length > 0) {
      setShowSuggestions(true);
    }
  }

  function handleBrandClick() {
    onChange(''); // Clear search query
    setShowSuggestions(false); // Hide suggestions
    setActiveIndex(-1); // Reset active index
    navigate('/'); // Navigate to home
  }

  return (
    <nav className="navbar">
      <button className="brand" onClick={handleBrandClick}>
        E-commerce
      </button>
      {isHomePage ? (
        <div className="search-center" ref={containerRef}>
          <input
            placeholder="Search products..."
            value={query}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={handleInputFocus}
            aria-autocomplete="list"
            aria-expanded={showSuggestions}
          />

          {showSuggestions && suggestions.length > 0 && (
            <ul className="suggestions" role="listbox">
              {suggestions.map((s, idx) => (
                <li
                  key={s.name}
                  className={`suggestion ${idx === activeIndex ? 'active' : ''}`}
                  onMouseDown={() => handleSelectSuggestion(s.name)}
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
      ) : (
        <div className="search" ref={containerRef}>
          <input
            placeholder="Search products..."
            value={query}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={handleInputFocus}
            aria-autocomplete="list"
            aria-expanded={showSuggestions}
          />

          {showSuggestions && suggestions.length > 0 && (
            <ul className="suggestions" role="listbox">
              {suggestions.map((s, idx) => (
                <li
                  key={s.name}
                  className={`suggestion ${idx === activeIndex ? 'active' : ''}`}
                  onMouseDown={() => handleSelectSuggestion(s.name)}
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
      )}
      <div className="nav-actions">
        {user ? (
          currentPath !== '/account' && (
            <button className="account-button" onClick={() => navigate('/account')}>
              <span className="account-text">My Account</span>
            </button>
          )
        ) : (
          <button className="login-button" onClick={() => navigate('/login')}>
            Sign In
          </button>
        )}
        
        {(isHomePage || currentPath === '/account') && (
          <button className="cart-button" onClick={onToggle} aria-label={`Open cart with ${cartCount} items`}>
            <span className="cart-text">Cart</span>
            <span className={`badge ${bump ? 'bump' : ''}`}>{cartCount}</span>
          </button>
        )}
      </div>
    </nav>
  );
}
