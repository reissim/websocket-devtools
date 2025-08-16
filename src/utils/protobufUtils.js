/**
 * Protobuf Detection and Decoding Utilities
 * Provides functions to detect and decode protobuf messages without schema
 */

/**
 * Detects if data appears to be protobuf format
 * @param {*} data - The data to check
 * @returns {boolean} - True if likely protobuf
 */
export function isProtobufData(data) {
  try {
    // Check if data is binary-like
    if (data instanceof ArrayBuffer) {
      return checkProtobufSignature(new Uint8Array(data));
    }
    
    if (data instanceof Uint8Array) {
      return checkProtobufSignature(data);
    }
    
    // Check if string data represents binary (base64 or hex)
    if (typeof data === 'string') {
      // Try to detect base64 encoded binary data
      if (isBase64String(data)) {
        try {
          const decoded = atob(data);
          const bytes = new Uint8Array(decoded.length);
          for (let i = 0; i < decoded.length; i++) {
            bytes[i] = decoded.charCodeAt(i);
          }
          return checkProtobufSignature(bytes);
        } catch (e) {
          return false;
        }
      }
      
      // Check if looks like hex string
      if (isHexString(data)) {
        try {
          const bytes = hexToBytes(data);
          return checkProtobufSignature(bytes);
        } catch (e) {
          return false;
        }
      }
      
      // Check if string contains binary data (non-printable characters)
      if (containsBinaryData(data)) {
        const bytes = new Uint8Array(data.length);
        for (let i = 0; i < data.length; i++) {
          bytes[i] = data.charCodeAt(i);
        }
        return checkProtobufSignature(bytes);
      }
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Checks if byte array has protobuf wire format signatures
 * @param {Uint8Array} bytes - Byte array to check
 * @returns {boolean} - True if has protobuf patterns
 */
function checkProtobufSignature(bytes) {
  if (!bytes || bytes.length < 2) {
    return false;
  }
  
  try {
    // Check for valid protobuf wire format patterns
    let position = 0;
    let validFields = 0;
    let maxFields = 10; // Check up to 10 fields to avoid infinite loops
    
    while (position < bytes.length && validFields < maxFields) {
      // Read field header (tag + wire type)
      const header = readVarint(bytes, position);
      if (!header) break;
      
      const tag = header.value >>> 3;
      const wireType = header.value & 0x07;
      position = header.nextPosition;
      
      // Check if tag and wire type are valid
      if (tag === 0 || wireType > 5) {
        break;
      }
      
      // Skip field data based on wire type
      const skipResult = skipFieldData(bytes, position, wireType);
      if (!skipResult) break;
      
      position = skipResult.nextPosition;
      validFields++;
    }
    
    // If we found at least 2 valid fields and didn't encounter errors, likely protobuf
    return validFields >= 2;
  } catch (error) {
    return false;
  }
}

/**
 * Reads a varint from byte array starting at position
 * @param {Uint8Array} bytes - Byte array
 * @param {number} position - Starting position
 * @returns {Object|null} - {value, nextPosition} or null if invalid
 */
function readVarint(bytes, position) {
  let value = 0;
  let shift = 0;
  
  while (position < bytes.length) {
    const byte = bytes[position++];
    value |= (byte & 0x7F) << shift;
    
    if ((byte & 0x80) === 0) {
      return { value, nextPosition: position };
    }
    
    shift += 7;
    if (shift >= 64) {
      return null; // Varint too long
    }
  }
  
  return null; // Incomplete varint
}

/**
 * Skips field data based on wire type
 * @param {Uint8Array} bytes - Byte array
 * @param {number} position - Current position
 * @param {number} wireType - Protobuf wire type
 * @returns {Object|null} - {nextPosition} or null if error
 */
function skipFieldData(bytes, position, wireType) {
  switch (wireType) {
    case 0: // Varint
      const varint = readVarint(bytes, position);
      return varint ? { nextPosition: varint.nextPosition } : null;
      
    case 1: // Fixed64
      return position + 8 <= bytes.length ? { nextPosition: position + 8 } : null;
      
    case 2: // Length-delimited
      const length = readVarint(bytes, position);
      if (!length) return null;
      const endPos = length.nextPosition + length.value;
      return endPos <= bytes.length ? { nextPosition: endPos } : null;
      
    case 5: // Fixed32
      return position + 4 <= bytes.length ? { nextPosition: position + 4 } : null;
      
    default:
      return null; // Invalid wire type
  }
}

/**
 * Checks if string is base64 encoded
 * @param {string} str - String to check
 * @returns {boolean} - True if base64
 */
function isBase64String(str) {
  if (!str || str.length < 4) return false;
  
  // Basic base64 pattern check
  const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
  return base64Pattern.test(str) && str.length % 4 === 0;
}

/**
 * Checks if string is hex encoded
 * @param {string} str - String to check
 * @returns {boolean} - True if hex
 */
function isHexString(str) {
  if (!str || str.length < 2) return false;
  
  // Remove common hex prefixes
  const cleanStr = str.replace(/^(0x|\\x)/i, '');
  
  // Check if even length and only hex characters
  return cleanStr.length % 2 === 0 && /^[0-9a-fA-F]+$/.test(cleanStr);
}

/**
 * Converts hex string to byte array
 * @param {string} hex - Hex string
 * @returns {Uint8Array} - Byte array
 */
function hexToBytes(hex) {
  const cleanHex = hex.replace(/^(0x|\\x)/i, '');
  const bytes = new Uint8Array(cleanHex.length / 2);
  
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
  }
  
  return bytes;
}

/**
 * Checks if string contains binary data (non-printable characters)
 * @param {string} str - String to check
 * @returns {boolean} - True if contains binary data
 */
function containsBinaryData(str) {
  // Check for high ratio of non-printable characters
  let binaryCount = 0;
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    // Non-printable ASCII (except whitespace)
    if ((charCode < 32 && charCode !== 9 && charCode !== 10 && charCode !== 13) || charCode > 126) {
      binaryCount++;
    }
  }
  
  // If more than 20% of characters are non-printable, likely binary
  return binaryCount / str.length > 0.2;
}

/**
 * Attempts to decode protobuf data without schema using reflection
 * @param {*} data - Data to decode
 * @returns {Object} - {success, decoded, raw, error}
 */
export function decodeProtobufData(data) {
  try {
    let bytes;
    
    // Convert data to bytes
    if (data instanceof ArrayBuffer) {
      bytes = new Uint8Array(data);
    } else if (data instanceof Uint8Array) {
      bytes = data;
    } else if (typeof data === 'string') {
      if (isBase64String(data)) {
        const decoded = atob(data);
        bytes = new Uint8Array(decoded.length);
        for (let i = 0; i < decoded.length; i++) {
          bytes[i] = decoded.charCodeAt(i);
        }
      } else if (isHexString(data)) {
        bytes = hexToBytes(data);
      } else if (containsBinaryData(data)) {
        bytes = new Uint8Array(data.length);
        for (let i = 0; i < data.length; i++) {
          bytes[i] = data.charCodeAt(i);
        }
      } else {
        return {
          success: false,
          error: 'Data does not appear to be binary format'
        };
      }
    } else {
      return {
        success: false,
        error: 'Unsupported data type for protobuf decoding'
      };
    }
    
    // Attempt to decode using simple reflection
    const decoded = reflectiveDecodeProtobuf(bytes);
    
    // Encode raw data for display
    const raw = encodeRawForDisplay(data, bytes);
    
    return {
      success: true,
      decoded,
      raw,
      error: null
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to decode protobuf data',
      raw: encodeRawForDisplay(data, null)
    };
  }
}

/**
 * Simple reflective protobuf decoder (without schema)
 * @param {Uint8Array} bytes - Protobuf bytes
 * @returns {Object} - Decoded object
 */
function reflectiveDecodeProtobuf(bytes) {
  const result = {};
  let position = 0;
  
  while (position < bytes.length) {
    // Read field header
    const header = readVarint(bytes, position);
    if (!header) break;
    
    const tag = header.value >>> 3;
    const wireType = header.value & 0x07;
    position = header.nextPosition;
    
    const fieldName = `field_${tag}`;
    
    try {
      const fieldResult = decodeField(bytes, position, wireType);
      if (fieldResult) {
        result[fieldName] = fieldResult.value;
        position = fieldResult.nextPosition;
      } else {
        break;
      }
    } catch (error) {
      result[fieldName] = `<decode_error: ${error.message}>`;
      break;
    }
  }
  
  return result;
}

/**
 * Decodes a single protobuf field
 * @param {Uint8Array} bytes - Byte array
 * @param {number} position - Current position
 * @param {number} wireType - Wire type
 * @returns {Object|null} - {value, nextPosition} or null
 */
function decodeField(bytes, position, wireType) {
  switch (wireType) {
    case 0: // Varint
      const varint = readVarint(bytes, position);
      return varint ? { value: varint.value, nextPosition: varint.nextPosition } : null;
      
    case 1: // Fixed64
      if (position + 8 > bytes.length) return null;
      const fixed64 = new DataView(bytes.buffer, bytes.byteOffset + position, 8);
      return {
        value: fixed64.getBigUint64(0, true), // little-endian
        nextPosition: position + 8
      };
      
    case 2: // Length-delimited (string, bytes, embedded message)
      const length = readVarint(bytes, position);
      if (!length) return null;
      
      const start = length.nextPosition;
      const end = start + length.value;
      if (end > bytes.length) return null;
      
      const data = bytes.slice(start, end);
      
      // Try to decode as nested message first
      try {
        const nested = reflectiveDecodeProtobuf(data);
        if (Object.keys(nested).length > 0) {
          return { value: nested, nextPosition: end };
        }
      } catch (e) {
        // Not a nested message, continue with other attempts
      }
      
      // Try to decode as UTF-8 string
      try {
        const decoder = new TextDecoder('utf-8', { fatal: true });
        const str = decoder.decode(data);
        return { value: str, nextPosition: end };
      } catch (e) {
        // Not a valid UTF-8 string, return as base64
        const base64 = btoa(String.fromCharCode(...data));
        return { value: `<bytes: ${base64}>`, nextPosition: end };
      }
      
    case 5: // Fixed32
      if (position + 4 > bytes.length) return null;
      const fixed32 = new DataView(bytes.buffer, bytes.byteOffset + position, 4);
      return {
        value: fixed32.getUint32(0, true), // little-endian
        nextPosition: position + 4
      };
      
    default:
      return null;
  }
}

/**
 * Encodes raw data for display purposes
 * @param {*} originalData - Original data
 * @param {Uint8Array} bytes - Byte representation
 * @returns {string} - Encoded raw data for display
 */
function encodeRawForDisplay(originalData, bytes) {
  try {
    if (typeof originalData === 'string') {
      // If it was already a string, preserve original format
      return originalData;
    }
    
    if (bytes) {
      // Convert to base64 for clean display
      const base64 = btoa(String.fromCharCode(...bytes));
      return base64;
    }
    
    return String(originalData);
  } catch (error) {
    return '<encoding_error>';
  }
}
