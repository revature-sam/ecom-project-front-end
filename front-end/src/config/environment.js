// Environment configuration utility
class EnvironmentConfig {
  constructor() {
    this.environment = process.env.REACT_APP_ENVIRONMENT || 'development';
    this.apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';
    this.wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8080/ws';
    this.isDebugEnabled = process.env.REACT_APP_DEBUG === 'true';
  }

  // API Configuration
  getApiBaseUrl() {
    return this.apiBaseUrl;
  }

  getWebSocketUrl() {
    return this.wsUrl;
  }

  // Environment checks
  isDevelopment() {
    return this.environment === 'development';
  }

  isProduction() {
    return this.environment === 'production';
  }

  isTest() {
    return this.environment === 'test';
  }

  // Debug configuration
  isDebugMode() {
    return this.isDebugEnabled && this.isDevelopment();
  }

  // Logging utility
  log(message, ...args) {
    if (this.isDebugMode()) {
      console.log(`[${this.environment.toUpperCase()}]`, message, ...args);
    }
  }

  warn(message, ...args) {
    if (this.isDebugMode()) {
      console.warn(`[${this.environment.toUpperCase()}]`, message, ...args);
    }
  }

  error(message, ...args) {
    console.error(`[${this.environment.toUpperCase()}]`, message, ...args);
  }

  // Configuration validation
  validateConfig() {
    const requiredVars = ['REACT_APP_API_BASE_URL'];
    const missing = [];

    requiredVars.forEach(varName => {
      if (!process.env[varName]) {
        missing.push(varName);
      }
    });

    if (missing.length > 0) {
      this.error('Missing required environment variables:', missing);
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    this.log('Environment configuration validated successfully');
  }

  // Get all configuration as object
  getConfig() {
    return {
      environment: this.environment,
      apiBaseUrl: this.apiBaseUrl,
      wsUrl: this.wsUrl,
      isDebugEnabled: this.isDebugEnabled,
      isDevelopment: this.isDevelopment(),
      isProduction: this.isProduction(),
      isTest: this.isTest()
    };
  }
}

const environmentConfig = new EnvironmentConfig();
export default environmentConfig;