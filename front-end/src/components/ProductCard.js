import React, { useState } from 'react';
import './productCard.css';

export default function ProductCard({ product, onAdd }) {
  const [imageError, setImageError] = useState(false);

  const getPlaceholderIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'phones':
        return '📱';
      case 'laptops':
        return '💻';
      case 'accessories':
        return '🔌';
      case 'audio':
        return '🎧';
      default:
        return '📦';
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className="product-card">
      <div className="product-image-container">
        {!imageError ? (
          <img 
            className="product-image" 
            src={product.image}
            alt={product.name}
            onError={handleImageError}
          />
        ) : (
          <div className="product-placeholder">
            <span className="placeholder-icon">{getPlaceholderIcon(product.category)}</span>
            <span className="placeholder-text">{product.category || 'Product'}</span>
          </div>
        )}
      </div>
      <div className="product-body">
        <h3 className="product-title" title={product.name}>{product.name}</h3>
        <div className="product-divider"></div>
        <p className="product-price">${product.price.toFixed(2)}</p>
        <button className="btn-add" onClick={() => onAdd(product)}>Add to cart</button>
      </div>
    </div>
  );
}
