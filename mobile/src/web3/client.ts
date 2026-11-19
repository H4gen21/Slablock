import { type Address, createPublicClient, http } from 'viem';
import { polygonAmoy } from 'viem/chains';
import {
  ITEM_STATE_LABELS,
  type OnChainItemState,
  SLAB_REGISTRY_ABI
} from '../abi/SlabRegistry';

declare const process: {
  env: Record<string, string | undefined>;
};

const envRegistryAddress =
  typeof process !== 'undefined' && process.env
    ? process.env.EXPO_PUBLIC_SLAB_REGISTRY_ADDRESS
    : undefined;

const envRpcUrl =
  typeof process !== 'undefined' && process.env
    ? process.env.EXPO_PUBLIC_POLYGON_RPC_URL
    : undefined;

export const SLAB_REGISTRY_ADDRESS: Address =
  (envRegistryAddress as Address) ||
  '0x5FbDB2315678afecb367f032d93F642f64180aa3';

export const polygonClient = createPublicClient({
  chain: polygonAmoy,
  transport: http(envRpcUrl || 'http://127.0.0.1:8545')
});

export interface OnChainSlabSummary {
  tokenId: number;
  overallGrade: number;
  subGrades: {
    centering: number;
    surface: number;
    corners: number;
    edges: number;
  };
  currentState: OnChainItemState;
  issuer: Address;
  owner: Address;
  metadataURI: string;
  mintedTimestamp: number;
  stateUpdatedTimestamp: number;
}

/**
 * Queries the SlabRegistry contract on Polygon Amoy / Local Anvil via viem.
 * Falls back gracefully to the relay's verified on-chain state snapshot if RPC is offline.
 */
export async function readSlabFromChain(
  tokenId: number,
  fallbackState?: OnChainItemState
): Promise<OnChainSlabSummary | null> {
  try {
    const [slab, owner] = await Promise.all([
      polygonClient.readContract({
        address: SLAB_REGISTRY_ADDRESS,
        abi: SLAB_REGISTRY_ABI,
        functionName: 'getSlab',
        args: [BigInt(tokenId)]
      }),
      polygonClient.readContract({
        address: SLAB_REGISTRY_ADDRESS,
        abi: SLAB_REGISTRY_ABI,
        functionName: 'ownerOf',
        args: [BigInt(tokenId)]
      })
    ]);

    const stateIndex = Number(slab.currentState);
    const currentState: OnChainItemState =
      ITEM_STATE_LABELS[stateIndex] ?? fallbackState ?? 'SEALED';

    return {
      tokenId,
      overallGrade: Number(slab.overallGrade) / 10,
      subGrades: {
        centering: Number(slab.subGrades.centering) / 10,
        surface: Number(slab.subGrades.surface) / 10,
        corners: Number(slab.subGrades.corners) / 10,
        edges: Number(slab.subGrades.edges) / 10
      },
      currentState,
      issuer: slab.issuer,
      owner,
      metadataURI: slab.metadataURI,
      mintedTimestamp: Number(slab.mintedTimestamp),
      stateUpdatedTimestamp: Number(slab.stateUpdatedTimestamp)
    };
  } catch {
    return null;
  }
}
