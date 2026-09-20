import crypto from 'crypto';

const MASTER_SECRET = process.env.JWT_SECRET || 'gethired_production_jwt_secret_key_928374';
const ENC_PREFIX = 'enc:v1:';

/**
 * Derives a 32-byte (256-bit) encryption key using HKDF based on master secret and profile/context
 */
function deriveKey(context: string): Buffer {
  return Buffer.from(crypto.hkdfSync('sha256', MASTER_SECRET, context, 'gethired_secret_encryption', 32));
}

/**
 * Encrypts a sensitive string using AES-256-GCM
 * Returns payload in format: enc:v1:<iv_b64>:<tag_b64>:<ciphertext_b64>
 */
export function encryptSecret(plainText: string, context: string = 'default'): string {
  if (!plainText || plainText.trim() === '') return '';
  if (plainText.startsWith(ENC_PREFIX)) return plainText; // already encrypted

  const key = deriveKey(context);
  const iv = crypto.randomBytes(12); // 96-bit IV recommended for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(plainText, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const tag = cipher.getAuthTag();

  return `${ENC_PREFIX}${iv.toString('base64')}:${tag.toString('base64')}:${encrypted}`;
}

/**
 * Decrypts a payload encrypted with encryptSecret
 * If string is not encrypted (legacy plain text), returns it as-is for backward compatibility.
 */
export function decryptSecret(encryptedPayload: string, context: string = 'default'): string {
  if (!encryptedPayload) return '';
  if (!encryptedPayload.startsWith(ENC_PREFIX)) {
    return encryptedPayload; // unencrypted legacy plaintext
  }

  try {
    const raw = encryptedPayload.slice(ENC_PREFIX.length);
    const parts = raw.split(':');
    if (parts.length !== 3) return '';

    const [ivB64, tagB64, cipherB64] = parts;
    const key = deriveKey(context);
    const iv = Buffer.from(ivB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(cipherB64, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (err) {
    console.warn('[Secrets] Failed to decrypt sensitive field, returning empty string.');
    return '';
  }
}
