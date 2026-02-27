// Configuration for CAN Attack Control Dashboard

module.exports = {
  // Server configuration
  PORT: process.env.PORT || 3000,
  HOST: '0.0.0.0',

  // WebSocket configuration
  HEARTBEAT_INTERVAL: 2000, // 2 seconds
  HEARTBEAT_TIMEOUT: 5000, // 5 seconds
  PING_INTERVAL: 1000, // 1 second for latency measurement
  MAX_QUEUED_LOGS: 1000, // Maximum logs to keep in memory

  // CAN Message validation
  CAN_VALIDATION: {
    ID_MIN: 0x000,
    ID_MAX: 0x7FF,
    PAYLOAD_LENGTH: 8,
    PAYLOAD_BYTES_PER_ELEMENT: 2, // 2 hex chars = 1 byte
  },

  // Attack frequency limits (Hz)
  FREQUENCY_LIMITS: {
    SPOOFING: { MIN: 1, MAX: 2000 },
    DOS: { MIN: 500, MAX: 5000 },
    FUZZING: { MIN: 1, MAX: 2000 },
  },

  // Intensity limits
  INTENSITY_LIMITS: {
    MIN: 1,
    MAX: 100,
  },

  // Login configuration
  LOGIN_PASSWORD: process.env.LOGIN_PASSWORD || 'admin@123', // Change in production
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours

  // Attack types
  ATTACK_TYPES: {
    SPOOFING: 'spoofing',
    DOS: 'dos',
    FUZZING: 'fuzzing',
  },

  // Fuzz modes
  FUZZ_MODES: {
    RANDOM_ID: 'random_id',
    RANDOM_PAYLOAD: 'random_payload',
    ID_PAYLOAD: 'id_payload',
  },

  // Payload randomization modes
  PAYLOAD_MODES: {
    FIXED: 'fixed',
    RANDOM: 'random',
    INCREMENTAL: 'incremental',
  },
};
