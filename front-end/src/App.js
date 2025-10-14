import React, { useState } from 'react';
import './App.css';
import ProductCard from './components/ProductCard';
import Cart from './components/Cart';
import Navbar from './components/Navbar';
import FilterBar from './components/FilterBar';

const sampleProducts = [
  { id: 't1', name: 'Aurora Smartphone', category: 'Phones', price: 799.99, image: 'https://via.placeholder.com/400x300?text=Aurora+Phone' },
  { id: 't2', name: 'Nebula Laptop Pro', category: 'Laptops', price: 1299.0, image: 'https://via.placeholder.com/400x300?text=Nebula+Laptop' },
  { id: 't3', name: 'Quantum Earbuds', category: 'Audio', price: 149.99, image: 'https://via.placeholder.com/400x300?text=Quantum+Earbuds' },
  { id: 't4', name: 'Photon Charger', category: 'Accessories', price: 29.99, image: 'https://via.placeholder.com/400x300?text=Photon+Charger' },
  { id: 't5', name: 'Horizon Tablet', category: 'Laptops', price: 599.99, image: 'https://via.placeholder.com/400x300?text=Horizon+Tablet' },
  { id: 't6', name: 'Voyager Smartwatch', category: 'Accessories', price: 199.0, image: 'https://via.placeholder.com/400x300?text=Voyager+Watch' },
  { id: 't7', name: 'Echo Studio Speaker', category: 'Audio', price: 249.5, image: 'https://via.placeholder.com/400x300?text=Echo+Speaker' },
  { id: 't8', name: 'Pulse Gaming Phone', category: 'Phones', price: 999.99, image: 'https://via.placeholder.com/400x300?text=Pulse+Phone' },
  { id: 't9', name: 'Atlas Mechanical Keyboard', category: 'Accessories', price: 119.99, image: 'https://via.placeholder.com/400x300?text=Atlas+Keyboard' },
  { id: 't10', name: 'Nimbus Ultrabook', category: 'Laptops', price: 1499.99, image: 'https://via.placeholder.com/400x300?text=Nimbus+Ultrabook' },
];

function App() {
  const [cart, setCart] = useState([]);
  const [query, setQuery] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [bump, setBump] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');

  function handleAdd(product) {
    setCart((cur) => {
      const prevCount = cur.reduce((s, c) => s + c.quantity, 0);
      const exists = cur.find((c) => c.id === product.id);
      let next;
      if (exists) {
        next = cur.map((c) => c.id === product.id ? { ...c, quantity: c.quantity + 1 } : c);
      } else {
        next = [...cur, { ...product, quantity: 1 }];
      }

      const nextCount = next.reduce((s, c) => s + c.quantity, 0);
      if (nextCount > prevCount) {
        setBump(true);
        window.setTimeout(() => setBump(false), 380);
      }

      return next;
    });
  }

  function handleRemove(productId) {
    setCart((cur) => cur.filter((c) => c.id !== productId));
  }

  function handleChangeQuantity(productId, newQuantity) {
    setCart((cur) => {
      if (newQuantity <= 0) return cur.filter((c) => c.id !== productId);
      return cur.map((c) => c.id === productId ? { ...c, quantity: newQuantity } : c);
    });
  }

  return (
    <div className="App">
      <Navbar
        query={query}
        onChange={setQuery}
        cartCount={cart.reduce((s, c) => s + c.quantity, 0)}
        onToggle={() => setCartOpen((v) => !v)}
        bump={bump}
      />
      <div className="app-grid">
      <main className="catalog">
        <header className="catalog-header">
          <h1>E-commerce App</h1>
          <p className="lead">Browse placeholder items and add them to your cart.</p>
        </header>

        <FilterBar
          categories={[ 'All', 'Phones', 'Laptops', 'Accessories', 'Audio' ]}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />

        <section className="products">
          {sampleProducts
            .filter((p) => selectedCategory === 'All' || p.category === selectedCategory)
            .filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()))
            .map((p) => (
              <ProductCard key={p.id} product={p} onAdd={handleAdd} />
            ))}
        </section>
      </main>

      <Cart items={cart} onRemove={handleRemove} onChangeQuantity={handleChangeQuantity} className={cartOpen ? 'open' : ''} />
      <div className={`overlay ${cartOpen ? 'open' : ''}`} onClick={() => setCartOpen(false)} />
      </div>
    </div>
  );
}

export default App;
