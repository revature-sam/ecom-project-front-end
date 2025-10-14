import React from 'react';
import './filterBar.css';

export default function FilterBar({ categories, selected, onSelect }) {
  return (
    <div className="filter-bar">
      {categories.map((c) => (
        <button
          key={c}
          className={`filter-btn ${selected === c ? 'active' : ''}`}
          onClick={() => onSelect(c)}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
