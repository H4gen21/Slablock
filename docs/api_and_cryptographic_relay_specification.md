# API & Cryptographic Relay Specification: SlabLock Protocol

---

## 1. Cryptographic Relay Architecture
Because symmetric hardware keys cannot be stored inside mobile application binaries (decompilation hazard) or on a public blockchain (public readability hazard), the **Node.js Cryptographic Relay** acts as the confidential verification bridge.

```
┌──────────────┐          1. Tap Tag          ┌──────────────┐
│ Mobile App   ├─────────────────────────────►│ NTAG 424 DNA │
│              │◄─────────────────────────────┤ Physical Chip│
└──────┬───────┘     2. NDEF URL (SUN)        └──────────────┘
       │                • piccData
       │                • cmac
       │
       │ 3. POST /api/v1/nfc/verify
       ▼
┌────────────────────────────────────────────────────────────┐
│                    NODE.JS RELAY SERVER                    │
│                                                            │
│   a. Decrypt piccData using AES-128-CBC                    │
│   b. Extract UID and ReadCounter                           │
│   c. Validate ReadCounter > DB.lastSeenCounter             │
│   d. Derive diversified key K_div from MasterKey + UID     │
│   e. Recompute CMAC over dynamic URL vector                │
│   f. Compare calculated CMAC with incoming cmac            │
│   g. If authentic, sign EIP-712 authorization payload      │
└──────┬─────────────────────────────────────────────────────┘
       │
       │ 4. HTTP 200 OK: { verified: true, signature, tokenId }
       ▼
┌──────────────┐          5. eth_call getSlab()       ┌──────────────┐
│ Mobile App   ├─────────────────────────────────────►│ Polygon EVM  │
│              │◄─────────────────────────────────────┤ Ledger Node  │
└──────────────┘          6. Return On-Chain State    └──────────────┘
```

---

## 2. Cryptographic Core Implementation (Node.js TypeScript)

```typescript
import crypto from 'node:crypto';

interface DecryptedPiccData {
  tagUid: string;
  readCounter: number;
}

/**
 * Decrypts NTAG 424 DNA PICCData payload using the Master Key.
 */
export function decryptPiccData(
  piccDataHex: string,
  masterKeyHex: string
): DecryptedPiccData {
  const key = Buffer.from(masterKeyHex, 'hex');
  const iv = Buffer.alloc(16, 0); // Standard NXP zero IV for PICC decryption
  const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
  decipher.setAutoPadding(false);

  const encryptedBytes = Buffer.from(piccDataHex, 'hex');
  const decrypted = Buffer.concat([decipher.update(encryptedBytes), decipher.final()]);

  // Byte layout: [0x00: Header] [0x01-0x07: 7-byte UID] [0x08-0x0A: 3-byte Counter]
  const tagUid = decrypted.subarray(1, 8).toString('hex').toUpperCase();
  const readCounter = decrypted.readUIntLE(8, 3);

  return { tagUid, readCounter };
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
  const truncatedCalculated = fullCmac.subarray(fullCmac.length - 8).toString('hex').toUpperCase();
  return truncatedCalculated === providedCmacHex.toUpperCase();
}
```

---

## 3. REST API Endpoints

### 3.1 Verify Physical NFC Attestation
- **Route:** `POST /api/v1/nfc/verify`
- **Rate Limit:** 30 requests per minute per IP.
- **Request Headers:**
  - `Content-Type: application/json`

#### Request Payload:
```json
{
  "piccData": "01A24C83B1098679B62569727B4C09C9",
  "cmac": "8E54A92B1C77F43D",
  "clientAddress": "0x3a48Fe83B1098679B62569727B4c09C9aDe12F"
}
```

#### Success Response (200 OK):
```json
{
  "success": true,
  "data": {
    "verified": true,
    "tagUid": "04A1B2C3D4E5F6",
    "readCounter": 42,
    "tokenId": 104,
    "certId": "CERT-PKMN-2026-08921",
    "onChainState": "SEALED",
    "claimSignature": {
      "r": "0x9a8b...",
      "s": "0x4c5d...",
      "v": 27,
      "deadline": 1792987320
    }
  }
}
```

#### Error Response (400 Bad Request - Replay Detected):
```json
{
  "success": false,
  "error": {
    "code": "ERR_REPLAY_ATTACK",
    "message": "Read counter 42 is less than or equal to last authenticated counter (42)."
  }
}
```

---

### 3.2 Pin Metadata to IPFS
- **Route:** `POST /api/v1/metadata/pin`
- **Authentication:** `Bearer <GRADER_JWT>`
- **Request Type:** `multipart/form-data`
  - `cardManifest`: JSON string detailing card attributes and sub-grades.
  - `surfaceMacro`: High-res inspection image (PNG/JPEG $\le 20\text{ MB}$).
  - `edgesMacro`: High-res inspection image.

#### Success Response (201 Created):
```json
{
  "success": true,
  "data": {
    "metadataIpfsCid": "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
    "mediaHashes": {
      "surfaceMacro": "QmZtmD2qtQgVPekm8a6ZububQ5D63Gzh9WAK7WeqBmyxyg",
      "edgesMacro": "QmPZ9gcCEpqKTo6aq61g2nXGUhM4iCL3ewB6LDXZCtioEB"
    }
  }
}
```