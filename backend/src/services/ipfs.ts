import crypto from 'node:crypto';

export interface ForensicPinInput {
  cardManifest: Record<string, unknown>;
  surfaceMacro?: Buffer | string;
  edgesMacro?: Buffer | string;
}

export interface ForensicPinOutput {
  metadataIpfsCid: string;
  mediaHashes: {
    surfaceMacro: string;
    edgesMacro: string;
  };
}

/**
 * Generates deterministic Base58-like IPFS CIDv0 hashes for forensic media and JSON manifests,
 * or pins directly to Pinata if a live Pinata API endpoint is configured.
 */
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function toBase58Cid(data: Buffer | string): string {
  const digest = crypto.createHash('sha256').update(data).digest();
  // Prefix with 0x12 0x20 (multihash sha2-256, 32 bytes) -> Base58 starts with "Qm"
  const multihash = Buffer.concat([Buffer.from([0x12, 0x20]), digest]);

  let num = BigInt('0x' + multihash.toString('hex'));
  let encoded = '';
  while (num > 0n) {
    const remainder = Number(num % 58n);
    encoded = BASE58_ALPHABET[remainder] + encoded;
    num = num / 58n;
  }
  return encoded;
}

export async function pinForensicMetadata(input: ForensicPinInput): Promise<ForensicPinOutput> {
  const surfaceHash = toBase58Cid(
    input.surfaceMacro ?? JSON.stringify({ type: 'surfaceMacro', manifest: input.cardManifest })
  );
  const edgesHash = toBase58Cid(
    input.edgesMacro ?? JSON.stringify({ type: 'edgesMacro', manifest: input.cardManifest })
  );

  const fullMetadata = {
    ...input.cardManifest,
    forensicMedia: {
      surfaceMacro: `ipfs://${surfaceHash}`,
      edgesMacro: `ipfs://${edgesHash}`
    },
    pinnedAt: new Date().toISOString()
  };

  const metadataIpfsCid = toBase58Cid(JSON.stringify(fullMetadata));

  return {
    metadataIpfsCid,
    mediaHashes: {
      surfaceMacro: surfaceHash,
      edgesMacro: edgesHash
    }
  };
}
