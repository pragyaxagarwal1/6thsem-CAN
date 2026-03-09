// Frontend configuration
// Converted to ES6 Module

export const config = {
    // WebSocket settings
    RECONNECT_ATTEMPTS: 10,
    RECONNECT_DELAY: 2000,

    // Attack types
    ATTACK_TYPES: {
        SPOOFING: 'spoofing',
        DOS: 'dos',
        FUZZING: 'fuzzing'
    },

    // Fuzzing modes
    FUZZ_MODES: {
        RANDOM_ID: 'random_id',
        RANDOM_PAYLOAD: 'random_payload',
        ID_PAYLOAD: 'id_payload'
    },

    // UI settings
    LOG_BUFFER_SIZE: 50,
    MAX_DISPLAYED_LOGS: 500,
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000 // 24 hours
};

/**
 * Get WebSocket URL based on current location
 */
export function getWebSocketUrl() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}`;
}
