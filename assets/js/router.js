// Phoenix Pro Router - Simple Hash-Based Client-Side Router
class PhoenixRouter {
  constructor() {
    this.routes = {};
    this.currentRoute = null;
    this.init();
  }

  // Initialize router
  init() {
    // Listen for hash changes
    window.addEventListener('hashchange', () => this.handleRoute());
    // Listen for popstate events
    window.addEventListener('popstate', () => this.handleRoute());
    // Handle initial load
    this.handleRoute();
  }

  // Add a route
  addRoute(path, handler) {
    this.routes[path] = handler;
  }

  // Navigate to a route
  navigate(path) {
    window.location.hash = path;
  }

  // Handle route changes
  handleRoute() {
    const hash = window.location.hash.slice(1) || '/';
    const route = hash.split('?')[0]; // Remove query parameters

    if (this.routes[route]) {
      this.currentRoute = route;
      this.routes[route]();
    } else {
      // Default to home route
      this.navigate('/');
    }
  }

  // Get current route
  getCurrentRoute() {
    return this.currentRoute || '/';
  }

  // Get route parameters (for future use)
  getParams() {
    const hash = window.location.hash.slice(1) || '/';
    const queryString = hash.split('?')[1];
    if (!queryString) return {};

    const params = {};
    queryString.split('&').forEach(pair => {
      const [key, value] = pair.split('=');
      params[key] = decodeURIComponent(value);
    });
    return params;
  }
}

// Route handlers
const routeHandlers = {
  // Route 1: Home - Phoenix Pro Hero
  home: () => {
    document.title = 'Phoenix Pro - Revolutionary Tennis Coaching';

    // Show hero content, hide other sections
    showSection('home');
    hideSection('aegis-dashboard');
    hideSection('navigation-panel');

    // Update navigation state
    updateNavState('/');

    // Initialize hero-specific functionality
    initHeroSlide();
  },

  // Route 2: AEGIS Command Center
  aegis: () => {
    document.title = 'AEGIS Command Center - Real-Time Tennis Analytics';

    // Show AEGIS dashboard, hide other sections
    hideSection('home');
    showSection('aegis-dashboard');
    hideSection('navigation-panel');

    // Update navigation state
    updateNavState('/aegis');

    // Initialize AEGIS-specific functionality
    initAegisDashboard();
  },

  // Route 3: Navigation Panel
  navi: () => {
    document.title = 'Navigation - Phoenix Pro Control Panel';

    // Show navigation panel, hide other sections
    hideSection('home');
    hideSection('aegis-dashboard');
    showSection('navigation-panel');

    // Update navigation state
    updateNavState('/navi');

    // Initialize navigation-specific functionality
    initNavigationPanel();
  }
};

// Utility functions
function showSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    section.style.display = 'block';
    section.classList.add('active');
  }
}

function hideSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    section.style.display = 'none';
    section.classList.remove('active');
  }
}

function updateNavState(activeRoute) {
  // Update navigation button states
  const navLinks = document.querySelectorAll('[data-route]');
  navLinks.forEach(link => {
    if (link.getAttribute('data-route') === activeRoute) {
      link.classList.add('active');
      link.classList.remove('text-cyan-300');
      link.classList.add('text-cyan-100', 'bg-cyan-500/20');
    } else {
      link.classList.remove('active');
      link.classList.remove('text-cyan-100', 'bg-cyan-500/20');
      link.classList.add('text-cyan-300');
    }
  });
}

function updateRouteIndicator(route) {
  const indicator = document.getElementById('route-indicator');
  if (indicator) {
    indicator.textContent = `ROUTE: ${route}`;
  }
}

// Route-specific initializations
function initHeroSlide() {
  console.log('🎾 Initializing Phoenix Pro Hero Slide');
  // Hide the AEGIS dashboard for presentation mode
  const dashboard = document.getElementById('dashboard-slide-1');
  if (dashboard) {
    dashboard.classList.add('presentation-mode-hidden');
    dashboard.classList.remove('open');
  }
  // Update route indicator
  updateRouteIndicator('/');
}

function initAegisDashboard() {
  console.log('⚡ Initializing AEGIS Command Center');
  // Show the AEGIS dashboard
  const dashboard = document.getElementById('dashboard-slide-1');
  if (dashboard) {
    dashboard.classList.remove('presentation-mode-hidden');
    dashboard.classList.add('open');
  }
  // Update route indicator
  updateRouteIndicator('/aegis');
}

function initNavigationPanel() {
  console.log('🧭 Initializing Navigation Panel');
  // Show the navigation drawer
  const navDrawer = document.getElementById('nav-drawer');
  if (navDrawer) {
    navDrawer.classList.add('open');
  }
  // Update route indicator
  updateRouteIndicator('/navi');
}

// Initialize router when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Create router instance
  window.phoenixRouter = new PhoenixRouter();

  // Register routes
  window.phoenixRouter.addRoute('/', routeHandlers.home);
  window.phoenixRouter.addRoute('/aegis', routeHandlers.aegis);
  window.phoenixRouter.addRoute('/navi', routeHandlers.navi);

  console.log('🚀 Phoenix Pro Router initialized');
});
