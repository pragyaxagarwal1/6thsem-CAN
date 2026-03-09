// Login page logic
// Converted to ES6 Module

import { AuthManager } from './modules/auth.js';

const auth = new AuthManager();

// Check if already logged in
if (auth.isAuthenticated()) {
    window.location.href = '/dashboard';
}

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('loginBtn');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    const loadingSpinner = document.getElementById('loadingSpinner');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = passwordInput.value.trim();

        if (!password) {
            showError('Please enter a password');
            return;
        }

        loginBtn.disabled = true;
        loadingSpinner.style.display = 'inline-block';

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                localStorage.setItem('dashboardToken', data.token);
                localStorage.setItem('loginTime', Date.now().toString());

                showSuccess('Login successful! Redirecting...');
                setTimeout(() => { window.location.href = '/dashboard'; }, 500);
            } else {
                showError(data.error || 'Login failed');
                loginBtn.disabled = false;
                loadingSpinner.style.display = 'none';
            }
        } catch (error) {
            showError('System error: ' + error.message);
            loginBtn.disabled = false;
            loadingSpinner.style.display = 'none';
        }
    });

    function showError(msg) {
        errorMessage.textContent = msg;
        errorMessage.style.display = 'block';
        successMessage.style.display = 'none';
    }

    function showSuccess(msg) {
        successMessage.textContent = msg;
        successMessage.style.display = 'block';
        errorMessage.style.display = 'none';
    }
});
