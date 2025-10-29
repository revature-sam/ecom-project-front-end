import React from 'react';
import { useNavigate } from 'react-router-dom';
import './account.css';

export default function Account({ user, onLogout }) {
  const navigate = useNavigate();

  function handleLogout() {
    onLogout();
    navigate('/');
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
          <div className="account-info">
            <h2>Account Information</h2>
            <div className="info-card">
              <div className="info-item">
                <label>Name</label>
                <span>{user.firstName} {user.lastName}</span>
              </div>
              <div className="info-item">
                <label>Email</label>
                <span>{user.email}</span>
              </div>
              <div className="info-item">
                <label>Member Since</label>
                <span>{new Date(user.id).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="order-history">
            <h2>Order History</h2>
            {user.orders && user.orders.length > 0 ? (
              <div className="orders-list">
                {user.orders.map((order) => (
                  <div key={order.id} className="order-card">
                    <div className="order-header">
                      <div className="order-info">
                        <h3>Order #{order.id}</h3>
                        <p className="order-date">{new Date(order.date).toLocaleDateString()}</p>
                      </div>
                      <div className="order-total">
                        <span className="total-amount">${order.total.toFixed(2)}</span>
                        <span className="order-status">{order.status}</span>
                      </div>
                    </div>
                    <div className="order-items">
                      {order.items.map((item, index) => (
                        <div key={index} className="order-item">
                          <img src={item.image} alt={item.name} className="item-image" />
                          <div className="item-details">
                            <span className="item-name">{item.name}</span>
                            <span className="item-quantity">Qty: {item.quantity}</span>
                          </div>
                          <span className="item-price">${(item.price * item.quantity).toFixed(2)}</span>
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
  );
}