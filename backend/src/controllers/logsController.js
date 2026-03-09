// Logs controller
const logger = require('../utils/logger');

const getLogs = (wsHandler) => (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 100;
        const offset = req.query.offset ? parseInt(req.query.offset) : 0;

        const logs = wsHandler.logs.slice(offset, offset + limit);

        res.json({
            logs,
            total: wsHandler.logs.length,
            limit,
            offset,
        });
    } catch (error) {
        logger.error('Error fetching logs', { error: error.message });
        res.status(500).json({ error: 'Internal server error' });
    }
};

const clearLogs = (wsHandler) => (req, res) => {
    try {
        wsHandler.clearLogs();
        logger.info('Logs cleared manually via API');
        res.json({ message: 'Logs cleared' });
    } catch (error) {
        logger.error('Error clearing logs', { error: error.message });
        res.status(500).json({ error: 'Internal server error' });
    }
};

const exportLogs = (wsHandler) => (req, res) => {
    try {
        if (wsHandler.logs.length === 0) {
            return res.status(400).json({ error: 'No logs to export' });
        }

        // Build CSV header
        const headers = [
            'Timestamp',
            'Attack Type',
            'CAN ID',
            'Payload',
            'Frequency',
            'Status',
        ];

        // Build CSV rows
        const rows = wsHandler.logs.map((log) => [
            log.timestamp || '',
            log.attack_type || '',
            log.id || '',
            log.payload || '',
            log.frequency || '',
            log.status || '',
        ]);

        // Create CSV content
        const csvContent = [
            headers.join(','),
            ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
            'Content-Disposition',
            'attachment; filename="can-attack-logs.csv"'
        );
        res.send(csvContent);
        logger.info('Logs exported to CSV');
    } catch (error) {
        logger.error('Error exporting logs', { error: error.message });
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    getLogs,
    clearLogs,
    exportLogs,
};
