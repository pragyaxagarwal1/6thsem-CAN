// Utility functions for the CAN attack dashboard

/**
 * Show a notification
 */
function showNotification(message, type = 'info', duration = 4000) {
  const area = document.getElementById('notificationArea');
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;

  area.appendChild(notification);

  if (duration > 0) {
    setTimeout(() => {
      notification.classList.add('removing');
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, duration);
  }

  return notification;
}

/**
 * Validate hex color/value
 */
function isValidHex(value) {
  return /^(0x)?[0-9A-Fa-f]+$/.test(value);
}

/**
 * Format timestamp
 */
function formatTime(date) {
  if (typeof date === 'string') {
    date = new Date(date);
  }

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Format full timestamp with date
 */
function formatFullTime(date) {
  if (typeof date === 'string') {
    date = new Date(date);
  }

  const dateStr = date.toISOString().split('T')[0];
  const timeStr = formatTime(date);

  return `${dateStr} ${timeStr}`;
}

/**
 * Debounce function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function
 */
function throttle(func, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Format bytes for file size display
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Deep clone object
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map((item) => deepClone(item));
  if (obj instanceof Object) {
    const cloned = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }
}

/**
 * Escape HTML string
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * CSV export utility
 */
function downloadCSV(csvContent, filename = 'export.csv') {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Get URL parameter
 */
function getUrlParameter(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

/**
 * Update URL parameter without reload
 */
function updateUrlParameter(param, value) {
  const url = new URL(window.location);
  url.searchParams.set(param, value);
  window.history.pushState({}, '', url);
}

/**
 * Batch DOM updates to prevent reflows
 */
function batchDOMUpdates(updates) {
  const fragment = document.createDocumentFragment();

  updates.forEach((update) => {
    if (update.remove) {
      update.element.remove();
    } else if (update.html) {
      const temp = document.createElement('div');
      temp.innerHTML = update.html;
      while (temp.firstChild) {
        fragment.appendChild(temp.firstChild);
      }
    } else if (update.element) {
      fragment.appendChild(update.element);
    }
  });

  return fragment;
}

/**
 * Format number with thousand separator
 */
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Check if element is in viewport
 */
function isInViewport(el) {
  const rect = el.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Wait for condition to be true
 */
function waitFor(condition, timeout = 10000, interval = 100) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const check = () => {
      if (condition()) {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(new Error('Timeout waiting for condition'));
      } else {
        setTimeout(check, interval);
      }
    };

    check();
  });
}

/**
 * Create element with attributes
 */
function createElement(tag, attributes = {}, content = '') {
  const el = document.createElement(tag);

  Object.assign(el, attributes);

  if (content) {
    if (typeof content === 'string') {
      el.textContent = content;
    } else if (content instanceof HTMLElement) {
      el.appendChild(content);
    } else if (Array.isArray(content)) {
      content.forEach((child) => {
        if (typeof child === 'string') {
          el.appendChild(document.createTextNode(child));
        } else if (child instanceof HTMLElement) {
          el.appendChild(child);
        }
      });
    }
  }

  return el;
}

/**
 * Update current time display
 */
function updateClock() {
  const timeEl = document.getElementById('currentTime');
  if (timeEl) {
    timeEl.textContent = formatTime(new Date());
  }
}

// Start clock update
setInterval(updateClock, 1000);

// Initial update
updateClock();
