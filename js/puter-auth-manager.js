/**
 * Puter Authentication Manager
 * Comprehensive authentication system for Puter.com integration
 * Provides sign-in/sign-out flow, session persistence, and error handling
 */

class PuterAuthManager {
  constructor() {
    this.isAuthenticated = false;
    this.currentUser = null;
    this.authToken = null;
    this.sessionExpiry = null;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.retryDelay = 1000; // Start with 1 second
    this.listeners = [];
    this.checkInterval = null;
    
    // Session storage keys
    this.storageKeys = {
      USER: 'puter_auth_user',
      TOKEN: 'puter_auth_token',
      EXPIRY: 'puter_auth_expiry',
      LAST_CHECK: 'puter_auth_last_check'
    };

    console.log('[PuterAuth] Initializing authentication manager...');
    this.initialize();
  }

  /**
   * Initialize the authentication manager
   */
  async initialize() {
    try {
      // Check if Puter SDK is available
      if (!window.puter) {
        console.warn('[PuterAuth] Puter SDK not found - running in demo mode');
        this.emit('sdkUnavailable');
        return;
      }

      // Try to restore existing session
      await this.restoreSession();

      // Set up automatic session check
      this.startSessionMonitoring();

      console.log('[PuterAuth] Authentication manager initialized');
    } catch (error) {
      console.error('[PuterAuth] Initialization failed:', error);
      this.emit('initError', error);
    }
  }

  /**
   * Check authentication status
   */
  async checkAuthStatus() {
    try {
      if (!window.puter || !window.puter.auth) {
        throw new Error('Puter SDK not available');
      }

      console.log('[PuterAuth] Checking authentication status...');
      const user = await window.puter.auth.getUser();
      
      if (user && (user.username || user.email)) {
        this.isAuthenticated = true;
        this.currentUser = user;
        this.authToken = user.token || null;
        this.updateSessionExpiry();
        
        console.log('[PuterAuth] ✅ User authenticated:', user.username || user.email);
        this.emit('authSuccess', user);
        this.retryCount = 0; // Reset retry count on success
        
        return { authenticated: true, user };
      } else {
        throw new Error('No valid user data received');
      }
    } catch (error) {
      console.log('[PuterAuth] ❌ Authentication check failed:', error.message);
      this.isAuthenticated = false;
      this.currentUser = null;
      this.authToken = null;
      
      this.emit('authFailed', error);
      
      return { authenticated: false, error };
    }
  }

  /**
   * Sign in to Puter
   */
  async signIn() {
    try {
      console.log('[PuterAuth] Initiating sign-in process...');
      this.emit('signInStart');

      if (!window.puter || !window.puter.auth) {
        throw new Error('Puter SDK not available');
      }

      // Trigger Puter sign-in
      await window.puter.auth.signIn();
      
      // Wait a moment for the sign-in to process
      await this.delay(1000);
      
      // Check if sign-in was successful
      const result = await this.checkAuthStatus();
      
      if (result.authenticated) {
        this.saveSession();
        console.log('[PuterAuth] ✅ Sign-in successful');
        this.emit('signInSuccess', result.user);
        return result;
      } else {
        throw new Error('Sign-in did not result in authenticated state');
      }
    } catch (error) {
      console.error('[PuterAuth] Sign-in failed:', error);
      this.emit('signInError', error);
      
      // Implement retry logic for temporary failures
      if (this.retryCount < this.maxRetries && this.isNetworkError(error)) {
        this.retryCount++;
        const delay = this.retryDelay * Math.pow(2, this.retryCount - 1); // Exponential backoff
        console.log(`[PuterAuth] Retrying sign-in in ${delay}ms (attempt ${this.retryCount})`);
        
        await this.delay(delay);
        return this.signIn();
      }
      
      throw error;
    }
  }

  /**
   * Sign out from Puter
   */
  async signOut() {
    try {
      console.log('[PuterAuth] Initiating sign-out process...');
      this.emit('signOutStart');

      if (window.puter && window.puter.auth) {
        await window.puter.auth.signOut();
      }

      // Clear local session data
      this.clearSession();
      this.isAuthenticated = false;
      this.currentUser = null;
      this.authToken = null;
      
      console.log('[PuterAuth] ✅ Sign-out successful');
      this.emit('signOutSuccess');
      
      return { success: true };
    } catch (error) {
      console.error('[PuterAuth] Sign-out failed:', error);
      this.emit('signOutError', error);
      
      // Even if sign-out fails, clear local session
      this.clearSession();
      this.isAuthenticated = false;
      this.currentUser = null;
      this.authToken = null;
      
      return { success: false, error };
    }
  }

  /**
   * Make authenticated API call to Puter
   */
  async makeAuthenticatedCall(apiCall) {
    try {
      // Check if we need to refresh authentication
      if (!this.isAuthenticated || this.isSessionExpired()) {
        console.log('[PuterAuth] Session expired, attempting re-authentication...');
        const result = await this.checkAuthStatus();
        
        if (!result.authenticated) {
          throw new Error('Authentication required');
        }
      }

      // Make the API call
      const result = await apiCall();
      
      // Reset retry count on successful call
      this.retryCount = 0;
      
      return result;
    } catch (error) {
      console.error('[PuterAuth] API call failed:', error);
      
      // Handle 401 errors by attempting re-authentication
      if (error.status === 401 || error.message.includes('401')) {
        console.log('[PuterAuth] 401 error detected, attempting re-authentication...');
        
        try {
          const result = await this.checkAuthStatus();
          if (result.authenticated) {
            // Retry the original call
            return await apiCall();
          }
        } catch (reAuthError) {
          console.error('[PuterAuth] Re-authentication failed:', reAuthError);
        }
      }
      
      throw error;
    }
  }

  /**
   * Get current authentication status
   */
  getAuthStatus() {
    return {
      isAuthenticated: this.isAuthenticated,
      currentUser: this.currentUser,
      isSessionExpired: this.isSessionExpired(),
      lastCheck: localStorage.getItem(this.storageKeys.LAST_CHECK)
    };
  }

  /**
   * Save session to localStorage
   */
  saveSession() {
    try {
      if (this.currentUser) {
        localStorage.setItem(this.storageKeys.USER, JSON.stringify(this.currentUser));
      }
      if (this.authToken) {
        localStorage.setItem(this.storageKeys.TOKEN, this.authToken);
      }
      if (this.sessionExpiry) {
        localStorage.setItem(this.storageKeys.EXPIRY, this.sessionExpiry.toISOString());
      }
      localStorage.setItem(this.storageKeys.LAST_CHECK, new Date().toISOString());
      
      console.log('[PuterAuth] Session saved to localStorage');
    } catch (error) {
      console.error('[PuterAuth] Failed to save session:', error);
    }
  }

  /**
   * Restore session from localStorage
   */
  async restoreSession() {
    try {
      const savedUser = localStorage.getItem(this.storageKeys.USER);
      const savedToken = localStorage.getItem(this.storageKeys.TOKEN);
      const savedExpiry = localStorage.getItem(this.storageKeys.EXPIRY);
      
      if (savedUser && savedToken && savedExpiry) {
        const user = JSON.parse(savedUser);
        const expiry = new Date(savedExpiry);
        
        if (!this.isSessionExpired(expiry)) {
          this.currentUser = user;
          this.authToken = savedToken;
          this.sessionExpiry = expiry;
          
          console.log('[PuterAuth] Session restored from localStorage');
          
          // Verify the restored session is still valid
          const result = await this.checkAuthStatus();
          if (!result.authenticated) {
            console.log('[PuterAuth] Restored session invalid, clearing...');
            this.clearSession();
          }
        } else {
          console.log('[PuterAuth] Saved session expired, clearing...');
          this.clearSession();
        }
      }
    } catch (error) {
      console.error('[PuterAuth] Failed to restore session:', error);
      this.clearSession();
    }
  }

  /**
   * Clear stored session
   */
  clearSession() {
    try {
      Object.values(this.storageKeys).forEach(key => {
        localStorage.removeItem(key);
      });
      console.log('[PuterAuth] Session cleared from localStorage');
    } catch (error) {
      console.error('[PuterAuth] Failed to clear session:', error);
    }
  }

  /**
   * Check if session is expired
   */
  isSessionExpiry(expiry = this.sessionExpiry) {
    if (!expiry) return true;
    return new Date() >= expiry;
  }

  /**
   * Update session expiry (typically 1 hour from now)
   */
  updateSessionExpiry() {
    this.sessionExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    this.saveSession();
  }

  /**
   * Start monitoring session health
   */
  startSessionMonitoring() {
    // Check authentication status every 5 minutes
    this.checkInterval = setInterval(async () => {
      if (this.isAuthenticated) {
        try {
          await this.checkAuthStatus();
        } catch (error) {
          console.log('[PuterAuth] Session monitoring check failed:', error.message);
        }
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Stop session monitoring
   */
  stopSessionMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Add event listener
   */
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  /**
   * Remove event listener
   */
  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  /**
   * Emit event to listeners
   */
  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[PuterAuth] Event listener error for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Check if error is network-related
   */
  isNetworkError(error) {
    return error.name === 'NetworkError' || 
           error.message.includes('network') ||
           error.message.includes('fetch') ||
           error.code === 'NETWORK_ERROR';
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.stopSessionMonitoring();
    this.listeners = {};
    console.log('[PuterAuth] Authentication manager destroyed');
  }
}

// Create global instance
window.PuterAuth = new PuterAuthManager();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PuterAuthManager;
}

console.log('[PuterAuth] Manager loaded successfully');