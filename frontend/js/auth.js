// Authentication module for the CAN attack dashboard

class AuthManager {
  constructor() {
    this.token = null;
    this.loginTime = null;
    this.sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    this.token = localStorage.getItem('dashboardToken');
    this.loginTime = localStorage.getItem('loginTime');

    if (!this.token || !this.loginTime) {
      return false;
    }

    // Check session timeout
    const elapsed = Date.now() - parseInt(this.loginTime);
    if (elapsed > this.sessionTimeout) {
      this.logout();
      return false;
    }

    return true;
  }

  /**
   * Get authentication token
   */
  getToken() {
    return this.token || localStorage.getItem('dashboardToken');
  }

  /**
   * Logout user
   */
  logout() {
    localStorage.removeItem('dashboardToken');
    localStorage.removeItem('loginTime');
    this.token = null;
    this.loginTime = null;

    // Redirect to login page
    window.location.href = '/login';
  }

  /**
   * Extend session
   */
  extendSession() {
    if (this.isAuthenticated()) {
      localStorage.setItem('loginTime', Date.now());
      this.loginTime = Date.now();
    }
  }

  /**
   * Get remaining session time
   */
  getRemainingTime() {
    if (!this.loginTime) return 0;

    const elapsed = Date.now() - parseInt(this.loginTime);
    const remaining = this.sessionTimeout - elapsed;

    return Math.max(0, remaining);
  }

  /**
   * Format remaining time
   */
  formatRemainingTime() {
    const ms = this.getRemainingTime();
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
}

// Global auth manager
const authManager = new AuthManager();

// Check authentication on page load
if (!authManager.isAuthenticated()) {
  window.location.href = '/login';
}

// Extend session on user activity
document.addEventListener('mousemove', debounce(() => authManager.extendSession(), 30000));
document.addEventListener('keydown', debounce(() => authManager.extendSession(), 30000));
document.addEventListener('click', debounce(() => authManager.extendSession(), 30000));
