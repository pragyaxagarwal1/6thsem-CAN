// View Routing
const express = require('express');
const router = express.Router();
const path = require('path');

// Serve login page
router.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/login.html'));
});

// Serve dashboard
router.get(['/', '/dashboard'], (req, res) => {
    res.sendFile(path.join(__dirname, '../../../frontend/index.html'));
});

module.exports = router;
