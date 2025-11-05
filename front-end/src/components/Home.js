import React, { useState } from 'react';
import ProductCard from './ProductCard';
import FilterSidebar from './FilterSidebar';
import './account.css'; // Import for modal styles

// Item Details Modal Component
function ItemDetailsModal({ item, onClose, onAddToCart, onToggleWishlist, isInWishlist, user, showNotification, isClosing }) {
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

  const handleWishlistClick = () => {
    if (!user) {
      showNotification('Please sign in to add items to your wishlist', 'warning');
      return;
    }
    onToggleWishlist(item);
    onClose(); // Close modal after wishlist action
  };

  const handleAddToCart = () => {
    onAddToCart(item);
    onClose(); // Close modal after adding to cart
  };

  return (
    <div className={`modal-overlay ${isClosing ? 'closing' : ''}`} onClick={onClose}>
      <div className={`modal-content ${isClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Product Details</h3>
          <button 
            className="close-btn"
            onClick={onClose}
            title="Close"
          >
            ✕
          </button>
        </div>
        <div className="modal-body">
          <div className="item-details-content">
            <div className="item-image-section">
              {item.image ? (
                <img 
                  src={item.image} 
                  alt={item.name}
                  className="item-detail-image"
                />
              ) : (
                <div className="item-detail-placeholder">
                  <span className="placeholder-icon">{getPlaceholderIcon(item.category)}</span>
                  <span className="placeholder-text">
                    {getPlaceholderIcon(item.category) === '📦' ? 'OTHER' : (item.category || 'Product')}
                  </span>
                </div>
              )}
            </div>
            <div className="item-info-section">
              <h2 className="item-detail-name">{item.name}</h2>
              <p className="item-detail-category">Category: {item.category || 'Uncategorized'}</p>
              <p className="item-detail-description">
                {item.description || 'No description available'}
              </p>
              <p className="item-detail-stock">
                Stock: <span className={item.stockQuantity === 0 ? 'out-of-stock' : 'in-stock'}>
                  {item.stockQuantity !== undefined ? item.stockQuantity : 'N/A'}
                </span>
              </p>
              <p className="item-detail-price">${item.price.toFixed(2)}</p>
              
              <div className="item-actions">
                <button 
                  className="btn-add-modal"
                  onClick={handleAddToCart}
                  disabled={item.stockQuantity === 0}
                >
                  {item.stockQuantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
                <button 
                  className={`wishlist-btn-modal ${isInWishlist ? 'active' : ''} ${!user ? 'disabled' : ''}`}
                  onClick={handleWishlistClick}
                  title={
                    !user 
                      ? 'Sign in to add to wishlist' 
                      : isInWishlist 
                        ? 'Remove from wishlist' 
                        : 'Add to wishlist'
                  }
                >
                  {isInWishlist ? '★' : '☆'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home({ 
  products = [], // Default to empty array to prevent errors
  onAddToCart, 
  query, 
  onQueryChange,
  selectedCategory, 
  onSelectCategory,
  priceRange,
  onPriceRangeChange,
  sortBy,
  onSortChange,
  wishlist = [], // Default to empty array
  onToggleWishlist,
  user,
  showNotification
}) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [isClosing, setIsClosing] = useState(false);

  const handleItemClick = (item) => {
    setSelectedItem(item);
    setIsClosing(false);
  };

  const handleCloseModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setSelectedItem(null);
      setIsClosing(false);
    }, 200); // Match the animation duration
  };

  // Handle case where products might be null or undefined
  if (!products) {
    return (
      <main className="catalog">
        <header className="catalog-header">
          <h1>Welcome to ByteMart</h1>
          <p className="lead">Loading products...</p>
        </header>
        <div className="catalog-content">
          <div className="loading-message">
            <h3>Loading products...</h3>
            <p>Please wait while we fetch the latest products.</p>
          </div>
        </div>
      </main>
    );
  }
  // Apply all filters
  let filteredProducts = products
    .filter((p) => {
      if (selectedCategory === 'All') return true;
      if (selectedCategory === 'Other') {
        // Show items that don't match any of the main categories
        const mainCategories = ['Phones', 'Laptops', 'Accessories', 'Audio'];
        return !mainCategories.includes(p.category);
      }
      return p.category === selectedCategory;
    })
    .filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()))
    .filter((p) => p.price >= priceRange[0] && (priceRange[1] >= 1500 ? true : p.price <= priceRange[1]));

  // Apply sorting
  if (sortBy === 'name') {
    filteredProducts = filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === 'name-desc') {
    filteredProducts = filteredProducts.sort((a, b) => b.name.localeCompare(a.name));
  } else if (sortBy === 'price-low') {
    filteredProducts = filteredProducts.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price-high') {
    filteredProducts = filteredProducts.sort((a, b) => b.price - a.price);
  }

  return (
    <main className="catalog">
      <header className="catalog-header">
        <h1>Welcome to ByteMart</h1>
        <p className="lead">Browse tech items and add them to your cart.</p>
      </header>

      <div className="catalog-content">
        <FilterSidebar
          categories={['All', 'Phones', 'Laptops', 'Accessories', 'Audio', 'Other']}
          selectedCategory={selectedCategory}
          onSelectCategory={onSelectCategory}
          priceRange={priceRange}
          onPriceRangeChange={onPriceRangeChange}
          sortBy={sortBy}
          onSortChange={onSortChange}
          onQueryChange={onQueryChange}
        />

        <section className="products">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((p) => (
              <ProductCard 
                key={p.id} 
                product={p} 
                onAdd={onAddToCart}
                onToggleWishlist={onToggleWishlist}
                isInWishlist={wishlist.some(item => item.id === p.id)}
                user={user}
                showNotification={showNotification}
                onClick={handleItemClick}
              />
            ))
          ) : (
            <div className="no-products">
              <h3>No products found</h3>
              <p>Try adjusting your filters or search terms.</p>
            </div>
          )}
        </section>
      </div>

      {/* Item Details Modal */}
      {selectedItem && (
        <ItemDetailsModal
          item={selectedItem}
          onClose={handleCloseModal}
          onAddToCart={onAddToCart}
          onToggleWishlist={onToggleWishlist}
          isInWishlist={wishlist.some(item => item.id === selectedItem.id)}
          user={user}
          showNotification={showNotification}
          isClosing={isClosing}
        />
      )}
    </main>
  );
}