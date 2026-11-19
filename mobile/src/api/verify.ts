import type { OnChainItemState } from '../abi/SlabRegistry';
import type { VerifiedCertificateData } from '../components/CertificateInspectionView';
import type { DemoTriggerScenario } from '../components/DevDemoBottomSheet';
import {
  mockVerify,
  SLABS,
  type SlabItem,
  type VerifyResult
} from '../data/demo';
import { buildDemoTapPayload, type ParsedSunUrl } from '../nfc/sunReader';
import { getStateTone } from '../theme/tokens';
import { readSlabFromChain } from '../web3/client';

declare const process: {
  env: Record<string, string | undefined>;
};

export const API_BASE_URL =
  (typeof process !== 'undefined' &&
    process.env &&
    process.env.EXPO_PUBLIC_API_BASE_URL) ||
  'http://localhost:4000';

export interface VerifyTapOptions {
  live: boolean;
  clientAddress?: string;
}

export interface LiveBackendSlabRecord {
  tokenId: number;
  certId: string;
  tagUid: string;
  issuerId: string;
  cardName: string;
  cardSet: string;
  overallGrade: number;
  centeringGrade: number;
  surfaceGrade: number;
  cornersGrade: number;
  edgesGrade: number;
  currentState: OnChainItemState;
  ipfsMetadataCid: string;
  currentOwnerWallet: string;
  nonce: number;
  lastCounter: number;
}

function enrichSlabItem(cert: VerifiedCertificateData): SlabItem {
  const existing =
    SLABS.find(
      (s) =>
        s.tagUid.toUpperCase() === cert.tagUid.toUpperCase() ||
        s.tokenId === cert.tokenId
    ) ?? SLABS[0];

  const toneSpec = getStateTone(cert.onChainState);

  return {
    ...existing,
    ...cert,
    demo: false,
    tone: toneSpec.tone,
    checked: 'Just now',
    stateNote:
      cert.onChainState === 'SEALED'
        ? `Chip counter #${cert.readCounter} matched the on-chain record.`
        : toneSpec.description
  };
}

/**
 * Refreshes the slabs already in the session from the SlabLock relay
 * (`GET /api/v1/slabs`): live read counters and owners. It never adds slabs
 * the user has not scanned, because the app only knows a slab once it is tapped.
 */
export async function fetchLiveSlabs(current: SlabItem[]): Promise<{
  slabs: SlabItem[];
  online: boolean;
}> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2500);

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/slabs`, {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const json = (await response.json()) as {
      success: boolean;
      data?: LiveBackendSlabRecord[];
    };

    if (!json.success || !Array.isArray(json.data)) {
      throw new Error('Malformed slabs response');
    }

    const merged: SlabItem[] = current.map((base) => {
      const liveRec = json.data?.find(
        (r) =>
          r.tagUid.toUpperCase() === base.tagUid.toUpperCase() ||
          r.tokenId === base.tokenId
      );
      if (!liveRec) return base;
      return {
        ...base,
        readCounter:
          liveRec.lastCounter > 0 ? liveRec.lastCounter : base.readCounter,
        ownerAddress: liveRec.currentOwnerWallet || base.ownerAddress
      };
    });

    return { slabs: merged, online: true };
  } catch {
    clearTimeout(timeoutId);
    return { slabs: current, online: false };
  }
}

/**
 * Verifies an NFC tap or demo scenario.
 * When `live` is true, POSTs to `${API_BASE_URL}/api/v1/nfc/verify` with a 4 s timeout.
 * On network/timeout failure, falls back cleanly to `mockVerify` and sets `usedFallback: true`.
 */
export async function verifyTap(
  scenarioOrPayload: DemoTriggerScenario | ParsedSunUrl,
  options: VerifyTapOptions
): Promise<VerifyResult> {
  const payload: ParsedSunUrl =
    typeof scenarioOrPayload === 'string'
      ? buildDemoTapPayload(scenarioOrPayload)
      : scenarioOrPayload;

  if (!options.live) {
    return mockVerify(scenarioOrPayload);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/nfc/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        piccData: payload.piccData,
        cmac: payload.cmac,
        clientAddress:
          options.clientAddress || '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const json = (await response.json()) as {
      success: boolean;
      data?: VerifiedCertificateData;
      error?: { code: string; message: string };
    };

    if (!response.ok || !json.success || !json.data) {
      if (!json.error?.code) {
        throw new Error('Invalid relay response');
      }
      return {
        isError: true,
        code: json.error.code,
        message:
          json.error.message ||
          'Read counter 1 is less than or equal to last authenticated counter (5).'
      };
    }

    const relayData = json.data;
    const onChainRecord = await readSlabFromChain(
      relayData.tokenId,
      relayData.onChainState as OnChainItemState
    );

    const merged: VerifiedCertificateData = {
      ...relayData,
      onChainState: onChainRecord?.currentState ?? relayData.onChainState,
      ownerAddress: onChainRecord?.owner ?? relayData.ownerAddress,
      issuerAddress: onChainRecord?.issuer ?? relayData.issuerAddress
    };

    return {
      isError: false,
      data: enrichSlabItem(merged),
      usedFallback: false
    };
  } catch {
    clearTimeout(timeoutId);
    const fallback = mockVerify(scenarioOrPayload);
    return {
      ...fallback,
      usedFallback: true
    };
  }
}
