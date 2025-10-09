import React, { useState } from 'react';
import './App.css';
import ProductCard from './components/ProductCard';
import Cart from './components/Cart';
import Navbar from './components/Navbar';

const sampleProducts = [
  { id: 'p1', name: 'Blue Sneakers', price: 59.99, image: 'https://via.placeholder.com/400x300?text=Sneakers' },
  { id: 'p2', name: 'Classic Watch', price: 129.99, image: 'https://via.placeholder.com/400x300?text=Watch' },
  { id: 'p3', name: 'Leather Jacket', price: 199.0, image: 'https://via.placeholder.com/400x300?text=Jacket' },
  { id: 'p4', name: 'Sunglasses', price: 39.5, image: 'https://via.placeholder.com/400x300?text=Sunglasses' },
];

function App() {
  const [cart, setCart] = useState([]);
  const [query, setQuery] = useState('');

  function handleAdd(product) {
    setCart((cur) => {
      const exists = cur.find((c) => c.id === product.id);
      if (exists) {
        return cur.map((c) => c.id === product.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...cur, { ...product, quantity: 1 }];
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
      <Navbar query={query} onChange={setQuery} cartCount={cart.reduce((s, c) => s + c.quantity, 0)} />
      <div className="app-grid">
      <main className="catalog">
        <header className="catalog-header">
          <h1>E-commerce App</h1>
          <p className="lead">Browse placeholder items and add them to your cart.</p>
        </header>

        <section className="products">
          {sampleProducts
            .filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()))
            .map((p) => (
              <ProductCard key={p.id} product={p} onAdd={handleAdd} />
            ))}
        </section>
      </main>

      <Cart items={cart} onRemove={handleRemove} onChangeQuantity={handleChangeQuantity} />
      </div>
    </div>
  );
}

export default App;
