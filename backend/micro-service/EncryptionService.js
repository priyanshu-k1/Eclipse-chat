const crypto = require('crypto');

class MessageEncryption {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32; // 256 bits
    this.ivLength = 16;  // 128 bits
  }

  /**
   * Generate a random 256-bit encryption key
   * @returns {Buffer} 32-byte encryption key
   */
  generateKey() {
    return crypto.randomBytes(this.keyLength);
  }

  /**
   * Derive a key from a password using PBKDF2
   * @param {string} password - User password
   * @param {Buffer} salt - Salt for key derivation
   * @returns {Buffer} Derived key
   */
  deriveKeyFromPassword(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 100000, this.keyLength, 'sha256');
  }

  /**
   * Generate a random salt for key derivation
   * @returns {Buffer} 16-byte salt
   */
  generateSalt() {
    return crypto.randomBytes(16);
  }

  /**
   * Encrypt a message using AES-256-GCM
   * @param {string} message - Plain text message to encrypt
   * @param {Buffer} key - 256-bit encryption key
   * @returns {Object} Encrypted data with IV and auth tag
   */
  encrypt(message, key) {
    try {
      // Generate random IV for each message
      const iv = crypto.randomBytes(this.ivLength);
      
      // Create cipher
      const cipher = crypto.createCipher(this.algorithm, key, { iv });
      
      // Encrypt the message
      let encrypted = cipher.update(message, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Get authentication tag
      const authTag = cipher.getAuthTag();
      
      return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        algorithm: this.algorithm
      };
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt a message using AES-256-GCM
   * @param {Object} encryptedData - Object containing encrypted data, IV, and auth tag
   * @param {Buffer} key - 256-bit encryption key
   * @returns {string} Decrypted plain text message
   */
  decrypt(encryptedData, key) {
    try {
      const { encrypted, iv, authTag } = encryptedData;
      const decipher = crypto.createDecipher(
        this.algorithm, 
        key, 
        { iv: Buffer.from(iv, 'hex') }
      );
    
      decipher.setAuthTag(Buffer.from(authTag, 'hex'));
      
      // Decrypt the message
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Encrypt message with password-based key
   * @param {string} message - Plain text message
   * @param {string} password - User password
   * @returns {Object} Encrypted data with salt
   */
  encryptWithPassword(message, password) {
    const salt = this.generateSalt();
    const key = this.deriveKeyFromPassword(password, salt);
    const encryptedData = this.encrypt(message, key);
    
    return {
      ...encryptedData,
      salt: salt.toString('hex')
    };
  }

  /**
   * Decrypt message with password-based key
   * @param {Object} encryptedData - Encrypted data with salt
   * @param {string} password - User password
   * @returns {string} Decrypted message
   */
  decryptWithPassword(encryptedData, password) {
    const salt = Buffer.from(encryptedData.salt, 'hex');
    const key = this.deriveKeyFromPassword(password, salt);
    return this.decrypt(encryptedData, key);
  }
}

module.exports = MessageEncryption;