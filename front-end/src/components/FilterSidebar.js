import React from 'react';
import './filterSidebar.css';

export default function FilterSidebar({ 
  categories, 
  selectedCategory, 
  onSelectCategory,
  priceRange,
  onPriceRangeChange,
  sortBy,
  onSortChange
}) {
  const handleMinPriceChange = (e) => {
    const newMin = parseFloat(e.target.value) || 0;
    onPriceRangeChange([newMin, priceRange[1]]);
  };

  const handleMaxPriceChange = (e) => {
    const newMax = parseFloat(e.target.value) || 9999;
    onPriceRangeChange([priceRange[0], newMax]);
  };

  const handleSliderChange = (e) => {
    const value = parseFloat(e.target.value);
    onPriceRangeChange([priceRange[0], value]);
  };

  const resetFilters = () => {
    onSelectCategory('All');
    onPriceRangeChange([0, 1500]);
    onSortChange('name');
  };

  return (
    <aside className="filter-sidebar">
      <div className="filter-header">
        <h3>Filters</h3>
        <button className="reset-btn" onClick={resetFilters}>
          Reset All
        </button>
      </div>

      {/* Category Filter */}
      <div className="filter-section">
        <h4>Category</h4>
        <div className="category-buttons">
          {categories.map((category) => (
            <button
              key={category}
              className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => onSelectCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range Filter */}
      <div className="filter-section">
        <h4>Price Range</h4>
        <div className="price-slider-container">
          <input
            type="range"
            min="0"
            max="1500"
            step="25"
            value={priceRange[1]}
            onChange={handleSliderChange}
            className="price-slider"
          />
          <div className="price-range-display">
            ${priceRange[0]} - ${priceRange[1] >= 1500 ? '1500+' : priceRange[1]}
          </div>
        </div>
        <div className="price-inputs">
          <div className="price-input-group">
            <label>Min Price</label>
            <input
              type="number"
              min="0"
              step="10"
              value={priceRange[0]}
              onChange={handleMinPriceChange}
              placeholder="0"
            />
          </div>
          <div className="price-input-group">
            <label>Max Price</label>
            <input
              type="number"
              min="0"
              step="10"
              value={priceRange[1] >= 1500 ? '' : priceRange[1]}
              onChange={handleMaxPriceChange}
              placeholder="1500+"
            />
          </div>
        </div>
      </div>

      {/* Sort Options */}
      <div className="filter-section">
        <h4>Sort By</h4>
        <select 
          className="sort-select" 
          value={sortBy} 
          onChange={(e) => onSortChange(e.target.value)}
        >
          <option value="name">Name (A-Z)</option>
          <option value="name-desc">Name (Z-A)</option>
          <option value="price-low">Price (Low to High)</option>
          <option value="price-high">Price (High to Low)</option>
        </select>
      </div>
    </aside>
  );
}