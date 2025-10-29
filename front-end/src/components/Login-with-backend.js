// EXAMPLE: How Login.js would change for backend integration
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './login.css';
import apiService from '../services/apiService';

function Login({ onLogin }) {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  function handleInputChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear specific error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }

  function validateForm() {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!isLogin) {
      if (!formData.name) {
        newErrors.name = 'Name is required';
      }
      
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }
    
    return newErrors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    
    try {
      let userData;
      
      if (isLogin) {
        // Login via API
        userData = await apiService.login(formData.email, formData.password);
      } else {
        // Register via API
        userData = await apiService.register({
          name: formData.name,
          email: formData.email,
          password: formData.password
        });
      }
      
      // Call parent's login handler
      onLogin(userData);
      
      // Navigate to account page
      navigate('/account');
      
    } catch (error) {
      console.error('Authentication failed:', error);
      
      // Handle different types of API errors
      if (error.message.includes('Invalid credentials')) {
        setErrors({ email: 'Invalid email or password' });
      } else if (error.message.includes('Email already exists')) {
        setErrors({ email: 'An account with this email already exists' });
      } else if (error.message.includes('Network')) {
        setErrors({ general: 'Network error. Please check your connection.' });
      } else {
        setErrors({ general: error.message || 'An error occurred. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  }

  function fillDemoAccount() {
    setFormData(prev => ({
      ...prev,
      email: 'demo@example.com',
      password: 'demo123'
    }));
    setIsLogin(true);
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>{isLogin ? 'Login' : 'Create Account'}</h2>
        
        <form onSubmit={handleSubmit} className="login-form">
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={isLoading}
              />
              {errors.name && <span className="error">{errors.name}</span>}
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={isLoading}
            />
            {errors.email && <span className="error">{errors.email}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              disabled={isLoading}
            />
            {errors.password && <span className="error">{errors.password}</span>}
          </div>
          
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                disabled={isLoading}
              />
              {errors.confirmPassword && <span className="error">{errors.confirmPassword}</span>}
            </div>
          )}
          
          {errors.general && (
            <div className="error general-error">{errors.general}</div>
          )}
          
          <button 
            type="submit" 
            className="submit-button"
            disabled={isLoading}
          >
            {isLoading ? 'Please wait...' : (isLogin ? 'Login' : 'Create Account')}
          </button>
        </form>
        
        <div className="form-footer">
          <p>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              type="button" 
              className="link-button"
              onClick={() => {
                setIsLogin(!isLogin);
                setFormData({
                  email: '',
                  password: '',
                  confirmPassword: '',
                  name: ''
                });
                setErrors({});
              }}
              disabled={isLoading}
            >
              {isLogin ? 'Create one' : 'Login here'}
            </button>
          </p>
          
          {isLogin && (
            <p>
              <button 
                type="button" 
                className="demo-button"
                onClick={fillDemoAccount}
                disabled={isLoading}
              >
                Use Demo Account
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;