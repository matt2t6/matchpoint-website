// MatchPoint Phoenix Pro — Client-Side Router
// Routes: / (home)  /aegis  /navi  /phoenix
(function () {
  'use strict';

  const ROUTE_MAP = {
    '/aegis':   'aegis-dashboard',
    '/navi':    'navigation-panel',
    '/phoenix': 'phoenix-route',
  };

  function navigate(path) {
    // '/' is the pitch deck — no route-section to show
    if (path === '/') {
      document.querySelectorAll('.route-section').forEach(el => {
        el.style.display = 'none';
        el.classList.remove('active');
      });
      document.querySelectorAll('.nav-route-btn').forEach(btn => {
        if (btn.dataset.route === '/') btn.classList.add('active');
        else btn.classList.remove('active');
      });
      const indicator = document.getElementById('route-indicator');
      if (indicator) indicator.textContent = 'ROUTE: /';
      try { history.pushState({ path: '/' }, '', '/'); } catch (e) {}
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const targetId = ROUTE_MAP[path] || null;

    // Hide all route sections
    document.querySelectorAll('.route-section').forEach(el => {
      el.style.display = 'none';
      el.classList.remove('active');
    });

    // Show target
    const target = targetId ? document.getElementById(targetId) : null;
    if (target) {
      target.style.display = '';
      target.classList.add('active');
    }

    // Update nav button active state
    document.querySelectorAll('.nav-route-btn').forEach(btn => {
      if (btn.dataset.route === path) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update route indicator
    const indicator = document.getElementById('route-indicator');
    if (indicator) indicator.textContent = 'ROUTE: ' + path;

    // Lazy-load Phoenix iframe on first visit
    if (path === '/phoenix') {
      const iframe = document.getElementById('phoenix-iframe');
      if (iframe && !iframe.src) {
        iframe.src = 'phoenix_pro.html';
      }
    }

    // Push to history
    try {
      history.pushState({ path }, '', path);
    } catch (e) {}
  }

  // Handle browser back/forward
  window.addEventListener('popstate', function (e) {
    const path = (e.state && e.state.path) || '/';
    navigate(path);
  });

  // Expose globally
  window.phoenixRouter = { navigate };

  // Init: honour URL on load
  document.addEventListener('DOMContentLoaded', function () {
    const path = window.location.pathname || '/';
    const validPaths = ['/', ...Object.keys(ROUTE_MAP)];
    navigate(validPaths.includes(path) ? path : '/');
  });
})();
