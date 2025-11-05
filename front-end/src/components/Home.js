import React from 'react';
import ProductCard from './ProductCard';
import FilterSidebar from './FilterSidebar';

export default function Home({ 
  products = [], // Default to empty array to prevent errors
  onAddToCart, 
  query, 
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
    </main>
  );
}