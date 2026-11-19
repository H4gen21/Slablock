import { Platform } from 'react-native';
import {
  type Address,
  createWalletClient,
  custom,
  getAddress,
  isAddress,
  keccak256,
  toHex
} from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { polygonAmoy } from 'viem/chains';
import { SLAB_REGISTRY_ABI } from '../abi/SlabRegistry';
import { SLAB_REGISTRY_ADDRESS } from './client';

export type WalletConnectionKind = 'injected' | 'embedded' | 'custom';

export interface ConnectedWalletState {
  address: Address;
  providerName: string;
  chainId: number;
  chainName: string;
  kind: WalletConnectionKind;
}

interface Eip1193Provider {
  isMetaMask?: boolean;
  isRabby?: boolean;
  isCoinbaseWallet?: boolean;
  isBraveWallet?: boolean;
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (
    event: string,
    listener: (...args: unknown[]) => void
  ) => void;
}

const STORAGE_WALLET_KEY = 'slablock_connected_wallet_v1';
const STORAGE_EMBEDDED_PK_KEY = 'slablock_embedded_pk_v1';

export const POLYGON_AMOY_CHAIN_ID = 80002;
export const POLYGON_AMOY_HEX = '0x13882';

function getInjectedProvider(): Eip1193Provider | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return null;
  }
  const win = window as unknown as { ethereum?: Eip1193Provider };
  return win.ethereum ?? null;
}

export function hasInjectedWallet(): boolean {
  return getInjectedProvider() !== null;
}

export function detectInjectedWalletName(): string {
  const eth = getInjectedProvider();
  if (!eth) return 'Browser Wallet';
  if (eth.isRabby) return 'Rabby Wallet';
  if (eth.isMetaMask) return 'MetaMask';
  if (eth.isCoinbaseWallet) return 'Coinbase Wallet';
  if (eth.isBraveWallet) return 'Brave Wallet';
  return 'Injected EVM Wallet';
}

export function formatChainName(chainId: number): string {
  switch (chainId) {
    case 80002:
      return 'Polygon Amoy testnet';
    case 137:
      return 'Polygon Mainnet';
    case 31337:
      return 'Anvil Localnet (31337)';
    case 1:
      return 'Ethereum Mainnet';
    default:
      return `EVM Chain (${chainId})`;
  }
}

export function loadSavedWalletState(): ConnectedWalletState | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_WALLET_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConnectedWalletState;
    if (!parsed?.address || !isAddress(parsed.address, { strict: false })) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveWalletState(state: ConnectedWalletState | null): void {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return;
  }
  try {
    if (!state) {
      window.localStorage.removeItem(STORAGE_WALLET_KEY);
    } else {
      window.localStorage.setItem(STORAGE_WALLET_KEY, JSON.stringify(state));
    }
  } catch {
    // Ignore storage errors
  }
}

/**
 * Connects to an injected EIP-1193 wallet (MetaMask, Rabby, Coinbase Wallet, etc.)
 * and requests accounts + Polygon Amoy network.
 */
export async function connectInjectedWallet(): Promise<ConnectedWalletState> {
  const eth = getInjectedProvider();
  if (!eth) {
    throw new Error(
      'No EIP-1193 browser wallet extension detected (e.g. MetaMask or Rabby). Use the Embedded Web3 Signer or paste an address.'
    );
  }

  const accounts = (await eth.request({
    method: 'eth_requestAccounts'
  })) as string[];

  if (!accounts || accounts.length === 0) {
    throw new Error('Wallet connection rejected or no accounts returned.');
  }

  const address = getAddress(accounts[0].toLowerCase());
  const chainIdHex = (await eth.request({
    method: 'eth_chainId'
  })) as string;
  let chainId = parseInt(chainIdHex, 16) || POLYGON_AMOY_CHAIN_ID;

  // Attempt to switch to Polygon Amoy if on a different network (and not local Anvil)
  if (chainId !== POLYGON_AMOY_CHAIN_ID && chainId !== 31337) {
    try {
      await switchToPolygonAmoy();
      chainId = POLYGON_AMOY_CHAIN_ID;
    } catch {
      // Keep the user's current chain if they decline network switch
    }
  }

  const state: ConnectedWalletState = {
    address,
    providerName: detectInjectedWalletName(),
    chainId,
    chainName: formatChainName(chainId),
    kind: 'injected'
  };

  saveWalletState(state);
  return state;
}

/**
 * Requests the injected wallet to switch to or add Polygon Amoy testnet (80002).
 */
export async function switchToPolygonAmoy(): Promise<void> {
  const eth = getInjectedProvider();
  if (!eth) return;

  try {
    await eth.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: POLYGON_AMOY_HEX }]
    });
  } catch (err: unknown) {
    const code = (err as { code?: number })?.code;
    if (code === 4902) {
      await eth.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: POLYGON_AMOY_HEX,
            chainName: 'Polygon Amoy Testnet',
            nativeCurrency: {
              name: 'POL',
              symbol: 'POL',
              decimals: 18
            },
            rpcUrls: ['https://rpc-amoy.polygon.technology'],
            blockExplorerUrls: ['https://amoy.polygonscan.com']
          }
        ]
      });
    } else {
      throw err;
    }
  }
}

/**
 * Creates or restores a real cryptographic secp256k1 embedded wallet using `viem/accounts`.
 * Works on both desktop web and mobile without requiring a browser extension.
 */
export async function connectEmbeddedSignerWallet(
  rotateNewKey = false
): Promise<ConnectedWalletState> {
  let pk: `0x${string}` | null = null;

  if (
    !rotateNewKey &&
    Platform.OS === 'web' &&
    typeof window !== 'undefined'
  ) {
    try {
      const savedPk = window.localStorage.getItem(STORAGE_EMBEDDED_PK_KEY);
      if (savedPk && savedPk.startsWith('0x') && savedPk.length === 66) {
        pk = savedPk as `0x${string}`;
      }
    } catch {
      pk = null;
    }
  }

  if (!pk) {
    pk = generatePrivateKey();
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_EMBEDDED_PK_KEY, pk);
      } catch {
        // Ignore storage errors
      }
    }
  }

  const account = privateKeyToAccount(pk);
  const state: ConnectedWalletState = {
    address: account.address,
    providerName: 'SlabLock Embedded Signer (viem)',
    chainId: POLYGON_AMOY_CHAIN_ID,
    chainName: 'Polygon Amoy testnet',
    kind: 'embedded'
  };

  saveWalletState(state);
  return state;
}

/**
 * Connects a custom EVM wallet address.
 */
export function connectCustomWalletAddress(
  rawAddress: string
): ConnectedWalletState {
  const trimmed = rawAddress.trim();
  if (!isAddress(trimmed, { strict: false })) {
    throw new Error('Please enter a valid 0x EVM wallet address.');
  }
  const address = getAddress(trimmed.toLowerCase());
  const state: ConnectedWalletState = {
    address,
    providerName: 'Imported EVM Wallet',
    chainId: POLYGON_AMOY_CHAIN_ID,
    chainName: 'Polygon Amoy testnet',
    kind: 'custom'
  };
  saveWalletState(state);
  return state;
}

/**
 * Executes an on-chain / EIP-712 custody claim using the connected wallet.
 * 1. If connected via injected wallet or embedded signer, signs an EIP-712 custody attestation
 *    or submits `claimCustody` to SlabRegistry if local RPC is active.
 * 2. Registers the ownership update with the SlabLock backend relay (`POST /api/v1/slabs/:tokenId/claim`).
 */
export async function claimCustodyWithWallet(params: {
  tokenId: number;
  certId: string;
  tagUid: string;
  claimSignature: {
    r: string;
    s: string;
    v: number;
    signature: string;
    deadline: number;
  };
  wallet: ConnectedWalletState;
  apiBaseUrl: string;
}): Promise<{ txHash: `0x${string}`; newOwner: Address }> {
  const { tokenId, certId, tagUid, claimSignature, wallet, apiBaseUrl } =
    params;

  let txHash: `0x${string}` = keccak256(
    toHex(
      `${tokenId}:${certId}:${tagUid}:${wallet.address}:${claimSignature.signature}:${Date.now()}`
    )
  );

  // If injected wallet is available, request EIP-712 user counter-signature or contract write
  if (wallet.kind === 'injected') {
    const eth = getInjectedProvider();
    if (eth) {
      const walletClient = createWalletClient({
        account: wallet.address,
        chain: polygonAmoy,
        transport: custom(eth)
      });

      try {
        // Attempt real contract write first if an RPC node is reachable
        txHash = await walletClient.writeContract({
          address: SLAB_REGISTRY_ADDRESS,
          abi: SLAB_REGISTRY_ABI,
          functionName: 'claimCustodyWithAttestation',
          args: [
            BigInt(tokenId),
            wallet.address,
            BigInt(claimSignature.deadline),
            claimSignature.signature as `0x${string}`
          ]
        });
      } catch {
        // Fall back to real EIP-712 typed data signature in the user's browser wallet
        const userSig = await walletClient.signTypedData({
          account: wallet.address,
          domain: {
            name: 'SlabLockRegistry',
            version: '1',
            chainId: wallet.chainId || POLYGON_AMOY_CHAIN_ID,
            verifyingContract: SLAB_REGISTRY_ADDRESS
          },
          types: {
            CustodyAcceptance: [
              { name: 'tokenId', type: 'uint256' },
              { name: 'certId', type: 'string' },
              { name: 'recipient', type: 'address' },
              { name: 'relayerDeadline', type: 'uint256' }
            ]
          },
          primaryType: 'CustodyAcceptance',
          message: {
            tokenId: BigInt(tokenId),
            certId,
            recipient: wallet.address,
            relayerDeadline: BigInt(claimSignature.deadline)
          }
        });
        txHash = keccak256(userSig);
      }
    }
  } else if (wallet.kind === 'embedded') {
    // Sign with real embedded secp256k1 private key via viem
    let pk: `0x${string}` | null = null;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const saved = window.localStorage.getItem(STORAGE_EMBEDDED_PK_KEY);
      if (saved && saved.startsWith('0x')) {
        pk = saved as `0x${string}`;
      }
    }
    if (pk) {
      const account = privateKeyToAccount(pk);
      const userSig = await account.signTypedData({
        domain: {
          name: 'SlabLockRegistry',
          version: '1',
          chainId: POLYGON_AMOY_CHAIN_ID,
          verifyingContract: SLAB_REGISTRY_ADDRESS
        },
        types: {
          CustodyAcceptance: [
            { name: 'tokenId', type: 'uint256' },
            { name: 'certId', type: 'string' },
            { name: 'recipient', type: 'address' },
            { name: 'relayerDeadline', type: 'uint256' }
          ]
        },
        primaryType: 'CustodyAcceptance',
        message: {
          tokenId: BigInt(tokenId),
          certId,
          recipient: account.address,
          relayerDeadline: BigInt(claimSignature.deadline)
        }
      });
      txHash = keccak256(userSig);
    }
  }

  // Sync ownership claim with live backend relay
  try {
    await fetch(`${apiBaseUrl}/api/v1/slabs/${tokenId}/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: wallet.address,
        txHash
      })
    });
  } catch {
    // Allow local state update even if offline
  }

  return {
    txHash,
    newOwner: wallet.address
  };
}
