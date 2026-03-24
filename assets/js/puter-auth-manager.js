// Puter Auth Manager
// Handles authentication with Puter services

class PuterAuthManager {
  constructor() {
    this.authenticated = false;
    this.user = null;
    this.token = null;
    this.callbacks = [];
    this.vitePort = this.detectVitePort();
  }

  // Detect current Vite development port (8000, 3000, etc.)
  detectVitePort() {
    const hostname = window.location.hostname;
    const port = window.location.port;

    // If running on localhost with a port, that's likely Vite
    if (hostname === 'localhost' && port) {
      console.log(`[PuterAuth] Detected Vite running on port ${port}`);
      return port;
    }

    // Fallback detection based on common Vite ports
    if (hostname === 'localhost') {
      // Check if we're on common Vite ports
      const commonVitePorts = ['8000', '3000', '5173', '4173'];
      if (commonVitePorts.includes(port)) {
        console.log(`[PuterAuth] Confirmed Vite port: ${port}`);
        return port;
      }
    }

    console.log('[PuterAuth] Could not detect Vite port, using current location');
    return port || '8000'; // Default fallback
  }

  async initialize() {
    console.log('[PuterAuth] Initializing Puter authentication manager');
    console.log(`[PuterAuth] Detected Vite running on port: ${this.vitePort}`);

    // Store Vite port info globally for other systems
    if (typeof window !== 'undefined') {
      window.__MP__ = window.__MP__ || {};
      window.__MP__.VITE_PORT = this.vitePort;
    }

    // Check if Puter is available
    if (typeof Puter !== 'undefined') {
      this.setupPuterListeners();
    } else {
      console.warn('[PuterAuth] Puter not available, will retry when loaded');
      // Set up a listener for when Puter loads
      window.addEventListener('puter-ready', () => {
        this.setupPuterListeners();
      });
    }
  }

  setupPuterListeners() {
    console.log('[PuterAuth] Setting up Puter event listeners');
    
    // Listen for authentication state changes
    if (Puter && Puter.auth) {
      Puter.auth.onAuthStateChange((state) => {
        this.handleAuthStateChange(state);
      });
    }
  }

  handleAuthStateChange(state) {
    this.authenticated = state.authenticated;
    this.user = state.user;
    this.token = state.token;
    
    if (this.authenticated) {
      console.log('[PuterAuth] User authenticated:', this.user);
      this.notifyCallbacks(true, this.user);
    } else {
      console.log('[PuterAuth] User not authenticated');
      this.notifyCallbacks(false, null);
    }
  }

  onAuthStateChange(callback) {
    this.callbacks.push(callback);
    
    // Immediately call with current state if available
    if (this.authenticated !== null) {
      callback(this.authenticated, this.user);
    }
  }

  notifyCallbacks(authenticated, user) {
    this.callbacks.forEach(callback => {
      try {
        callback(authenticated, user);
      } catch (error) {
        console.error('[PuterAuth] Error in auth callback:', error);
      }
    });
  }

  async login() {
    if (!Puter || !Puter.auth) {
      console.error('[PuterAuth] Puter auth not available');
      return false;
    }
    
    try {
      const result = await Puter.auth.login();
      console.log('[PuterAuth] Login result:', result);
      return result.success;
    } catch (error) {
      console.error('[PuterAuth] Login failed:', error);
      return false;
    }
  }

  async logout() {
    if (!Puter || !Puter.auth) {
      console.error('[PuterAuth] Puter auth not available');
      return false;
    }
    
    try {
      const result = await Puter.auth.logout();
      console.log('[PuterAuth] Logout result:', result);
      return result.success;
    } catch (error) {
      console.error('[PuterAuth] Logout failed:', error);
      return false;
    }
  }

  getCurrentUser() {
    return this.user;
  }

  isAuthenticated() {
    return this.authenticated;
  }

  getAuthToken() {
    return this.token;
  }
}

// Create global instance
if (typeof window !== 'undefined') {
  window.PuterAuthManager = PuterAuthManager;
  window.puterAuthManager = new PuterAuthManager();
  
  // Initialize when script loads
  window.puterAuthManager.initialize();
  
  console.log('[PuterAuth] PuterAuthManager initialized and ready');
}