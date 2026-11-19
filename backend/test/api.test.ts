import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { verifyTypedData } from 'viem';
import { buildApp } from '../src/app.js';
import { computeCmac, deriveDiversifiedKey, encryptPiccData } from '../src/crypto/sun.js';
import { EIP712_TYPES, RelayerSigner } from '../src/services/relayer.js';

describe('SlabLock Backend REST API & EIP-712 Relayer', () => {
  const MASTER_KEY = '00112233445566778899AABBCCDDEEFF';
  const CLIENT_ADDRESS = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

  beforeEach(() => {
    process.env.DEV_BYPASS_CMAC = 'false';
  });

  afterEach(() => {
    process.env.DEV_BYPASS_CMAC = 'false';
  });

  it('POST /api/v1/nfc/verify verifies real AES-128 SUN payload and signs EIP-712 claim', async () => {
    const relayer = new RelayerSigner();
    const app = await buildApp({ relayer, masterKeyHex: MASTER_KEY });

    const uid = '04A1B2C3D4E5F6';
    const counter = 42; // Seeded lastCounter is 41
    const piccData = encryptPiccData(uid, counter, MASTER_KEY);
    const divKey = deriveDiversifiedKey(MASTER_KEY, uid);
    const cmac = computeCmac(divKey, Buffer.from(piccData, 'hex'));

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/nfc/verify',
      payload: {
        piccData,
        cmac,
        clientAddress: CLIENT_ADDRESS
      }
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.verified).toBe(true);
    expect(body.data.tagUid).toBe(uid);
    expect(body.data.readCounter).toBe(42);
    expect(body.data.tokenId).toBe(104);
    expect(body.data.certId).toBe('CERT-PKMN-2026-08921');
    expect(body.data.onChainState).toBe('SEALED');

    // Verify EIP-712 signature matches SlabRegistry CustodyTransfer domain & types
    const isValidSig = await verifyTypedData({
      address: relayer.getAccount().address,
      domain: relayer.getDomain(),
      types: { CustodyTransfer: EIP712_TYPES.CustodyTransfer },
      primaryType: 'CustodyTransfer',
      message: {
        tokenId: 104n,
        to: CLIENT_ADDRESS,
        nonce: 0n,
        deadline: BigInt(body.data.claimSignature.deadline)
      },
      signature: body.data.claimSignature.signature
    });
    expect(isValidSig).toBe(true);

    // Replaying the exact same payload (counter = 42) must return 400 ERR_REPLAY_ATTACK
    const replayRes = await app.inject({
      method: 'POST',
      url: '/api/v1/nfc/verify',
      payload: {
        piccData,
        cmac,
        clientAddress: CLIENT_ADDRESS
      }
    });

    expect(replayRes.statusCode).toBe(400);
    expect(replayRes.json().error.code).toBe('ERR_REPLAY_ATTACK');
  });

  it('POST /api/v1/nfc/verify supports DEV_BYPASS_CMAC=true for simulated taps', async () => {
    process.env.DEV_BYPASS_CMAC = 'true';
    const app = await buildApp({ masterKeyHex: MASTER_KEY });

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/nfc/verify',
      payload: {
        piccData: 'SIM:04A1B2C3D4E501:1',
        cmac: 'DEV_BYPASS',
        clientAddress: CLIENT_ADDRESS
      }
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.tagUid).toBe('04A1B2C3D4E501');
    expect(body.data.tokenId).toBe(1);
    expect(body.data.onChainState).toBe('SEALED');
  });

  it('POST /api/v1/grading/encapsulate registers a new graded slab and pins IPFS CIDs', async () => {
    const app = await buildApp({ masterKeyHex: MASTER_KEY });

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/grading/encapsulate',
      payload: {
        certId: 'CERT-PKMN-2026-9999',
        tagUid: '04AABBCCDDEEFF',
        cardName: 'Shining Gyarados 1st Edition #65',
        cardSet: '2001 Pokemon Neo Revelation',
        overallGrade: 9.5,
        subGrades: {
          centering: 9.5,
          surface: 9.5,
          corners: 9.5,
          edges: 9.5
        },
        recipientWallet: CLIENT_ADDRESS
      }
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.certId).toBe('CERT-PKMN-2026-9999');
    expect(body.data.tagUid).toBe('04AABBCCDDEEFF');
    expect(body.data.onChainState).toBe('SEALED');
    expect(body.data.metadataIpfsCid).toMatch(/^Qm/);
    expect(body.data.mediaHashes.surfaceMacro).toMatch(/^Qm/);

    // Verify newly encapsulated tag can immediately be tapped & verified
    const piccData = encryptPiccData('04AABBCCDDEEFF', 1, MASTER_KEY);
    const divKey = deriveDiversifiedKey(MASTER_KEY, '04AABBCCDDEEFF');
    const cmac = computeCmac(divKey, Buffer.from(piccData, 'hex'));

    const verifyRes = await app.inject({
      method: 'POST',
      url: '/api/v1/nfc/verify',
      payload: {
        piccData,
        cmac,
        clientAddress: CLIENT_ADDRESS
      }
    });

    expect(verifyRes.statusCode).toBe(200);
    expect(verifyRes.json().data.certId).toBe('CERT-PKMN-2026-9999');
  });
});
