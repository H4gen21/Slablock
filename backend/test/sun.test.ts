import { describe, it, expect } from 'vitest';
import {
  computeCmac,
  decryptPiccData,
  deriveDiversifiedKey,
  encryptPiccData,
  isCounterValid,
  verifyCmac,
  verifySunPayload
} from '../src/crypto/sun.js';

describe('NTAG 424 DNA Cryptographic Engine', () => {
  const MASTER_KEY = '00112233445566778899AABBCCDDEEFF';
  const KNOWN_UID = '04A1B2C3D4E5F6';

  it('should successfully derive a deterministic 16-byte diversified key', () => {
    const key1 = deriveDiversifiedKey(MASTER_KEY, KNOWN_UID);
    const key2 = deriveDiversifiedKey(MASTER_KEY, KNOWN_UID);

    expect(key1.length).toBe(16);
    expect(key1.toString('hex')).toBe(key2.toString('hex'));
  });

  it('should reject replay attacks where read counter does not increment', () => {
    const lastSeenCounter = 15;
    const incomingCounter = 15;

    const valid = isCounterValid(incomingCounter, lastSeenCounter);
    expect(valid).toBe(false);
    expect(isCounterValid(16, 15)).toBe(true);
  });

  it('should round-trip encrypt and decrypt PICCData with UID and 24-bit counter', () => {
    const piccHex = encryptPiccData(KNOWN_UID, 42, MASTER_KEY);
    const decrypted = decryptPiccData(piccHex, MASTER_KEY);

    expect(decrypted.tagUid).toBe(KNOWN_UID);
    expect(decrypted.readCounter).toBe(42);
  });

  it('should verify valid CMAC and reject tampered CMAC', () => {
    const piccHex = encryptPiccData(KNOWN_UID, 42, MASTER_KEY);
    const divKey = deriveDiversifiedKey(MASTER_KEY, KNOWN_UID);
    const payload = Buffer.from(piccHex, 'hex');
    const validCmac = computeCmac(divKey, payload);

    expect(verifyCmac(divKey, payload, validCmac)).toBe(true);
    expect(verifyCmac(divKey, payload, '0000000000000000')).toBe(false);
  });

  it('should support DEV_BYPASS_CMAC for simulated development payloads', () => {
    const result = verifySunPayload({
      piccData: 'SIM:04A1B2C3D4E501:7',
      cmac: 'BYPASS',
      masterKeyHex: MASTER_KEY,
      lastSeenCounter: 5,
      devBypassCmac: true
    });

    expect(result.verified).toBe(true);
    expect(result.tagUid).toBe('04A1B2C3D4E501');
    expect(result.readCounter).toBe(7);
    expect(result.bypassedCmac).toBe(true);
  });
});
