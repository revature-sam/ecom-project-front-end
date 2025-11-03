import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './login.css';
import apiService from '../services/apiService';

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  function handleInputChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }

  function validateForm() {
    const newErrors = {};

    if (!formData.username) {
      newErrors.username = 'Username is required';
    }

    if (isRegister && !formData.email) {
      newErrors.email = 'Email is required';
    } else if (isRegister && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (isRegister) {
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      // Try backend authentication first
      let userData;
      
      if (isRegister) {
        try {
          // Spring backend expects username, password, email
          userData = await apiService.register(formData.username, formData.password, formData.email);
          
          if (userData) {
            onLogin(userData);
            navigate('/');
          }
        } catch (apiError) {
          console.warn('Backend registration failed, using localStorage fallback:', apiError);
          
          // Handle specific API errors
          if (apiError.message.includes('already exists')) {
            setErrors({ username: 'User with this username already exists' });
            setIsLoading(false);
            return;
          }
          
          // Fallback to localStorage registration
          await handleLocalStorageRegistration();
        }
      } else {
        try {
          // Spring backend uses username/password login
          userData = await apiService.login(formData.username, formData.password);
          
          if (userData) {
            onLogin(userData);
            navigate('/');
          } else {
            setErrors({ username: 'Invalid username or password' });
          }
        } catch (apiError) {
          console.warn('Backend login failed, using localStorage fallback:', apiError);
          
          // Handle specific API errors
          if (apiError.message.includes('Invalid') || apiError.message.includes('credentials')) {
            setErrors({ username: 'Invalid username or password' });
            setIsLoading(false);
            return;
          }
          
          // Fallback to localStorage login
          await handleLocalStorageLogin();
        }
      }
    } catch (error) {
      console.error('Login/Registration error:', error);
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLocalStorageRegistration() {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const mockUsers = JSON.parse(localStorage.getItem('mockUsers') || '[]');
    
    // Check if user already exists
    const existingUser = mockUsers.find(user => 
      user.username === formData.username || user.email === formData.email
    );
    if (existingUser) {
      setErrors({ username: 'User with this username or email already exists' });
      return;
    }

    // Register new user - match Spring backend User model
    const newUser = {
      id: Date.now(),
      username: formData.username,
      email: formData.email,
      password: formData.password, // In real app, this would be hashed
      orders: []
    };

    const updatedUsers = [...mockUsers, newUser];
    localStorage.setItem('mockUsers', JSON.stringify(updatedUsers));
    
    // Auto-login after registration
    const userForSession = { ...newUser };
    delete userForSession.password; // Don't store password in session
    onLogin(userForSession);
    
    navigate('/');
  }

  async function handleLocalStorageLogin() {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const mockUsers = JSON.parse(localStorage.getItem('mockUsers') || '[]');
    
    // Login existing user - match Spring backend login pattern
    const user = mockUsers.find(u => 
      u.username === formData.username && u.password === formData.password
    );
    if (user) {
      const userForSession = { ...user };
      delete userForSession.password; // Don't store password in session
      onLogin(userForSession);
      navigate('/');
    } else {
      setErrors({ username: 'Invalid username or password' });
    }
  }

  function toggleMode() {
    setIsRegister(!isRegister);
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
    setErrors({});
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <button className="back-btn" onClick={() => navigate('/')}>
            ← Back to Shopping
          </button>
        </div>
        <div className="login-card">
          <h1>{isRegister ? 'Create Account' : 'Sign In'}</h1>
          
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className={errors.username ? 'error' : ''}
                placeholder="Enter your username"
              />
              {errors.username && <span className="error-text">{errors.username}</span>}
            </div>

            {isRegister && (
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={errors.email ? 'error' : ''}
                  placeholder="Enter your email"
                />
                {errors.email && <span className="error-text">{errors.email}</span>}
              </div>
            )}

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={errors.password ? 'error' : ''}
                placeholder="Enter your password"
              />
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>

            {isRegister && (
              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={errors.confirmPassword ? 'error' : ''}
                />
                {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
              </div>
            )}

            {errors.general && (
              <div className="form-group">
                <span className="error-text">{errors.general}</span>
              </div>
            )}

            <button type="submit" className="submit-btn" disabled={isLoading}>
              {isLoading ? 'Please wait...' : (isRegister ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          <div className="toggle-mode">
            <p>
              {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button type="button" onClick={toggleMode} className="link-btn">
                {isRegister ? 'Sign In' : 'Create Account'}
              </button>
            </p>
          </div>

          <div className="demo-info">
            <h3>Demo Account</h3>
            <p>Email: demo@example.com</p>
            <p>Password: demo123</p>
          </div>
        </div>
      </div>
    </div>
  );
}