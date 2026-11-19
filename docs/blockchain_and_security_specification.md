# Blockchain and Security Specification: SlabLock Protocol

---

## 1. Smart Contract Architecture

The SlabLock on-chain architecture is comprised of a unified, gas-optimized core registry adhering to the **ERC-721** Non-Fungible Token standard and incorporating principles of **ERC-5791 (Physical Backed Tokens)**.

```
┌────────────────────────────────────────────────────────┐
│                   OpenZeppelin v5.0                    │
│  • ERC721Enumerable.sol                                │
│  • AccessControl.sol                                   │
│  • Pausable.sol                                        │
│  • ReentrancyGuard.sol                                 │
└───────────────────────────▲────────────────────────────┘
                            │
┌───────────────────────────┴────────────────────────────┐
│                    SlabRegistry.sol                    │
│                                                        │
│   • Storage: mapping(uint256 => SlabRecord)            │
│   • Mapping: mapping(bytes32 => uint256) certToToken   │
│   • Finite State Machine Transitions                   │
│   • EIP-712 Signature Verification for Hardware Claims │
└────────────────────────────────────────────────────────┘
```

---

## 2. Data Structures & State Machine

### 2.1 State Enum
```solidity
enum ItemState {
    MINTED,      // Digital record created, physical tag unassigned
    SEALED,      // Card encased inside ultrasonic-welded slab; verified intact
    IN_TRANSIT,  // Custody transfer in progress; physical scan required to settle
    UNSEALED,    // Tamper detected or case unsealed; permanently invalidated
    VOID         // Revoked due to administrative invalidation or verified fraud
}
```

### 2.2 Core Slab Struct
```solidity
struct SubGrades {
    uint8 centering; // Scaled by 10 (e.g., 95 = 9.5)
    uint8 surface;   // Scaled by 10
    uint8 corners;   // Scaled by 10
    uint8 edges;     // Scaled by 10
}

struct SlabRecord {
    bytes32 certIdHash;        // keccak256 hash of the unique physical container ID
    bytes32 hardwareUidHash;   // keccak256 hash of the NTAG 424 DNA hardware UID
    uint8 overallGrade;        // Scaled by 10 (e.g., 100 = 10.0 Gem Mint)
    SubGrades subGrades;       // Detailed physical sub-grades
    ItemState currentState;    // Active state within finite state machine
    address issuer;            // Public key of the Grading Authority node
    string metadataURI;        // IPFS CID containing high-res forensic macro imagery
    uint64 mintedTimestamp;    // Block timestamp of initial minting
    uint64 stateUpdatedTimestamp; // Block timestamp of most recent state mutation
}
```

---

## 3. Reference Smart Contract Implementation

```solidity
// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title SlabRegistry
 * @notice Core registry for physical-backed collectible slabs and tamper-evident booster boxes.
 */
contract SlabRegistry is ERC721Enumerable, AccessControl, Pausable, ReentrancyGuard, EIP712 {
    using ECDSA for bytes32;

    bytes32 public constant GRADER_ROLE = keccak256("GRADER_ROLE");
    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");

    bytes32 public constant CUSTODY_TRANSFER_TYPEHASH = keccak256(
        "CustodyTransfer(uint256 tokenId,address to,uint256 nonce,uint256 deadline)"
    );

    uint256 private _nextTokenId = 1;

    mapping(uint256 => SlabRecord) private _slabs;
    mapping(bytes32 => uint256) public certHashToTokenId;
    mapping(bytes32 => uint256) public hardwareHashToTokenId;
    mapping(uint256 => uint256) public nonces;

    event SlabMinted(
        uint256 indexed tokenId,
        bytes32 indexed certIdHash,
        address indexed issuer,
        uint8 overallGrade,
        string metadataURI
    );

    event StateTransition(
        uint256 indexed tokenId,
        ItemState indexed fromState,
        ItemState indexed toState,
        address triggeredBy
    );

    error CertAlreadyRegistered();
    error HardwareAlreadyRegistered();
    error InvalidStateTransition();
    error TerminalStateLocked();
    error NotAuthorizedGrader();
    error InvalidSignature();
    error SignatureExpired();
    error SlabNotFound();

    constructor(
        address admin,
        address defaultRelayer
    ) ERC721("SlabLock Provenance Token", "SLAB") EIP712("SlabLock", "1") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(GRADER_ROLE, admin);
        _grantRole(RELAYER_ROLE, defaultRelayer);
    }

    /**
     * @notice Mints a new digital twin corresponding to a sealed physical card slab.
     */
    function mintSlab(
        address recipient,
        string calldata certId,
        string calldata hardwareUid,
        uint8 overallGrade,
        SubGrades calldata subGrades,
        string calldata metadataURI
    ) external onlyRole(GRADER_ROLE) whenNotPaused returns (uint256) {
        bytes32 cHash = keccak256(abi.encodePacked(certId));
        bytes32 hHash = keccak256(abi.encodePacked(hardwareUid));

        if (certHashToTokenId[cHash] != 0) revert CertAlreadyRegistered();
        if (hardwareHashToTokenId[hHash] != 0) revert HardwareAlreadyRegistered();

        uint256 tokenId = _nextTokenId++;

        _slabs[tokenId] = SlabRecord({
            certIdHash: cHash,
            hardwareUidHash: hHash,
            overallGrade: overallGrade,
            subGrades: subGrades,
            currentState: ItemState.SEALED,
            issuer: msg.sender,
            metadataURI: metadataURI,
            mintedTimestamp: uint64(block.timestamp),
            stateUpdatedTimestamp: uint64(block.timestamp)
        });

        certHashToTokenId[cHash] = tokenId;
        hardwareHashToTokenId[hHash] = tokenId;

        _safeMint(recipient, tokenId);

        emit SlabMinted(tokenId, cHash, msg.sender, overallGrade, metadataURI);
        emit StateTransition(tokenId, ItemState.MINTED, ItemState.SEALED, msg.sender);

        return tokenId;
    }

    /**
     * @notice Irreversibly transitions the slab status to UNSEALED.
     */
    function flagUnsealed(uint256 tokenId) external whenNotPaused {
        SlabRecord storage slab = _slabs[tokenId];
        if (slab.mintedTimestamp == 0) revert SlabNotFound();

        address owner = ownerOf(tokenId);
        if (msg.sender != owner && !hasRole(RELAYER_ROLE, msg.sender) && !hasRole(GRADER_ROLE, msg.sender)) {
            revert NotAuthorizedGrader();
        }

        if (slab.currentState == ItemState.UNSEALED || slab.currentState == ItemState.VOID) {
            revert TerminalStateLocked();
        }

        ItemState previousState = slab.currentState;
        slab.currentState = ItemState.UNSEALED;
        slab.stateUpdatedTimestamp = uint64(block.timestamp);

        emit StateTransition(tokenId, previousState, ItemState.UNSEALED, msg.sender);
    }

    /**
     * @notice Retrieves the full inspection and grading profile of a slab.
     */
    function getSlab(uint256 tokenId) external view returns (SlabRecord memory) {
        SlabRecord memory slab = _slabs[tokenId];
        if (slab.mintedTimestamp == 0) revert SlabNotFound();
        return slab;
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Enumerable, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
```

---

## 4. Threat Modeling & Attack Vector Mitigations

| Threat Vector | Description | Architectural Mitigation |
| :--- | :--- | :--- |
| **Photocopy / Replay Attack** | Scammer takes a photo of a QR code or clones static NFC UID to print 100 fake cards. | Mitigated by NTAG 424 DNA. Tag generates an ephemeral AES-128 CMAC that increments internal read counters on every tap. Static copies fail validation. |
| **Slab Cracking & Card Swap** | Scammer cracks ultrasonic acrylic seal, swaps authentic card for replica, and reseals case with UV glue. | Mitigated by IPFS forensic macro imagery. The smart contract anchors high-resolution photos of surface foil, centering, and edge patterns; physical comparison exposes the swapped card. |
| **Man-In-The-Middle (MITM) Relay** | Malicious mobile client intercepts legitimate scan and broadcasts it from a different geolocation. | Mitigated by EIP-712 domain-separated signatures with nonces and a strict $120\text{-second}$ validity window enforced by the relayer. |
| **Rogue Whitelist Minting** | Malicious insider mints non-existent slabs to flood secondary market. | Mitigated by Multi-Sig Governance on `GRADER_ROLE` allocation and mandatory on-chain logging of the issuing authority's address. |