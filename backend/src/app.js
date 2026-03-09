// App setup
const express = require('express');
const path = require('path');
const cors = require('cors');
const apiRoutes = require('./routes/api');
const viewRoutes = require('./routes/views');
const logger = require('./utils/logger');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../frontend')));

// Routes
app.use('/api', apiRoutes);
app.use('/', viewRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
    logger.error('Unhandled server error', { error: err.message, stack: err.stack });
    res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
