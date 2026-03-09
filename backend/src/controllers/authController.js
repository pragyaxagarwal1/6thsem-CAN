// Authentication controller
const config = require('../config');
const logger = require('../utils/logger');

const login = (req, res) => {
    const { password } = req.body;

    if (!password) {
        logger.warn('Login attempt without password');
        return res.status(400).json({ error: 'Password required' });
    }

    if (password === config.LOGIN_PASSWORD) {
        logger.info('User logged in successfully');
        res.json({
            success: true,
            token: Buffer.from(password).toString('base64'),
        });
    } else {
        logger.warn('Invalid login attempt', { passwordProvided: '***' });
        res.status(401).json({ error: 'Invalid password' });
    }
};

module.exports = {
    login,
};
