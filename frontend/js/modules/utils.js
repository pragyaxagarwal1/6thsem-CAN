// Utility functions for the CAN attack dashboard
// Converted to ES6 Module

/**
 * Show a notification
 */
export function showNotification(message, type = 'info', duration = 4000) {
    const area = document.getElementById('notificationArea');
    if (!area) return;

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
export function isValidHex(value) {
    return /^(0x)?[0-9A-Fa-f]+$/.test(value);
}

/**
 * Format timestamp
 */
export function formatTime(date) {
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
export function formatFullTime(date) {
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
export function debounce(func, wait) {
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
export function throttle(func, limit) {
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
 * CSV export utility
 */
export function downloadCSV(csvContent, filename = 'export.csv') {
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
 * Escape HTML to prevent XSS
 */
export function escapeHtml(unsafe) {
    if (unsafe === undefined || unsafe === null) return '';
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Format number with separators
 */
export function formatNumber(num) {
    return new Intl.NumberFormat().format(num);
}
