/**
 * API Configuration Manager
 * Centralizes API endpoint configuration and environment detection
 */

const API_CONFIG = {
  development: {
    baseUrl: '',
    timeout: 5000,
    retries: 2
  },
  staging: {
    baseUrl: 'https://staging-matchpoint-api.com',
    timeout: 8000,
    retries: 3
  },
  production: {
    baseUrl: 'https://api.matchpoint.com',
    timeout: 10000,
    retries: 3
  }
};

export function getApiConfig() {
  // Check for explicit runtime config first
  if (window.__MP__?.API) {
    return {
      baseUrl: window.__MP__.API,
      timeout: window.__MP__.TIMEOUT || 5000,
      retries: window.__MP__.RETRIES || 2
    };
  }

  // Detect environment
  const isDev = location.hostname === 'localhost' && location.port === '3000';
  const isStaging = location.hostname.includes('staging') || location.hostname.includes('test');

  if (isDev) {
    return API_CONFIG.development;
  } else if (isStaging) {
    return API_CONFIG.staging;
  } else {
    return API_CONFIG.production;
  }
}

export function buildApiUrl(endpoint) {
  const config = getApiConfig();
  const baseUrl = config.baseUrl;

  // Remove leading slash from endpoint if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

  if (baseUrl) {
    return `${baseUrl}/${cleanEndpoint}`;
  } else {
    // Development mode - use proxy
    return `/${cleanEndpoint}`;
  }
}

export function getApiHeaders() {
  const headers = {
    'Content-Type': 'application/json'
  };

  // Add API key if configured
  if (window.__MP__?.API_KEY) {
    headers['Authorization'] = `Bearer ${window.__MP__.API_KEY}`;
  }

  return headers;
}

export function createApiClient() {
  const config = getApiConfig();

  return {
    async get(endpoint, options = {}) {
      return this.request('GET', endpoint, null, options);
    },

    async post(endpoint, data, options = {}) {
      return this.request('POST', endpoint, data, options);
    },

    async put(endpoint, data, options = {}) {
      return this.request('PUT', endpoint, data, options);
    },

    async delete(endpoint, options = {}) {
      return this.request('DELETE', endpoint, null, options);
    },

    async request(method, endpoint, data, options = {}) {
      const url = buildApiUrl(endpoint);
      const headers = { ...getApiHeaders(), ...options.headers };

      const requestOptions = {
        method,
        headers,
        timeout: config.timeout
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        requestOptions.body = JSON.stringify(data);
      }

      let lastError;

      for (let attempt = 0; attempt <= config.retries; attempt++) {
        try {
          console.log(`🔗 API ${method} ${url} (attempt ${attempt + 1})`);

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), config.timeout);

          const response = await fetch(url, {
            ...requestOptions,
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            return await response.json();
          } else {
            return await response.text();
          }

        } catch (error) {
          lastError = error;

          if (error.name === 'AbortError') {
            console.warn(`⚠️ API request timeout for ${method} ${endpoint}`);
          } else {
            console.warn(`⚠️ API request failed for ${method} ${endpoint}:`, error.message);
          }

          // Don't retry on the last attempt
          if (attempt < config.retries) {
            const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
            console.log(`⏳ Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      // All retries failed
      console.error(`❌ API request failed after ${config.retries + 1} attempts:`, lastError);
      throw lastError;
    }
  };
}

// Global API client instance
export const apiClient = createApiClient();