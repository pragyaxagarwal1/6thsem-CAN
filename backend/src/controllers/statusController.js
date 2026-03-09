// Status controller
const config = require('../config');
const logger = require('../utils/logger');

const getHealth = (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
};

const getStatus = (wsHandler) => (req, res) => {
    res.json(wsHandler.getStatus());
};

const getConfig = (req, res) => {
    res.json({
        ATTACK_TYPES: config.ATTACK_TYPES,
        FUZZ_MODES: config.FUZZ_MODES,
        FREQUENCY_LIMITS: config.FREQUENCY_LIMITS,
        INTENSITY_LIMITS: config.INTENSITY_LIMITS,
    });
};

module.exports = {
    getHealth,
    getStatus,
    getConfig,
};
