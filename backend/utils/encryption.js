// backend/utils/encryption.js
//
// AES-256-GCM field-level encryption for sensitive data at rest.
// Each call to encrypt() uses a fresh random IV, guaranteeing that
// the same plaintext produces a different ciphertext every time.
//
// Encrypted format stored in MongoDB:
//   "enc:<iv_hex>:<authTag_hex>:<ciphertext_hex>"
//
// The "enc:" sentinel lets the pre-save hook skip already-encrypted values
// and lets the post-init hook skip plaintext fields (graceful migration).
//
// REQUIRED environment variable:
//   FIELD_ENCRYPTION_KEY — exactly 64 hex characters (32 bytes / 256 bits)
//   Generate one with:  node -e "require('crypto').randomBytes(32).toString('hex')"

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM  = 'aes-256-gcm';
const IV_BYTES   = 16; // 128-bit IV (recommended for GCM)
const ENC_PREFIX = 'enc:'; // sentinel that marks an encrypted stored value

/** Return the key Buffer, validating the environment variable. */
const getKey = () => {
    const hexKey = process.env.FIELD_ENCRYPTION_KEY;
    if (!hexKey || hexKey.length !== 64) {
        throw new Error(
            'FIELD_ENCRYPTION_KEY must be a 64-character hex string (32 bytes). ' +
            'Generate one with: node -e "require(\'crypto\').randomBytes(32).toString(\'hex\')"'
        );
    }
    return Buffer.from(hexKey, 'hex');
};

/**
 * Encrypts a plaintext string.
 * @param {string|null|undefined} plaintext
 * @returns {string} "enc:<iv_hex>:<authTag_hex>:<ciphertext_hex>", or the
 *                   original value if it is falsy or already encrypted.
 */
export const encrypt = (plaintext) => {
    if (!plaintext) return plaintext;
    // Idempotent: don't double-encrypt
    if (String(plaintext).startsWith(ENC_PREFIX)) return plaintext;

    const iv          = randomBytes(IV_BYTES);
    const cipher      = createCipheriv(ALGORITHM, getKey(), iv);
    const ciphertext  = Buffer.concat([
        cipher.update(String(plaintext), 'utf8'),
        cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    return `${ENC_PREFIX}${iv.toString('hex')}:${authTag.toString('hex')}:${ciphertext.toString('hex')}`;
};

/**
 * Decrypts a value that was produced by encrypt().
 * @param {string|null|undefined} value
 * @returns {string|null} Original plaintext, the original value unchanged if
 *                        it is not an encrypted string, or null on decryption failure.
 */
export const decrypt = (value) => {
    if (!value || !String(value).startsWith(ENC_PREFIX)) return value;

    try {
        const withoutPrefix = String(value).slice(ENC_PREFIX.length);
        const parts = withoutPrefix.split(':');

        if (parts.length !== 3) {
            throw new Error('Encrypted value has unexpected format (expected 3 colon-separated parts).');
        }

        const [ivHex, authTagHex, ciphertextHex] = parts;
        const iv         = Buffer.from(ivHex,         'hex');
        const authTag    = Buffer.from(authTagHex,    'hex');
        const ciphertext = Buffer.from(ciphertextHex, 'hex');

        const decipher = createDecipheriv(ALGORITHM, getKey(), iv);
        decipher.setAuthTag(authTag);

        return Buffer.concat([
            decipher.update(ciphertext),
            decipher.final(),
        ]).toString('utf8');

    } catch (err) {
        // Swallow the error so a data issue in one field doesn't crash the
        // whole request — the admin panel will see "null" for that field.
        console.error('[encryption] Decryption failed:', err.message);
        return null;
    }
};
