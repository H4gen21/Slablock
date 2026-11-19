// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

enum ItemState {
    MINTED,      // Digital record created, physical tag unassigned
    SEALED,      // Card encased inside ultrasonic-welded slab; verified intact
    IN_TRANSIT,  // Custody transfer in progress; physical scan required to settle
    UNSEALED,    // Tamper detected or case unsealed; permanently invalidated
    VOID         // Revoked due to administrative invalidation or verified fraud
}

struct SubGrades {
    uint8 centering; // Scaled by 10 (e.g., 95 = 9.5)
    uint8 surface;   // Scaled by 10
    uint8 corners;   // Scaled by 10
    uint8 edges;     // Scaled by 10
}

struct SlabRecord {
    bytes32 certIdHash;            // keccak256 hash of the unique physical container ID
    bytes32 hardwareUidHash;       // keccak256 hash of the NTAG 424 DNA hardware UID
    uint8 overallGrade;            // Scaled by 10 (e.g., 100 = 10.0 Gem Mint)
    SubGrades subGrades;           // Detailed physical sub-grades
    ItemState currentState;        // Active state within finite state machine
    address issuer;                // Public key of the Grading Authority node
    string metadataURI;            // IPFS CID containing high-res forensic macro imagery
    uint64 mintedTimestamp;        // Block timestamp of initial minting
    uint64 stateUpdatedTimestamp;  // Block timestamp of most recent state mutation
}

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

    bytes32 public constant NFC_ATTESTATION_TYPEHASH = keccak256(
        "NfcAttestation(uint256 tokenId,bytes32 hardwareUidHash,uint256 readCounter,address clientAddress,uint256 nonce,uint256 deadline)"
    );

    uint256 private _nextTokenId = 1;

    mapping(uint256 => SlabRecord) private _slabs;
    mapping(bytes32 => uint256) public certHashToTokenId;
    mapping(bytes32 => uint256) public hardwareHashToTokenId;
    mapping(uint256 => uint256) public nonces;
    mapping(uint256 => uint256) public lastReadCounters;

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

    event CustodyTransferred(
        uint256 indexed tokenId,
        address indexed previousOwner,
        address indexed newOwner,
        uint64 timestamp
    );

    event NfcAttestationVerified(
        uint256 indexed tokenId,
        address indexed clientAddress,
        uint256 readCounter,
        uint64 timestamp
    );

    error CertAlreadyRegistered();
    error HardwareAlreadyRegistered();
    error InvalidStateTransition();
    error TerminalStateLocked();
    error NotAuthorizedGrader();
    error InvalidSignature();
    error SignatureExpired();
    error SlabNotFound();
    error InvalidGrade();
    error InvalidRecipient();
    error ReplayAttackDetected();
    error HardwareMismatch();

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
        if (recipient == address(0)) revert InvalidRecipient();
        if (
            overallGrade > 100 ||
            subGrades.centering > 100 ||
            subGrades.surface > 100 ||
            subGrades.corners > 100 ||
            subGrades.edges > 100
        ) {
            revert InvalidGrade();
        }

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
     * @notice Transitions an intact SEALED slab into IN_TRANSIT during escrow or active transfer.
     */
    function initiateTransfer(uint256 tokenId) external whenNotPaused {
        SlabRecord storage slab = _slabs[tokenId];
        if (slab.mintedTimestamp == 0) revert SlabNotFound();

        address owner = ownerOf(tokenId);
        if (msg.sender != owner && !hasRole(RELAYER_ROLE, msg.sender) && !hasRole(GRADER_ROLE, msg.sender)) {
            revert NotAuthorizedGrader();
        }

        if (slab.currentState == ItemState.UNSEALED || slab.currentState == ItemState.VOID) {
            revert TerminalStateLocked();
        }
        if (slab.currentState != ItemState.SEALED) {
            revert InvalidStateTransition();
        }

        slab.currentState = ItemState.IN_TRANSIT;
        slab.stateUpdatedTimestamp = uint64(block.timestamp);

        emit StateTransition(tokenId, ItemState.SEALED, ItemState.IN_TRANSIT, msg.sender);
    }

    /**
     * @notice Cancels an active IN_TRANSIT state and returns the slab to SEALED.
     */
    function cancelTransfer(uint256 tokenId) external whenNotPaused {
        SlabRecord storage slab = _slabs[tokenId];
        if (slab.mintedTimestamp == 0) revert SlabNotFound();

        address owner = ownerOf(tokenId);
        if (msg.sender != owner && !hasRole(RELAYER_ROLE, msg.sender) && !hasRole(GRADER_ROLE, msg.sender)) {
            revert NotAuthorizedGrader();
        }

        if (slab.currentState == ItemState.UNSEALED || slab.currentState == ItemState.VOID) {
            revert TerminalStateLocked();
        }
        if (slab.currentState != ItemState.IN_TRANSIT) {
            revert InvalidStateTransition();
        }

        slab.currentState = ItemState.SEALED;
        slab.stateUpdatedTimestamp = uint64(block.timestamp);

        emit StateTransition(tokenId, ItemState.IN_TRANSIT, ItemState.SEALED, msg.sender);
    }

    /**
     * @notice Settles custody transfer using an EIP-712 hardware attestation signature from an authorized relayer.
     */
    function claimCustodyWithAttestation(
        uint256 tokenId,
        address to,
        uint256 deadline,
        bytes calldata signature
    ) external nonReentrant whenNotPaused {
        SlabRecord storage slab = _slabs[tokenId];
        if (slab.mintedTimestamp == 0) revert SlabNotFound();
        if (to == address(0)) revert InvalidRecipient();

        if (slab.currentState == ItemState.UNSEALED || slab.currentState == ItemState.VOID) {
            revert TerminalStateLocked();
        }
        if (block.timestamp > deadline) revert SignatureExpired();

        uint256 currentNonce = nonces[tokenId];
        bytes32 structHash = keccak256(
            abi.encode(CUSTODY_TRANSFER_TYPEHASH, tokenId, to, currentNonce, deadline)
        );
        bytes32 digest = _hashTypedDataV4(structHash);

        (address signer, ECDSA.RecoverError err, ) = ECDSA.tryRecover(digest, signature);
        if (err != ECDSA.RecoverError.NoError || !hasRole(RELAYER_ROLE, signer)) {
            revert InvalidSignature();
        }

        nonces[tokenId] = currentNonce + 1;

        ItemState previousState = slab.currentState;
        if (previousState == ItemState.IN_TRANSIT) {
            slab.currentState = ItemState.SEALED;
            slab.stateUpdatedTimestamp = uint64(block.timestamp);
            emit StateTransition(tokenId, ItemState.IN_TRANSIT, ItemState.SEALED, msg.sender);
        }

        address previousOwner = ownerOf(tokenId);
        _transfer(previousOwner, to, tokenId);

        emit CustodyTransferred(tokenId, previousOwner, to, uint64(block.timestamp));
    }

    /**
     * @notice Verifies an EIP-712 NFC dynamic SUN/CMAC attestation and increments the monotonic read counter.
     */
    function verifyNfcAttestation(
        uint256 tokenId,
        string calldata hardwareUid,
        uint256 readCounter,
        address clientAddress,
        uint256 deadline,
        bytes calldata signature
    ) external nonReentrant whenNotPaused returns (bool) {
        SlabRecord storage slab = _slabs[tokenId];
        if (slab.mintedTimestamp == 0) revert SlabNotFound();

        if (slab.currentState == ItemState.UNSEALED || slab.currentState == ItemState.VOID) {
            revert TerminalStateLocked();
        }
        if (block.timestamp > deadline) revert SignatureExpired();

        bytes32 hHash = keccak256(abi.encodePacked(hardwareUid));
        if (hHash != slab.hardwareUidHash) revert HardwareMismatch();

        if (readCounter <= lastReadCounters[tokenId]) revert ReplayAttackDetected();

        uint256 currentNonce = nonces[tokenId];
        {
            bytes32 digest = _hashTypedDataV4(
                keccak256(
                    abi.encode(
                        NFC_ATTESTATION_TYPEHASH,
                        tokenId,
                        hHash,
                        readCounter,
                        clientAddress,
                        currentNonce,
                        deadline
                    )
                )
            );

            (address signer, ECDSA.RecoverError err, ) = ECDSA.tryRecover(digest, signature);
            if (err != ECDSA.RecoverError.NoError || !hasRole(RELAYER_ROLE, signer)) {
                revert InvalidSignature();
            }
        }

        lastReadCounters[tokenId] = readCounter;
        nonces[tokenId] = currentNonce + 1;

        emit NfcAttestationVerified(tokenId, clientAddress, readCounter, uint64(block.timestamp));
        return true;
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
     * @notice Irreversibly transitions the slab status to VOID (Grading Authority revocation/fraud).
     */
    function flagVoid(uint256 tokenId) external onlyRole(GRADER_ROLE) whenNotPaused {
        _voidSlab(tokenId);
    }

    /**
     * @notice Alias for flagVoid to support administrative revocation workflows.
     */
    function revokeSlab(uint256 tokenId) external onlyRole(GRADER_ROLE) whenNotPaused {
        _voidSlab(tokenId);
    }

    function _voidSlab(uint256 tokenId) internal {
        SlabRecord storage slab = _slabs[tokenId];
        if (slab.mintedTimestamp == 0) revert SlabNotFound();

        if (slab.currentState == ItemState.UNSEALED || slab.currentState == ItemState.VOID) {
            revert TerminalStateLocked();
        }

        ItemState previousState = slab.currentState;
        slab.currentState = ItemState.VOID;
        slab.stateUpdatedTimestamp = uint64(block.timestamp);

        emit StateTransition(tokenId, previousState, ItemState.VOID, msg.sender);
    }

    /**
     * @notice Emergency pause controllable by the default admin.
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @notice Unpause controllable by the default admin.
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @notice Retrieves the full inspection and grading profile of a slab.
     */
    function getSlab(uint256 tokenId) external view returns (SlabRecord memory) {
        SlabRecord memory slab = _slabs[tokenId];
        if (slab.mintedTimestamp == 0) revert SlabNotFound();
        return slab;
    }

    /**
     * @notice Retrieves the EIP-712 domain separator for off-chain signing.
     */
    function domainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    /**
     * @notice Returns the IPFS metadata URI for a given token.
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return string(abi.encodePacked("ipfs://", _slabs[tokenId].metadataURI));
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
