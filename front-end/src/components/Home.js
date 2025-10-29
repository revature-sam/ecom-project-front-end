import React from 'react';
import ProductCard from './ProductCard';
import FilterSidebar from './FilterSidebar';

export default function Home({ 
  products, 
  onAddToCart, 
  query, 
  selectedCategory, 
  onSelectCategory,
  priceRange,
  onPriceRangeChange,
  sortBy,
  onSortChange,
  wishlist,
  onToggleWishlist
}) {
  // Apply all filters
  let filteredProducts = products
    .filter((p) => selectedCategory === 'All' || p.category === selectedCategory)
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
        <h1>E-commerce App</h1>
        <p className="lead">Browse placeholder items and add them to your cart.</p>
      </header>

      <div className="catalog-content">
        <FilterSidebar
          categories={['All', 'Phones', 'Laptops', 'Accessories', 'Audio']}
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