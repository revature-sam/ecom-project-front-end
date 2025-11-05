import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';
import './account.css';

function AddItemForm({ onItemAdded }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stockQuantity: '',
    category: '',
    imageUrl: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    // Clear success message when user starts editing
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Item name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.price || isNaN(formData.price) || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Please enter a valid price greater than 0';
    }

    if (!formData.stockQuantity || isNaN(formData.stockQuantity) || parseInt(formData.stockQuantity) < 0) {
      newErrors.stockQuantity = 'Please enter a valid stock quantity (0 or more)';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const itemData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        stockQuantity: parseInt(formData.stockQuantity),
        category: formData.category.trim(),
        imageUrl: formData.imageUrl.trim() || null
      };

      const createdItem = await apiService.createItem(itemData);
      
      setSuccessMessage('Item added successfully to the store!');
      setFormData({
        name: '',
        description: '',
        price: '',
        stockQuantity: '',
        category: '',
        imageUrl: ''
      });

      // Notify parent component if callback provided
      if (onItemAdded) {
        onItemAdded(createdItem);
      }

    } catch (error) {
      console.error('Failed to create item:', error);
      setErrors({ submit: error.message || 'Failed to create item. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="add-item-section">
      <h2>Add New Item to Store</h2>
      <div className="add-item-card">
        {successMessage && (
          <div className="success-message">
            ✅ {successMessage}
          </div>
        )}
        
        {errors.submit && (
          <div className="error-message">
            ❌ {errors.submit}
          </div>
        )}

        <form onSubmit={handleSubmit} className="add-item-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Item Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={errors.name ? 'error' : ''}
                placeholder="Enter item name"
              />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <input
                type="text"
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className={errors.category ? 'error' : ''}
                placeholder="e.g., electronics, clothing, books"
              />
              {errors.category && <span className="field-error">{errors.category}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className={errors.description ? 'error' : ''}
              placeholder="Describe the item..."
              rows="3"
            />
            {errors.description && <span className="field-error">{errors.description}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="price">Price ($) *</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                className={errors.price ? 'error' : ''}
                placeholder="0.00"
                step="0.01"
                min="0"
              />
              {errors.price && <span className="field-error">{errors.price}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="stockQuantity">Stock Quantity *</label>
              <input
                type="number"
                id="stockQuantity"
                name="stockQuantity"
                value={formData.stockQuantity}
                onChange={handleInputChange}
                className={errors.stockQuantity ? 'error' : ''}
                placeholder="0"
                min="0"
              />
              {errors.stockQuantity && <span className="field-error">{errors.stockQuantity}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="imageUrl">Image URL (optional)</label>
            <input
              type="url"
              id="imageUrl"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleInputChange}
              placeholder="https://example.com/image.jpg"
            />
            <small className="form-help">Leave empty to use default placeholder</small>
          </div>

          <button 
            type="submit" 
            className="submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Adding Item...' : 'Add Item to Store'}
          </button>
        </form>
      </div>
    </div>
  );
}

function WishlistItemCard({ item, onRemoveFromWishlist, onAddToCart }) {
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
    <div className="wishlist-item">
      <div className="wishlist-item-image">
        {!imageError ? (
          <img 
            src={item.image} 
            alt={item.name}
            onError={handleImageError}
          />
        ) : (
          <div className="wishlist-placeholder">
            <span className="wishlist-placeholder-icon">{getPlaceholderIcon(item.category)}</span>
            <span className="wishlist-placeholder-text">{item.category || 'Product'}</span>
          </div>
        )}
        <button 
          className="remove-wishlist-btn"
          onClick={() => onRemoveFromWishlist(item)}
          title="Remove from wishlist"
        >
          ✕
        </button>
      </div>
      <div className="wishlist-item-details">
        <h3 className="wishlist-item-name">{item.name}</h3>
        {item.description && (
          <p className="wishlist-item-description" title={item.description}>
            {item.description}
          </p>
        )}
        <p className="wishlist-item-stock">
          Stock: {item.stockQuantity || 0}
        </p>
        <div className="product-divider-wishlist"></div>
        <p className="wishlist-item-price">${item.price.toFixed(2)}</p>
        <button 
          className="add-to-cart-btn"
          onClick={() => onAddToCart(item)}
        >
          Add to cart
        </button>
      </div>
    </div>
  );
}

function MyItemsSection({ user, onRefreshProducts }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [userItems, setUserItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [itemsError, setItemsError] = useState(null);

  // Debug logging for user object
  console.log('🔍 MyItemsSection - user object:', user);
  console.log('🔍 MyItemsSection - user.id:', user?.id);
  console.log('🔍 MyItemsSection - user type:', typeof user?.id);

  // Fetch user's items when component mounts
  useEffect(() => {
    const fetchUserItems = async () => {
      try {
        setLoadingItems(true);
        setItemsError(null);
        
        console.log('🔄 Fetching items for user ID:', user.id);
        
        // Use the new endpoint to get user-specific items
        const userItems = await apiService.getUserItems(user.id);
        console.log('✅ Received user items:', userItems);
        setUserItems(userItems || []);
      } catch (error) {
        console.error('❌ Failed to load user items:', error);
        setItemsError(error.message);
        setUserItems([]);
      } finally {
        setLoadingItems(false);
      }
    };

    if (user && user.id) {
      fetchUserItems();
    } else {
      console.warn('⚠️ MyItemsSection - No user or user.id available');
      setLoadingItems(false);
    }
  }, [user]);

  const handleItemAdded = async (newItem) => {
    console.log('✅ New item added:', newItem);
    setShowAddForm(false);
    
    // Refresh the items list with user-specific items
    try {
      const userItems = await apiService.getUserItems(user.id);
      setUserItems(userItems || []);
      
      // Also refresh the main products list so the home page shows the new item
      if (onRefreshProducts) {
        await onRefreshProducts();
        console.log('🔄 Main products list refreshed');
      }
    } catch (error) {
      console.error('Failed to refresh items:', error);
    }
  };

  const handleAddItemClick = () => {
    setShowAddForm(true);
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
  };

  return (
    <div className="wishlist-section">
      <div className="my-items-header">
        <h2>My Store Items</h2>
        {!showAddForm && (
          <button className="add-item-btn" onClick={handleAddItemClick}>
            Add Item
          </button>
        )}
      </div>

      {showAddForm ? (
        <div className="add-item-form-container">
          <div className="add-item-form-header">
            <h3>Add New Item to Store</h3>
            <button className="cancel-btn" onClick={handleCancelAdd}>
              Cancel
            </button>
          </div>
          <AddItemForm onItemAdded={handleItemAdded} />
        </div>
      ) : (
        <div className="items-display">
          {loadingItems ? (
            <div className="loading-items">
              <p>Loading your items...</p>
            </div>
          ) : itemsError ? (
            <div className="items-error">
              <p>Error loading items: {itemsError}</p>
              <button className="retry-btn" onClick={() => window.location.reload()}>
                Retry
              </button>
            </div>
          ) : userItems && userItems.length > 0 ? (
            <div className="wishlist-grid">
              {userItems.map((item) => (
                <UserItemCard
                  key={item.id}
                  item={item}
                />
              ))}
            </div>
          ) : (
            <div className="no-wishlist">
              <div className="no-wishlist-content">
                <h3>No items created yet</h3>
                <p>Start by adding your first item to the store.</p>
                <button className="shop-btn" onClick={handleAddItemClick}>
                  Add Your First Item
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function UserItemCard({ item }) {
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
    <div className="wishlist-item">
      <div className="wishlist-item-image">
        {!imageError ? (
          <img 
            src={item.imageUrl || item.image} 
            alt={item.name}
            onError={handleImageError}
          />
        ) : (
          <div className="wishlist-placeholder">
            <span className="wishlist-placeholder-icon">{getPlaceholderIcon(item.category)}</span>
            <span className="wishlist-placeholder-text">{item.category || 'Product'}</span>
          </div>
        )}
      </div>
      <div className="wishlist-item-details">
        <h3 className="wishlist-item-name" title={item.name}>{item.name}</h3>
        {item.description && (
          <p className="wishlist-item-description" title={item.description}>
            {item.description}
          </p>
        )}
        <p className="wishlist-item-stock">
          Stock: {item.stockQuantity || 0}
        </p>
        <div className="product-divider-wishlist"></div>
        <p className="wishlist-item-price">${item.price?.toFixed(2)}</p>
      </div>
    </div>
  );
}

export default function Account({ user, onLogout, wishlist, onToggleWishlist, onAddToCart, onRefreshProducts }) {
  const navigate = useNavigate();
  const [orderHistory, setOrderHistory] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [orderError, setOrderError] = useState(null);

  // Debug logging to see what user object we received
  console.log('🔍 Account component user object:', user);
  console.log('🔍 User properties:', user ? Object.keys(user) : 'No user');

  // Fetch order history when component mounts or user changes
  useEffect(() => {
    const fetchOrderHistory = async () => {
      if (!user) {
        setLoadingOrders(false);
        return;
      }

      try {
        setLoadingOrders(true);
        setOrderError(null);
        console.log('🔄 Fetching order history for user:', user);
        
        const orders = await apiService.getOrderHistory(user.username || user.id);
        console.log('✅ Order history loaded:', orders);
        
        setOrderHistory(orders || []);
      } catch (error) {
        console.error('❌ Failed to load order history:', error);
        setOrderError(error.message);
        setOrderHistory([]);
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchOrderHistory();
  }, [user]);

  // Safety check for user object
  if (!user) {
    return (
      <div className="account-page">
        <div className="account-container">
          <div className="account-header">
            <button className="back-btn" onClick={() => navigate('/')}>
              ← Back to Shopping
            </button>
            <h1>My Account</h1>
          </div>
          <div className="account-content">
            <div className="info-card">
              <p>No user information available. Please log in again.</p>
              <button onClick={() => navigate('/login')}>Go to Login</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function handleLogout() {
    onLogout();
    navigate('/');
  }

  function handleAddToCart(product) {
    onAddToCart(product);
  }

  function handleRemoveFromWishlist(product) {
    onToggleWishlist(product);
  }

  return (
    <div className="account-page">
      <div className="account-container">
        <div className="account-header">
          <button className="back-btn" onClick={() => navigate('/')}>
            ← Back to Shopping
          </button>
          <h1>My Account</h1>
          <button className="logout-btn" onClick={handleLogout}>
            Sign Out
          </button>
        </div>

        <div className="account-content">
          <div className="left-column">
            <div className="account-info">
              <h2>Account Information</h2>
              <div className="info-card">
                <div className="info-item">
                  <label>Username</label>
                  <span>{user.username || user.email || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <label>Email</label>
                  <span>{user.email || 'Not provided'}</span>
                </div>
              </div>
            </div>

            <div className="wishlist-section">
              <h2>My Wishlist</h2>
              {wishlist && wishlist.length > 0 ? (
                <div className="wishlist-grid">
                  {wishlist.map((item) => (
                    <WishlistItemCard
                      key={item.id}
                      item={item}
                      onRemoveFromWishlist={handleRemoveFromWishlist}
                      onAddToCart={handleAddToCart}
                    />
                  ))}
                </div>
              ) : (
                <div className="no-wishlist">
                  <div className="no-wishlist-content">
                    <h3>Your wishlist is empty</h3>
                    <p>Start adding items to your wishlist by clicking the star icon on products.</p>
                    <button className="shop-btn" onClick={() => navigate('/')}>
                      Start Shopping
                    </button>
                  </div>
                </div>
              )}
            </div>

            <MyItemsSection user={user} onRefreshProducts={onRefreshProducts} />
          </div>

          <div className="right-column">
            <div className="order-history">
              <h2>Order History</h2>
              {loadingOrders ? (
                <div className="loading-orders">
                  <p>Loading order history...</p>
                </div>
              ) : orderError ? (
                <div className="order-error">
                  <p>Error loading orders: {orderError}</p>
                  <button 
                    className="retry-btn" 
                    onClick={() => window.location.reload()}
                  >
                    Retry
                  </button>
                </div>
              ) : orderHistory && orderHistory.length > 0 ? (
                <div className="orders-list">
                  {orderHistory.map((order) => (
                    <div key={order.id} className="order-card">
                      <div className="order-header">
                        <div className="order-info">
                          <h3>Order #{order.id}</h3>
                          <p className="order-date">
                            {new Date(order.date || order.createdAt || order.orderDate).toLocaleDateString()}
                          </p>
                          {order.fallback && (
                            <span className="fallback-indicator">📱 Local Order</span>
                          )}
                        </div>
                        <div className="order-total">
                          <span className="total-amount">
                            ${(order.total || order.totalAmount || 0).toFixed(2)}
                          </span>
                          <span className="order-status">{order.status || 'Completed'}</span>
                        </div>
                      </div>
                      <div className="order-items">
                        {(order.items || order.orderItems || []).map((item, index) => (
                          <div key={index} className="order-item">
                            <img 
                              src={item.image || item.itemImage || '/placeholder-image.jpg'} 
                              alt={item.name || item.itemName} 
                              className="item-image"
                              onError={(e) => {
                                e.target.src = '/placeholder-image.jpg';
                              }}
                            />
                            <div className="item-details">
                              <span className="item-name">{item.name || item.itemName || 'Unknown Item'}</span>
                              <span className="item-quantity">
                                Qty: {item.quantity || item.qty || 1}
                              </span>
                            </div>
                            <span className="item-price">
                              ${((item.price || item.itemPrice || 0) * (item.quantity || item.qty || 1)).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-orders">
                  <div className="no-orders-content">
                    <h3>No orders yet</h3>
                    <p>When you place your first order, it will appear here.</p>
                    <button className="shop-btn" onClick={() => navigate('/')}>
                      Start Shopping
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}