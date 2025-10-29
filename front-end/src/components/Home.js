import React from 'react';
import ProductCard from './ProductCard';
import FilterBar from './FilterBar';

export default function Home({ 
  products, 
  onAddToCart, 
  query, 
  selectedCategory, 
  onSelectCategory 
}) {
  const filteredProducts = products
    .filter((p) => selectedCategory === 'All' || p.category === selectedCategory)
    .filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <main className="catalog">
      <header className="catalog-header">
        <h1>E-commerce App</h1>
        <p className="lead">Browse placeholder items and add them to your cart.</p>
      </header>

      <FilterBar
        categories={['All', 'Phones', 'Laptops', 'Accessories', 'Audio']}
        selected={selectedCategory}
        onSelect={onSelectCategory}
      />

      <section className="products">
        {filteredProducts.map((p) => (
          <ProductCard key={p.id} product={p} onAdd={onAddToCart} />
        ))}
      </section>
    </main>
  );
}