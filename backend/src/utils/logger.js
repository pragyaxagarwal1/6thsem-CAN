// Centralized logging utility
const fs = require('fs');
const path = require('path');

const LOG_LEVELS = {
    INFO: 'INFO',
    WARN: 'WARN',
    ERROR: 'ERROR',
    DEBUG: 'DEBUG'
};

class Logger {
    constructor() {
        this.logDir = path.join(__dirname, '../../logs');
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    formatMessage(level, message, meta = {}) {
        const timestamp = new Date().toISOString();
        const metaString = Object.keys(meta).length ? ` | ${JSON.stringify(meta)}` : '';
        return `[${timestamp}] [${level}] ${message}${metaString}`;
    }

    log(level, message, meta = {}) {
        const formattedMessage = this.formatMessage(level, message, meta);

        // Print to console with colors
        switch (level) {
            case LOG_LEVELS.ERROR:
                console.error('\x1b[31m%s\x1b[0m', formattedMessage);
                break;
            case LOG_LEVELS.WARN:
                console.warn('\x1b[33m%s\x1b[0m', formattedMessage);
                break;
            case LOG_LEVELS.DEBUG:
                console.debug('\x1b[36m%s\x1b[0m', formattedMessage);
                break;
            default:
                console.log('\x1b[32m%s\x1b[0m', formattedMessage);
        }

        // Write to file
        const logFile = path.join(this.logDir, `${new Date().toISOString().split('T')[0]}.log`);
        fs.appendFileSync(logFile, formattedMessage + '\n');
    }

    info(message, meta) { this.log(LOG_LEVELS.INFO, message, meta); }
    warn(message, meta) { this.log(LOG_LEVELS.WARN, message, meta); }
    error(message, meta) { this.log(LOG_LEVELS.ERROR, message, meta); }
    debug(message, meta) { this.log(LOG_LEVELS.DEBUG, message, meta); }
}

module.exports = new Logger();
