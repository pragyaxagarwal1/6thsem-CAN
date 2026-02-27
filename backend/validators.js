// Validation utilities for CAN messages and attack parameters

const config = require('./config');

/**
 * Validate CAN ID
 * @param {string} id - CAN ID in hex format (e.g., "0x123")
 * @returns {boolean}
 */
function validateCanId(id) {
  if (!id || typeof id !== 'string') return false;

  // Remove 0x prefix if present
  const hexValue = id.startsWith('0x') ? id.slice(2) : id;

  // Check if valid hex and within range
  const numValue = parseInt(hexValue, 16);
  return (
    !isNaN(numValue) &&
    numValue >= config.CAN_VALIDATION.ID_MIN &&
    numValue <= config.CAN_VALIDATION.ID_MAX
  );
}

/**
 * Validate CAN payload (8 bytes = 16 hex chars)
 * @param {string} payload - Hex string (with or without spaces)
 * @returns {boolean}
 */
function validatePayload(payload) {
  if (!payload || typeof payload !== 'string') return false;

  // Remove spaces
  const cleanPayload = payload.replace(/\s/g, '');

  // Must be exactly 16 hex characters (8 bytes)
  if (cleanPayload.length !== 16) return false;

  // Must be valid hex
  return /^[0-9A-Fa-f]{16}$/.test(cleanPayload);
}

/**
 * Normalize payload to uppercase without spaces
 * @param {string} payload
 * @returns {string}
 */
function normalizePayload(payload) {
  return payload.replace(/\s/g, '').toUpperCase();
}

/**
 * Validate frequency within range
 * @param {number} frequency
 * @param {object} range - { MIN, MAX }
 * @returns {boolean}
 */
function validateFrequency(frequency, range) {
  const freq = Number(frequency);
  return !isNaN(freq) && freq >= range.MIN && freq <= range.MAX;
}

/**
 * Validate intensity slider value
 * @param {number} intensity
 * @returns {boolean}
 */
function validateIntensity(intensity) {
  const value = Number(intensity);
  return (
    !isNaN(value) &&
    value >= config.INTENSITY_LIMITS.MIN &&
    value <= config.INTENSITY_LIMITS.MAX
  );
}

/**
 * Validate spoofing attack parameters
 * @param {object} params
 * @returns {object} { valid: boolean, errors: array }
 */
function validateSpoofing(params) {
  const errors = [];

  if (!validateCanId(params.id)) {
    errors.push('Invalid CAN ID. Must be hex (0x000 - 0x7FF)');
  }

  if (!validatePayload(params.payload)) {
    errors.push('Invalid payload. Must be 8 bytes (16 hex chars)');
  }

  const freqRange = config.FREQUENCY_LIMITS.SPOOFING;
  if (!validateFrequency(params.frequency, freqRange)) {
    errors.push(
      `Frequency out of range. Must be ${freqRange.MIN}-${freqRange.MAX} Hz`
    );
  }

  if (!validateIntensity(params.intensity)) {
    errors.push(
      `Intensity out of range. Must be ${config.INTENSITY_LIMITS.MIN}-${config.INTENSITY_LIMITS.MAX}`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate DoS attack parameters
 * @param {object} params
 * @returns {object} { valid: boolean, errors: array }
 */
function validateDos(params) {
  const errors = [];

  if (params.payload && !validatePayload(params.payload)) {
    errors.push('Invalid payload. Must be 8 bytes (16 hex chars)');
  }

  const freqRange = config.FREQUENCY_LIMITS.DOS;
  if (!validateFrequency(params.frequency, freqRange)) {
    errors.push(
      `Frequency out of range. Must be ${freqRange.MIN}-${freqRange.MAX} Hz`
    );
  }

  if (!validateIntensity(params.intensity)) {
    errors.push(
      `Intensity out of range. Must be ${config.INTENSITY_LIMITS.MIN}-${config.INTENSITY_LIMITS.MAX}`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate Fuzzing attack parameters
 * @param {object} params
 * @returns {object} { valid: boolean, errors: array }
 */
function validateFuzzing(params) {
  const errors = [];

  const validModes = Object.values(config.FUZZ_MODES);
  if (!params.fuzz_mode || !validModes.includes(params.fuzz_mode)) {
    errors.push(`Invalid fuzz mode. Must be one of: ${validModes.join(', ')}`);
  }

  if (!validateCanId(params.min_id)) {
    errors.push('Invalid min ID');
  }

  if (!validateCanId(params.max_id)) {
    errors.push('Invalid max ID');
  }

  if (
    validateCanId(params.min_id) &&
    validateCanId(params.max_id) &&
    parseInt(params.min_id, 16) > parseInt(params.max_id, 16)
  ) {
    errors.push('Min ID cannot be greater than max ID');
  }

  const freqRange = config.FREQUENCY_LIMITS.FUZZING;
  if (!validateFrequency(params.frequency, freqRange)) {
    errors.push(
      `Frequency out of range. Must be ${freqRange.MIN}-${freqRange.MAX} Hz`
    );
  }

  if (!validateIntensity(params.intensity)) {
    errors.push(
      `Intensity out of range. Must be ${config.INTENSITY_LIMITS.MIN}-${config.INTENSITY_LIMITS.MAX}`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate entire attack message
 * @param {object} message
 * @returns {object} { valid: boolean, errors: array }
 */
function validateAttackMessage(message) {
  const errors = [];

  if (!message.type || message.type !== 'start_attack') {
    errors.push('Invalid message type');
  }

  if (!message.attack_type) {
    errors.push('Missing attack_type');
  }

  if (!message.parameters) {
    errors.push('Missing parameters');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Validate based on attack type
  const attackType = message.attack_type;

  switch (attackType) {
    case config.ATTACK_TYPES.SPOOFING:
      return validateSpoofing(message.parameters);
    case config.ATTACK_TYPES.DOS:
      return validateDos(message.parameters);
    case config.ATTACK_TYPES.FUZZING:
      return validateFuzzing(message.parameters);
    default:
      return {
        valid: false,
        errors: [
          `Unknown attack type: ${attackType}. Valid types: ${Object.values(config.ATTACK_TYPES).join(', ')}`,
        ],
      };
  }
}

module.exports = {
  validateCanId,
  validatePayload,
  normalizePayload,
  validateFrequency,
  validateIntensity,
  validateSpoofing,
  validateDos,
  validateFuzzing,
  validateAttackMessage,
};
