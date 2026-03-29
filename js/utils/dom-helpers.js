/**
 * DOM Helpers - Safe DOM manipulation utilities
 * Prevents null reference errors and provides consistent patterns
 */

export function $(id) {
  return document.getElementById(id);
}

export function safeSetText(id, value) {
  const el = $(id);
  if (el) {
    el.textContent = value;
    return true;
  }
  console.warn(`DOM Helper: Element with id '${id}' not found`);
  return false;
}

export function safeSetHTML(id, html) {
  const el = $(id);
  if (el) {
    // Only use innerHTML for static, trusted content
    // For dynamic content, use createElement pattern
    el.innerHTML = html;
    return true;
  }
  console.warn(`DOM Helper: Element with id '${id}' not found`);
  return false;
}

export function safeAddClass(id, className) {
  const el = $(id);
  if (el) {
    el.classList.add(className);
    return true;
  }
  return false;
}

export function safeRemoveClass(id, className) {
  const el = $(id);
  if (el) {
    el.classList.remove(className);
    return true;
  }
  return false;
}

export function safeToggleClass(id, className, force) {
  const el = $(id);
  if (el) {
    return el.classList.toggle(className, force);
  }
  return false;
}

export function safeSetAttribute(id, attr, value) {
  const el = $(id);
  if (el) {
    el.setAttribute(attr, value);
    return true;
  }
  return false;
}

export function safeAddEventListener(id, event, handler, options) {
  const el = $(id);
  if (el) {
    el.addEventListener(event, handler, options);
    return true;
  }
  console.warn(`DOM Helper: Cannot add event listener to non-existent element '${id}'`);
  return false;
}

export function createElement(tag, options = {}) {
  const element = document.createElement(tag);

  if (options.id) element.id = options.id;
  if (options.className) element.className = options.className;
  if (options.textContent) element.textContent = options.textContent;
  if (options.innerHTML) element.innerHTML = options.innerHTML;
  if (options.attributes) {
    Object.entries(options.attributes).forEach(([attr, value]) => {
      element.setAttribute(attr, value);
    });
  }
  if (options.styles) {
    Object.entries(options.styles).forEach(([prop, value]) => {
      element.style[prop] = value;
    });
  }

  return element;
}

export function safeQuerySelector(selector, parent = document) {
  try {
    return parent.querySelector(selector);
  } catch (error) {
    console.warn(`DOM Helper: Invalid selector '${selector}':`, error);
    return null;
  }
}

export function safeQuerySelectorAll(selector, parent = document) {
  try {
    return Array.from(parent.querySelectorAll(selector));
  } catch (error) {
    console.warn(`DOM Helper: Invalid selector '${selector}':`, error);
    return [];
  }
}

// Debounce utility for performance optimization
export function debounce(func, wait, immediate) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
}

// Throttle utility for performance optimization
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}