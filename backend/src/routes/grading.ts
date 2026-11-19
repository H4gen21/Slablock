import type { FastifyInstance } from 'fastify';
import { deriveDiversifiedKey } from '../crypto/sun.js';
import type { SlabLockStore } from '../services/db.js';
import { pinForensicMetadata } from '../services/ipfs.js';

interface EncapsulateRequestBody {
  certId: string;
  tagUid: string;
  cardName: string;
  cardSet: string;
  overallGrade: number;
  subGrades: {
    centering: number;
    surface: number;
    corners: number;
    edges: number;
  };
  recipientWallet?: string;
  surfaceMacro?: string;
  edgesMacro?: string;
}

export async function registerGradingRoutes(
  app: FastifyInstance,
  deps: { store: SlabLockStore; masterKeyHex?: string }
) {
  const masterKeyHex =
    deps.masterKeyHex ??
    process.env.NTAG_MASTER_KEY ??
    '00112233445566778899AABBCCDDEEFF';

  app.post<{ Body: EncapsulateRequestBody }>(
    '/api/v1/grading/encapsulate',
    async (request, reply) => {
      const body = request.body || ({} as EncapsulateRequestBody);
      const {
        certId,
        tagUid,
        cardName,
        cardSet,
        overallGrade,
        subGrades,
        recipientWallet = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        surfaceMacro,
        edgesMacro
      } = body;

      if (!certId || !tagUid || !cardName || !cardSet || overallGrade === undefined || !subGrades) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'ERR_MISSING_GRADING_FIELDS',
            message: 'certId, tagUid, cardName, cardSet, overallGrade, and subGrades are required.'
          }
        });
      }

      if (
        overallGrade < 1.0 ||
        overallGrade > 10.0 ||
        subGrades.centering < 1.0 ||
        subGrades.centering > 10.0 ||
        subGrades.surface < 1.0 ||
        subGrades.surface > 10.0 ||
        subGrades.corners < 1.0 ||
        subGrades.corners > 10.0 ||
        subGrades.edges < 1.0 ||
        subGrades.edges > 10.0
      ) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'ERR_INVALID_GRADE_RANGE',
            message: 'All grades must be normalized between 1.0 and 10.0.'
          }
        });
      }

      const normalizedUid = tagUid.toUpperCase();
      let diversifiedKeyHex: string;
      try {
        diversifiedKeyHex = deriveDiversifiedKey(masterKeyHex, normalizedUid)
          .toString('hex')
          .toUpperCase();
      } catch {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'ERR_INVALID_TAG_UID',
            message: 'tagUid must be a valid hex string.'
          }
        });
      }

      const pinned = await pinForensicMetadata({
        cardManifest: {
          certId,
          tagUid: normalizedUid,
          cardName,
          cardSet,
          overallGrade,
          subGrades
        },
        surfaceMacro,
        edgesMacro
      });

      try {
        const slab = deps.store.createEncapsulatedSlab({
          certId,
          tagUid: normalizedUid,
          diversifiedKey: diversifiedKeyHex,
          cardName,
          cardSet,
          overallGrade,
          centeringGrade: subGrades.centering,
          surfaceGrade: subGrades.surface,
          cornersGrade: subGrades.corners,
          edgesGrade: subGrades.edges,
          ipfsMetadataCid: pinned.metadataIpfsCid,
          recipientWallet
        });

        return reply.status(201).send({
          success: true,
          data: {
            tokenId: slab.tokenId,
            certId: slab.certId,
            tagUid: slab.tagUid,
            onChainState: slab.currentState,
            overallGrade: slab.overallGrade,
            subGrades,
            metadataIpfsCid: pinned.metadataIpfsCid,
            mediaHashes: pinned.mediaHashes
          }
        });
      } catch (err) {
        const code = err instanceof Error ? err.message : 'ERR_ENCAPSULATION_FAILED';
        return reply.status(409).send({
          success: false,
          error: {
            code,
            message: 'Certificate ID or physical hardware tag UID is already registered.'
          }
        });
      }
    }
  );

  // Also register POST /api/v1/metadata/pin from docs/04_API_AND_CRYPTO_SPEC.md
  app.post<{
    Body: {
      cardManifest?: Record<string, unknown> | string;
      surfaceMacro?: string;
      edgesMacro?: string;
    };
  }>('/api/v1/metadata/pin', async (request, reply) => {
    const rawManifest = request.body?.cardManifest;
    const manifest =
      typeof rawManifest === 'string'
        ? (JSON.parse(rawManifest) as Record<string, unknown>)
        : (rawManifest ?? {});

    const pinned = await pinForensicMetadata({
      cardManifest: manifest,
      surfaceMacro: request.body?.surfaceMacro,
      edgesMacro: request.body?.edgesMacro
    });

    return reply.status(201).send({
      success: true,
      data: pinned
    });
  });
}
