import {
  type Address,
  type Hex,
  encodePacked,
  keccak256,
  parseSignature
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

export const SLAB_REGISTRY_ABI = [
  {
    type: 'function',
    name: 'mintSlab',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'certId', type: 'string' },
      { name: 'hardwareUid', type: 'string' },
      { name: 'overallGrade', type: 'uint8' },
      {
        name: 'subGrades',
        type: 'tuple',
        components: [
          { name: 'centering', type: 'uint8' },
          { name: 'surface', type: 'uint8' },
          { name: 'corners', type: 'uint8' },
          { name: 'edges', type: 'uint8' }
        ]
      },
      { name: 'metadataURI', type: 'string' }
    ],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    type: 'function',
    name: 'getSlab',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'certIdHash', type: 'bytes32' },
          { name: 'hardwareUidHash', type: 'bytes32' },
          { name: 'overallGrade', type: 'uint8' },
          {
            name: 'subGrades',
            type: 'tuple',
            components: [
              { name: 'centering', type: 'uint8' },
              { name: 'surface', type: 'uint8' },
              { name: 'corners', type: 'uint8' },
              { name: 'edges', type: 'uint8' }
            ]
          },
          { name: 'currentState', type: 'uint8' },
          { name: 'issuer', type: 'address' },
          { name: 'metadataURI', type: 'string' },
          { name: 'mintedTimestamp', type: 'uint64' },
          { name: 'stateUpdatedTimestamp', type: 'uint64' }
        ]
      }
    ]
  },
  {
    type: 'function',
    name: 'claimCustodyWithAttestation',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' },
      { name: 'signature', type: 'bytes' }
    ],
    outputs: []
  },
  {
    type: 'function',
    name: 'verifyNfcAttestation',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'hardwareUid', type: 'string' },
      { name: 'readCounter', type: 'uint256' },
      { name: 'clientAddress', type: 'address' },
      { name: 'deadline', type: 'uint256' },
      { name: 'signature', type: 'bytes' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  }
] as const;

export const EIP712_TYPES = {
  CustodyTransfer: [
    { name: 'tokenId', type: 'uint256' },
    { name: 'to', type: 'address' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' }
  ],
  NfcAttestation: [
    { name: 'tokenId', type: 'uint256' },
    { name: 'hardwareUidHash', type: 'bytes32' },
    { name: 'readCounter', type: 'uint256' },
    { name: 'clientAddress', type: 'address' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' }
  ]
} as const;

export interface SignedAttestation {
  r: Hex;
  s: Hex;
  v: number;
  signature: Hex;
  deadline: number;
  nonce: number;
  signer: Address;
}

export class RelayerSigner {
  private readonly privateKey: Hex;
  private readonly chainId: number;
  private readonly verifyingContract: Address;

  constructor(config?: {
    privateKey?: Hex;
    chainId?: number;
    verifyingContract?: Address;
  }) {
    this.privateKey =
      config?.privateKey ??
      ((process.env.RELAYER_PRIVATE_KEY as Hex) ||
        '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
    this.chainId = config?.chainId ?? Number(process.env.CHAIN_ID || 31337);
    this.verifyingContract =
      config?.verifyingContract ??
      ((process.env.SLAB_REGISTRY_ADDRESS as Address) ||
        '0x5FbDB2315678afecb367f032d93F642f64180aa3');
  }

  public getAccount() {
    return privateKeyToAccount(this.privateKey);
  }

  public getDomain() {
    return {
      name: 'SlabLock',
      version: '1',
      chainId: this.chainId,
      verifyingContract: this.verifyingContract
    } as const;
  }

  /**
   * Signs an EIP-712 CustodyTransfer payload matching SlabRegistry.CUSTODY_TRANSFER_TYPEHASH.
   */
  public async signCustodyTransfer(params: {
    tokenId: bigint | number;
    to: Address;
    nonce?: bigint | number;
    deadline?: number;
  }): Promise<SignedAttestation> {
    const account = this.getAccount();
    const deadline = params.deadline ?? Math.floor(Date.now() / 1000) + 120;
    const nonce = Number(params.nonce ?? 0);

    const signature = await account.signTypedData({
      domain: this.getDomain(),
      types: { CustodyTransfer: EIP712_TYPES.CustodyTransfer },
      primaryType: 'CustodyTransfer',
      message: {
        tokenId: BigInt(params.tokenId),
        to: params.to,
        nonce: BigInt(nonce),
        deadline: BigInt(deadline)
      }
    });

    const parsed = parseSignature(signature);
    return {
      r: parsed.r,
      s: parsed.s,
      v: Number(parsed.v ?? (parsed.yParity === 0 ? 27 : 28)),
      signature,
      deadline,
      nonce,
      signer: account.address
    };
  }

  /**
   * Signs an EIP-712 NfcAttestation payload matching SlabRegistry.NFC_ATTESTATION_TYPEHASH.
   */
  public async signNfcAttestation(params: {
    tokenId: bigint | number;
    hardwareUid: string;
    readCounter: number;
    clientAddress: Address;
    nonce?: bigint | number;
    deadline?: number;
  }): Promise<SignedAttestation> {
    const account = this.getAccount();
    const deadline = params.deadline ?? Math.floor(Date.now() / 1000) + 120;
    const nonce = Number(params.nonce ?? 0);
    const hardwareUidHash = keccak256(encodePacked(['string'], [params.hardwareUid]));

    const signature = await account.signTypedData({
      domain: this.getDomain(),
      types: { NfcAttestation: EIP712_TYPES.NfcAttestation },
      primaryType: 'NfcAttestation',
      message: {
        tokenId: BigInt(params.tokenId),
        hardwareUidHash,
        readCounter: BigInt(params.readCounter),
        clientAddress: params.clientAddress,
        nonce: BigInt(nonce),
        deadline: BigInt(deadline)
      }
    });

    const parsed = parseSignature(signature);
    return {
      r: parsed.r,
      s: parsed.s,
      v: Number(parsed.v ?? (parsed.yParity === 0 ? 27 : 28)),
      signature,
      deadline,
      nonce,
      signer: account.address
    };
  }
}
