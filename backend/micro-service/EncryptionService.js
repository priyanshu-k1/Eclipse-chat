const crypto = require('crypto');
require('dotenv').config();

const ALGORITHM = 'aes-256-gcm';
const SECRET_KEY = Buffer.from(process.env.MESSAGE_SECRET_KEY, 'hex');
const IV_LENGTH = 16;

// Encrypt
function encryptMessage(text) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return { iv: iv.toString('hex'), encryptedData: encrypted, authTag };
}

// Decrypt
function decryptMessage(encryptedData, iv, authTag) {
    const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

module.exports = { encryptMessage, decryptMessage };
