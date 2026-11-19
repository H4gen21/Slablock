import type { FastifyInstance } from 'fastify';
import { type Address, getAddress, isAddress } from 'viem';
import {
  decryptPiccData,
  deriveDiversifiedKey,
  isCounterValid,
  verifyCmac
} from '../crypto/sun.js';
import type { SlabLockStore } from '../services/db.js';
import type { RelayerSigner } from '../services/relayer.js';

interface VerifyRequestBody {
  piccData: string;
  cmac: string;
  clientAddress?: string;
}

export async function registerNfcRoutes(
  app: FastifyInstance,
  deps: { store: SlabLockStore; relayer: RelayerSigner; masterKeyHex?: string }
) {
  const masterKeyHex =
    deps.masterKeyHex ??
    process.env.NTAG_MASTER_KEY ??
    '00112233445566778899AABBCCDDEEFF';

  app.get('/api/v1/slabs', async (_request, reply) => {
    const records = deps.store.getAllSlabs();
    return reply.status(200).send({
      success: true,
      data: records
    });
  });

  app.post<{
    Params: { tokenId: string };
    Body: { walletAddress: string; txHash?: string };
  }>('/api/v1/slabs/:tokenId/claim', async (request, reply) => {
    const tokenId = Number(request.params.tokenId);
    const { walletAddress, txHash } = request.body || {};

    if (!walletAddress || !isAddress(walletAddress, { strict: false })) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'ERR_INVALID_WALLET',
          message: 'A valid EVM wallet address is required to claim custody.'
        }
      });
    }

    const updated = deps.store.updateSlabOwner(
      tokenId,
      getAddress(walletAddress.toLowerCase())
    );

    if (!updated) {
      return reply.status(404).send({
        success: false,
        error: {
          code: 'ERR_SLAB_NOT_FOUND',
          message: `Slab #${tokenId} not found.`
        }
      });
    }

    return reply.status(200).send({
      success: true,
      data: {
        tokenId: updated.tokenId,
        currentOwnerWallet: updated.currentOwnerWallet,
        currentState: updated.currentState,
        nonce: updated.nonce,
        txHash: txHash || null
      }
    });
  });

  app.post<{ Body: VerifyRequestBody }>(
    '/api/v1/nfc/verify',
    {
      config: {
        rateLimit: {
          max: 30,
          timeWindow: '1 minute'
        }
      }
    },
    async (request, reply) => {
      const { piccData, cmac, clientAddress } = request.body || {};

      if (!piccData || !cmac) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'ERR_INVALID_PAYLOAD',
            message: 'Both piccData and cmac are required.'
          }
        });
      }

      const devBypassCmac = process.env.DEV_BYPASS_CMAC === 'true';

      let tagUid: string;
      let readCounter: number;

      try {
        if (devBypassCmac && piccData.startsWith('SIM:')) {
          const [, uid, counterStr] = piccData.split(':');
          tagUid = uid.toUpperCase();
          readCounter = parseInt(counterStr, 10);
          if (!tagUid || Number.isNaN(readCounter)) {
            throw new Error('Malformed simulated PICCData');
          }
        } else {
          const decrypted = decryptPiccData(piccData, masterKeyHex);
          tagUid = decrypted.tagUid;
          readCounter = decrypted.readCounter;
        }
      } catch {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'ERR_PICC_DECRYPTION_FAILED',
            message: 'Unable to decrypt PICCData payload.'
          }
        });
      }

      const tagRecord = deps.store.getTagByUid(tagUid);
      const slabRecord = deps.store.getSlabByTagUid(tagUid);

      if (!tagRecord || !slabRecord) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'ERR_TAG_NOT_REGISTERED',
            message: `Hardware tag UID ${tagUid} is not registered in SlabLock.`
          }
        });
      }

      if (
        devBypassCmac &&
        piccData.startsWith('SIM:') &&
        readCounter > 1 &&
        readCounter <= tagRecord.lastCounter
      ) {
        readCounter = tagRecord.lastCounter + 1;
      }

      if (!isCounterValid(readCounter, tagRecord.lastCounter)) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'ERR_REPLAY_ATTACK',
            message: `Read counter ${readCounter} is less than or equal to last authenticated counter (${tagRecord.lastCounter}).`
          }
        });
      }

      if (!devBypassCmac) {
        const diversifiedKey = deriveDiversifiedKey(masterKeyHex, tagUid);
        const transactionPayload = Buffer.from(piccData, 'hex');
        const isCmacValid = verifyCmac(diversifiedKey, transactionPayload, cmac);

        if (!isCmacValid) {
          return reply.status(401).send({
            success: false,
            error: {
              code: 'ERR_INVALID_CMAC',
              message: 'Cryptographic CMAC signature verification failed.'
            }
          });
        }
      }

      const resolvedClient: Address =
        clientAddress && isAddress(clientAddress, { strict: false })
          ? getAddress(clientAddress.toLowerCase())
          : getAddress(slabRecord.currentOwnerWallet.toLowerCase());

      const currentNonce = slabRecord.nonce;
      const deadline = Math.floor(Date.now() / 1000) + 120;

      const claimSig = await deps.relayer.signCustodyTransfer({
        tokenId: slabRecord.tokenId,
        to: resolvedClient,
        nonce: currentNonce,
        deadline
      });

      const nfcAttestationSig = await deps.relayer.signNfcAttestation({
        tokenId: slabRecord.tokenId,
        hardwareUid: tagUid,
        readCounter,
        clientAddress: resolvedClient,
        nonce: currentNonce,
        deadline
      });

      deps.store.updateTagCounter(tagUid, readCounter);

      return reply.status(200).send({
        success: true,
        data: {
          verified: true,
          tagUid,
          readCounter,
          tokenId: slabRecord.tokenId,
          certId: slabRecord.certId,
          cardName: slabRecord.cardName,
          cardSet: slabRecord.cardSet,
          overallGrade: slabRecord.overallGrade,
          subGrades: {
            centering: slabRecord.centeringGrade,
            surface: slabRecord.surfaceGrade,
            corners: slabRecord.cornersGrade,
            edges: slabRecord.edgesGrade
          },
          ipfsMetadataCid: slabRecord.ipfsMetadataCid,
          onChainState: slabRecord.currentState,
          ownerAddress: slabRecord.currentOwnerWallet,
          claimSignature: {
            r: claimSig.r,
            s: claimSig.s,
            v: claimSig.v,
            signature: claimSig.signature,
            deadline: claimSig.deadline
          },
          nfcAttestationSignature: {
            r: nfcAttestationSig.r,
            s: nfcAttestationSig.s,
            v: nfcAttestationSig.v,
            signature: nfcAttestationSig.signature,
            deadline: nfcAttestationSig.deadline
          }
        }
      });
    }
  );
}
