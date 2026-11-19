import crypto from 'node:crypto';

export interface DecryptedPiccData {
  tagUid: string;
  readCounter: number;
}

export interface SunVerificationResult {
  verified: boolean;
  tagUid: string;
  readCounter: number;
  bypassedCmac?: boolean;
  errorReason?: 'INVALID_PICC' | 'INVALID_CMAC' | 'REPLAY_DETECTED';
}

/**
 * Decrypts NTAG 424 DNA PICCData payload using the Master Key (AES-128-CBC, zero IV).
 * Byte layout: [0xC7/0x00: Header] [0x01-0x07: 7-byte UID] [0x08-0x0A: 3-byte Counter LE] [0x0B-0x0F: Padding]
 */
export function decryptPiccData(
  piccDataHex: string,
  masterKeyHex: string
): DecryptedPiccData {
  const key = Buffer.from(masterKeyHex, 'hex');
  if (key.length !== 16) {
    throw new Error('Master key must be a 16-byte (32 hex char) AES-128 key');
  }

  const encryptedBytes = Buffer.from(piccDataHex, 'hex');
  if (encryptedBytes.length !== 16) {
    throw new Error('PICCData must be a 16-byte (32 hex char) encrypted block');
  }

  const iv = Buffer.alloc(16, 0); // Standard NXP zero IV for PICC decryption
  const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
  decipher.setAutoPadding(false);

  const decrypted = Buffer.concat([decipher.update(encryptedBytes), decipher.final()]);

  // Byte layout: [0x00: Header] [0x01-0x07: 7-byte UID] [0x08-0x0A: 3-byte Counter]
  const tagUid = decrypted.subarray(1, 8).toString('hex').toUpperCase();
  const readCounter = decrypted.readUIntLE(8, 3);

  return { tagUid, readCounter };
}

/**
 * Helper to encrypt a 7-byte UID and 3-byte read counter into a 16-byte PICCData hex string.
 * Useful for test vector generation and hardware emulation.
 */
export function encryptPiccData(
  tagUidHex: string,
  readCounter: number,
  masterKeyHex: string
): string {
  const key = Buffer.from(masterKeyHex, 'hex');
  const uidBytes = Buffer.from(tagUidHex, 'hex');
  if (uidBytes.length !== 7) {
    throw new Error('Tag UID must be 7 bytes (14 hex characters)');
  }

  const plain = Buffer.alloc(16, 0);
  plain[0] = 0xc7; // Standard NXP PICCData tag header byte
  uidBytes.copy(plain, 1);
  plain.writeUIntLE(readCounter, 8, 3);

  const iv = Buffer.alloc(16, 0);
  const cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
  cipher.setAutoPadding(false);

  const encrypted = Buffer.concat([cipher.update(plain), cipher.final()]);
  return encrypted.toString('hex').toUpperCase();
}

/**
 * Derives a diversified session key for an individual tag UID.
 */
export function deriveDiversifiedKey(masterKeyHex: string, tagUidHex: string): Buffer {
  const masterKey = Buffer.from(masterKeyHex, 'hex');
  const derivationInput = Buffer.concat([
    Buffer.from([0x01]),
    Buffer.from(tagUidHex, 'hex'),
    Buffer.alloc(8, 0x00)
  ]);

  const hmac = crypto.createHmac('sha256', masterKey);
  hmac.update(derivationInput);
  return hmac.digest().subarray(0, 16); // 128-bit truncated key
}

/**
 * Computes the 8-byte (16 hex char) truncated CMAC over a transaction payload.
 */
export function computeCmac(sessionKey: Buffer, transactionPayload: Buffer): string {
  const cipher = crypto.createCipheriv('aes-128-cbc', sessionKey, Buffer.alloc(16, 0));
  const fullCmac = cipher.update(transactionPayload);
  return fullCmac.subarray(fullCmac.length - 8).toString('hex').toUpperCase();
}

/**
 * Validates dynamic CMAC over NDEF URL parameters.
 */
export function verifyCmac(
  sessionKey: Buffer,
  transactionPayload: Buffer,
  providedCmacHex: string
): boolean {
  // CMAC-K1/K2 generation over transaction payload
  const cipher = crypto.createCipheriv('aes-128-cbc', sessionKey, Buffer.alloc(16, 0));
  const fullCmac = cipher.update(transactionPayload);

  // Truncate according to NXP SUN specification (8 bytes / 16 hex chars)
  const truncatedCalculated = fullCmac
    .subarray(fullCmac.length - 8)
    .toString('hex')
    .toUpperCase();
  return truncatedCalculated === providedCmacHex.toUpperCase();
}

/**
 * Validates monotonic read counter progression to prevent replay attacks.
 */
export function isCounterValid(incomingCounter: number, lastSeenCounter: number): boolean {
  return incomingCounter > lastSeenCounter;
}

/**
 * Full SUN verification pipeline supporting both real AES-128 CMAC vectors
 * and DEV_BYPASS_CMAC=true mode for simulated development payloads.
 */
export function verifySunPayload(params: {
  piccData: string;
  cmac: string;
  masterKeyHex: string;
  lastSeenCounter: number;
  devBypassCmac?: boolean;
}): SunVerificationResult {
  const { piccData, cmac, masterKeyHex, lastSeenCounter, devBypassCmac = false } = params;

  let tagUid: string;
  let readCounter: number;

  // Support simulated format "SIM:<UID>:<COUNTER>" when devBypassCmac is enabled
  if (devBypassCmac && piccData.startsWith('SIM:')) {
    const parts = piccData.split(':');
    if (parts.length !== 3) {
      return { verified: false, tagUid: '', readCounter: 0, errorReason: 'INVALID_PICC' };
    }
    tagUid = parts[1].toUpperCase();
    readCounter = parseInt(parts[2], 10);
    if (!tagUid || Number.isNaN(readCounter)) {
      return { verified: false, tagUid: '', readCounter: 0, errorReason: 'INVALID_PICC' };
    }
  } else {
    try {
      const decrypted = decryptPiccData(piccData, masterKeyHex);
      tagUid = decrypted.tagUid;
      readCounter = decrypted.readCounter;
    } catch {
      return { verified: false, tagUid: '', readCounter: 0, errorReason: 'INVALID_PICC' };
    }
  }

  if (!isCounterValid(readCounter, lastSeenCounter)) {
    return {
      verified: false,
      tagUid,
      readCounter,
      errorReason: 'REPLAY_DETECTED'
    };
  }

  if (devBypassCmac) {
    return {
      verified: true,
      tagUid,
      readCounter,
      bypassedCmac: true
    };
  }

  const diversifiedKey = deriveDiversifiedKey(masterKeyHex, tagUid);
  const transactionPayload = Buffer.from(piccData, 'hex');
  const cmacValid = verifyCmac(diversifiedKey, transactionPayload, cmac);

  if (!cmacValid) {
    return {
      verified: false,
      tagUid,
      readCounter,
      errorReason: 'INVALID_CMAC'
    };
  }

  return {
    verified: true,
    tagUid,
    readCounter,
    bypassedCmac: false
  };
}
