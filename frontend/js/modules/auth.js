// Authentication module for the CAN attack dashboard
// Converted to ES6 Module

import { debounce } from './utils.js';

export class AuthManager {
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
     * Initialize session listeners
     */
    initSessionListeners() {
        const extend = debounce(() => this.extendSession(), 30000);
        document.addEventListener('mousemove', extend);
        document.addEventListener('keydown', extend);
        document.addEventListener('click', extend);
    }
}

export const authManager = new AuthManager();
