import React from 'react';
import './productCard.css';

export default function ProductCard({ product, onAdd }) {
  return (
    <div className="product-card">
      <div className="product-image" style={{ backgroundImage: `url(${product.image})` }} />
      <div className="product-body">
        <h3 className="product-title" title={product.name}>{product.name}</h3>
        <div className="product-divider"></div>
        <p className="product-price">${product.price.toFixed(2)}</p>
        <button className="btn-add" onClick={() => onAdd(product)}>Add to cart</button>
      </div>
    </div>
  );
}
