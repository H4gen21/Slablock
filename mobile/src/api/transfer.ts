import type { SlabItem } from '../data/demo';
import type { ParsedSunUrl } from '../nfc/sunReader';

/** Custody transfers must be finished by a recipient tap within this window. */
export const TRANSFER_WINDOW_SECONDS = 120;

export type TransferStatus = 'PENDING' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';

export interface TransferRecord {
  id: string;
  slabKey: string;
  /** Current owner wallet. */
  from: string;
  /** Recipient wallet. */
  to: string;
  /** Epoch milliseconds. */
  startedAt: number;
  /** Epoch milliseconds; startedAt + 120 s. */
  deadline: number;
  status: TransferStatus;
  /** Display name, kept so a persisted transfer still reads well after reload. */
  slabShort?: string;
  /** Tag the recipient must tap. */
  tagUid?: string;
}

export interface TransferConfirmation {
  newOwner: string;
  txHash: string;
}

function randomHex(length: number): string {
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += Math.floor(Math.random() * 16).toString(16);
  }
  return out;
}

/**
 * Starts a custody transfer: the slab moves to IN_TRANSIT and the recipient has
 * TRANSFER_WINDOW_SECONDS to tap it.
 *
 * Mocked for now.
 * TODO: call the real `POST /api/v1/custody/transfer` endpoint with
 *   { tokenId, to } and have the relayer return the EIP-712 `CustodyTransfer`
 *   signature (tokenId, to, nonce, deadline) from
 *   `backend/src/services/relayer.ts#signCustodyTransfer`. Use its `deadline`
 *   instead of the local clock.
 */
export async function startTransfer(params: {
  slab: SlabItem;
  from: string;
  to: string;
}): Promise<TransferRecord> {
  const startedAt = Date.now();
  return {
    id: `trf_${startedAt}_${randomHex(4)}`,
    slabKey: params.slab.key,
    from: params.from,
    to: params.to,
    startedAt,
    deadline: startedAt + TRANSFER_WINDOW_SECONDS * 1000,
    status: 'PENDING',
    slabShort: params.slab.short,
    tagUid: params.slab.tagUid
  };
}

/**
 * Confirms the recipient's tap. `payload` uses the same SUN format as
 * `verifyTap` (picc_data + cmac read from the NTAG 424 DNA chip).
 *
 * Mocked for now: accepts any payload for the right tag inside the window.
 * TODO: send `{ piccData, cmac, transferId }` to
 *   `POST /api/v1/custody/transfer` (confirm step) so the relayer checks the
 *   SUN CMAC and submits the signed `CustodyTransfer` on-chain, then return
 *   the real new owner and transaction hash.
 */
export async function confirmRecipientTap(
  payload: ParsedSunUrl,
  transfer: TransferRecord
): Promise<TransferConfirmation> {
  if (transfer.status !== 'PENDING') {
    throw new Error('This transfer is no longer pending.');
  }
  if (Date.now() > transfer.deadline) {
    throw new Error('The 120 s transfer window has closed.');
  }
  if (
    transfer.tagUid &&
    payload.piccData.startsWith('SIM:') &&
    !payload.piccData.toUpperCase().includes(transfer.tagUid.toUpperCase())
  ) {
    throw new Error('That tap came from a different slab.');
  }
  await new Promise((r) => setTimeout(r, 700));
  return {
    newOwner: transfer.to,
    txHash: `0x${randomHex(64)}`
  };
}

/**
 * Cancels a pending transfer. The slab stays with the original owner.
 * TODO: call the relayer to invalidate the pending `CustodyTransfer` nonce.
 */
export async function cancelTransfer(transfer: TransferRecord): Promise<void> {
  if (transfer.status !== 'PENDING') {
    throw new Error('This transfer is no longer pending.');
  }
}

let simulatedCounter = 100;

/** Demo-only SUN payload standing in for the recipient's phone tap. */
export function buildSimulatedRecipientTap(tagUid: string): ParsedSunUrl {
  simulatedCounter += 1;
  const piccData = `SIM:${tagUid.toUpperCase()}:${simulatedCounter}`;
  const cmac = randomHex(16).toUpperCase();
  return {
    piccData,
    cmac,
    rawUrl: `https://verify.slablock.io/tap?picc_data=${piccData}&cmac=${cmac}`
  };
}
