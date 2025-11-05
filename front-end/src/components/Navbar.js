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
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [imageErrors, setImageErrors] = useState({});
  const containerRef = useRef(null);

  const getPlaceholderForCategory = (productName) => {
    const name = productName.toLowerCase();
    if (name.includes('phone') || name.includes('mobile')) return '📱';
    if (name.includes('laptop') || name.includes('computer')) return '💻';
    if (name.includes('headphone') || name.includes('earphone')) return '🎧';
    if (name.includes('tv') || name.includes('television')) return '📺';
    if (name.includes('watch') || name.includes('smart watch')) return '⌚';
    if (name.includes('camera')) return '📷';
    if (name.includes('speaker') || name.includes('audio')) return '🔊';
    if (name.includes('tablet')) return '📱';
    if (name.includes('charger') || name.includes('cable')) return '🔌';
    return '📦';
  };

  const handleImageError = (productName) => {
    setImageErrors(prev => ({
      ...prev,
      [productName]: true
    }));
  };

  useEffect(() => {
    setActiveIndex(-1);
    // Only show suggestions if input is focused, has suggestions, and has query
    setShowSuggestions(isInputFocused && suggestions.length > 0 && query.length > 0);
  }, [suggestions, query, isInputFocused]);

  // Handle clicking outside to close suggestions
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setActiveIndex(-1);
        setIsInputFocused(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelectSuggestion(suggestionName) {
    onSelectSuggestion(suggestionName);
    setShowSuggestions(false);
    setActiveIndex(-1);
    setIsInputFocused(false);
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
      setIsInputFocused(false);
      navigate('/');
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setActiveIndex(-1);
      setIsInputFocused(false);
    }
  }

  function handleInputFocus() {
    setIsInputFocused(true);
    if (suggestions.length > 0 && query.length > 0) {
      setShowSuggestions(true);
    }
  }

  function handleInputBlur() {
    // Don't immediately hide suggestions on blur to allow clicking on them
    // The clickOutside handler will take care of hiding them
    setIsInputFocused(false);
  }

  function handleBrandClick() {
    onChange(''); // Clear search query
    setShowSuggestions(false); // Hide suggestions
    setActiveIndex(-1); // Reset active index
    setIsInputFocused(false); // Reset focus state
    navigate('/'); // Navigate to home
  }

  return (
    <nav className="navbar">
      <button className="brand" onClick={handleBrandClick}>
        <span className="brand-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 2v11h3v9l7-12h-4l4-8z"/>
          </svg>
        </span>
        ByteMart
      </button>
      {isHomePage ? (
        <div className="search-center" ref={containerRef}>
          <input
            placeholder="Search products..."
            value={query}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
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
                  {!imageErrors[s.name] && s.image ? (
                    <img 
                      src={s.image} 
                      alt={s.name} 
                      className="suggestion-img"
                      onError={() => handleImageError(s.name)}
                    />
                  ) : (
                    <div className="suggestion-placeholder">
                      {getPlaceholderForCategory(s.name)}
                    </div>
                  )}
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
            onBlur={handleInputBlur}
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
                  {!imageErrors[s.name] && s.image ? (
                    <img 
                      src={s.image} 
                      alt={s.name} 
                      className="suggestion-img"
                      onError={() => handleImageError(s.name)}
                    />
                  ) : (
                    <div className="suggestion-placeholder">
                      {getPlaceholderForCategory(s.name)}
                    </div>
                  )}
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
