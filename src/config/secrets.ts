import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

function getMasterSecret(): string {
  return process.env.JWT_SECRET || 'gethired_production_jwt_secret_key_928374';
}

const ENC_PREFIX = 'enc:v1:';

/**
 * Derives a 32-byte (256-bit) encryption key using HKDF based on master secret and profile/context
 */
function deriveKey(context: string): Buffer {
  return Buffer.from(crypto.hkdfSync('sha256', getMasterSecret(), context, 'gethired_secret_encryption', 32));
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

// In-memory RSA-OAEP keypair for client-to-server payload encryption
let rsaKeyPair: { publicKey: string; privateKey: string } | null = null;

function getOrGenerateRsaKeys() {
  if (!rsaKeyPair) {
    rsaKeyPair = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
  }
  return rsaKeyPair;
}

/**
 * Returns the public key in PEM format so the browser can encrypt payloads before transmission
 */
export function getClientEncryptionPublicKey(): string {
  return getOrGenerateRsaKeys().publicKey;
}

/**
 * Decrypts a payload encrypted by the browser using RSA-OAEP SHA-256
 * Payload format: rsa:v1:<base64_ciphertext>
 */
export function decryptClientPayload(val: string): string {
  if (!val || typeof val !== 'string') return '';
  if (!val.startsWith('rsa:v1:')) return val; // plain text fallback

  try {
    const cipherB64 = val.slice('rsa:v1:'.length);
    const { privateKey } = getOrGenerateRsaKeys();
    const decrypted = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      Buffer.from(cipherB64, 'base64')
    );
    return decrypted.toString('utf8');
  } catch (err) {
    console.error('[Secrets] Failed to decrypt RSA client payload:', err);
    return '';
  }
}
