import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';
import './account.css';

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

export default function Account({ user, onLogout, wishlist, onToggleWishlist, onAddToCart }) {
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
                <div className="info-item">
                  <label>Member Since</label>
                  <span>
                    {user.createdAt 
                      ? new Date(user.createdAt).toLocaleDateString()
                      : user.id
                      ? new Date(user.id).toLocaleDateString()
                      : 'Unknown'
                    }
                  </span>
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