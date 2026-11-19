export const ITEM_STATE_LABELS = [
  'MINTED',
  'SEALED',
  'IN_TRANSIT',
  'UNSEALED',
  'VOID'
] as const;

export type OnChainItemState = (typeof ITEM_STATE_LABELS)[number];

/**
 * Extracted directly from ../contracts/out/SlabRegistry.sol/SlabRegistry.json
 */
export const SLAB_REGISTRY_ABI = [
  {
    type: 'constructor',
    inputs: [
      { name: 'admin', type: 'address', internalType: 'address' },
      { name: 'defaultRelayer', type: 'address', internalType: 'address' }
    ],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'CUSTODY_TRANSFER_TYPEHASH',
    inputs: [],
    outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'DEFAULT_ADMIN_ROLE',
    inputs: [],
    outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'GRADER_ROLE',
    inputs: [],
    outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'NFC_ATTESTATION_TYPEHASH',
    inputs: [],
    outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'RELAYER_ROLE',
    inputs: [],
    outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'cancelTransfer',
    inputs: [{ name: 'tokenId', type: 'uint256', internalType: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'certHashToTokenId',
    inputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'claimCustodyWithAttestation',
    inputs: [
      { name: 'tokenId', type: 'uint256', internalType: 'uint256' },
      { name: 'to', type: 'address', internalType: 'address' },
      { name: 'deadline', type: 'uint256', internalType: 'uint256' },
      { name: 'signature', type: 'bytes', internalType: 'bytes' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'domainSeparator',
    inputs: [],
    outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'flagUnsealed',
    inputs: [{ name: 'tokenId', type: 'uint256', internalType: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'flagVoid',
    inputs: [{ name: 'tokenId', type: 'uint256', internalType: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'getSlab',
    inputs: [{ name: 'tokenId', type: 'uint256', internalType: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        internalType: 'struct SlabRecord',
        components: [
          { name: 'certIdHash', type: 'bytes32', internalType: 'bytes32' },
          { name: 'hardwareUidHash', type: 'bytes32', internalType: 'bytes32' },
          { name: 'overallGrade', type: 'uint8', internalType: 'uint8' },
          {
            name: 'subGrades',
            type: 'tuple',
            internalType: 'struct SubGrades',
            components: [
              { name: 'centering', type: 'uint8', internalType: 'uint8' },
              { name: 'surface', type: 'uint8', internalType: 'uint8' },
              { name: 'corners', type: 'uint8', internalType: 'uint8' },
              { name: 'edges', type: 'uint8', internalType: 'uint8' }
            ]
          },
          { name: 'currentState', type: 'uint8', internalType: 'enum ItemState' },
          { name: 'issuer', type: 'address', internalType: 'address' },
          { name: 'metadataURI', type: 'string', internalType: 'string' },
          { name: 'mintedTimestamp', type: 'uint64', internalType: 'uint64' },
          { name: 'stateUpdatedTimestamp', type: 'uint64', internalType: 'uint64' }
        ]
      }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'hardwareHashToTokenId',
    inputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'initiateTransfer',
    inputs: [{ name: 'tokenId', type: 'uint256', internalType: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'lastReadCounters',
    inputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'mintSlab',
    inputs: [
      { name: 'recipient', type: 'address', internalType: 'address' },
      { name: 'certId', type: 'string', internalType: 'string' },
      { name: 'hardwareUid', type: 'string', internalType: 'string' },
      { name: 'overallGrade', type: 'uint8', internalType: 'uint8' },
      {
        name: 'subGrades',
        type: 'tuple',
        internalType: 'struct SubGrades',
        components: [
          { name: 'centering', type: 'uint8', internalType: 'uint8' },
          { name: 'surface', type: 'uint8', internalType: 'uint8' },
          { name: 'corners', type: 'uint8', internalType: 'uint8' },
          { name: 'edges', type: 'uint8', internalType: 'uint8' }
        ]
      },
      { name: 'metadataURI', type: 'string', internalType: 'string' }
    ],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'nonces',
    inputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'ownerOf',
    inputs: [{ name: 'tokenId', type: 'uint256', internalType: 'uint256' }],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'revokeSlab',
    inputs: [{ name: 'tokenId', type: 'uint256', internalType: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'tokenURI',
    inputs: [{ name: 'tokenId', type: 'uint256', internalType: 'uint256' }],
    outputs: [{ name: '', type: 'string', internalType: 'string' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'verifyNfcAttestation',
    inputs: [
      { name: 'tokenId', type: 'uint256', internalType: 'uint256' },
      { name: 'hardwareUid', type: 'string', internalType: 'string' },
      { name: 'readCounter', type: 'uint256', internalType: 'uint256' },
      { name: 'clientAddress', type: 'address', internalType: 'address' },
      { name: 'deadline', type: 'uint256', internalType: 'uint256' },
      { name: 'signature', type: 'bytes', internalType: 'bytes' }
    ],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'nonpayable'
  },
  {
    type: 'event',
    name: 'CustodyTransferred',
    inputs: [
      { name: 'tokenId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'previousOwner', type: 'address', indexed: true, internalType: 'address' },
      { name: 'newOwner', type: 'address', indexed: true, internalType: 'address' },
      { name: 'timestamp', type: 'uint64', indexed: false, internalType: 'uint64' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'SlabMinted',
    inputs: [
      { name: 'tokenId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'certIdHash', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'issuer', type: 'address', indexed: true, internalType: 'address' },
      { name: 'overallGrade', type: 'uint8', indexed: false, internalType: 'uint8' },
      { name: 'metadataURI', type: 'string', indexed: false, internalType: 'string' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'StateTransition',
    inputs: [
      { name: 'tokenId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'fromState', type: 'uint8', indexed: true, internalType: 'enum ItemState' },
      { name: 'toState', type: 'uint8', indexed: true, internalType: 'enum ItemState' },
      { name: 'triggeredBy', type: 'address', indexed: false, internalType: 'address' }
    ],
    anonymous: false
  },
  { type: 'error', name: 'CertAlreadyRegistered', inputs: [] },
  { type: 'error', name: 'HardwareAlreadyRegistered', inputs: [] },
  { type: 'error', name: 'HardwareMismatch', inputs: [] },
  { type: 'error', name: 'InvalidGrade', inputs: [] },
  { type: 'error', name: 'InvalidRecipient', inputs: [] },
  { type: 'error', name: 'InvalidSignature', inputs: [] },
  { type: 'error', name: 'InvalidStateTransition', inputs: [] },
  { type: 'error', name: 'NotAuthorizedGrader', inputs: [] },
  { type: 'error', name: 'ReplayAttackDetected', inputs: [] },
  { type: 'error', name: 'SignatureExpired', inputs: [] },
  { type: 'error', name: 'SlabNotFound', inputs: [] },
  { type: 'error', name: 'TerminalStateLocked', inputs: [] }
] as const;
