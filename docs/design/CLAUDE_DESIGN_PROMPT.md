# Role & Objective
You are a Principal Product Designer and Staff React Native / Expo Web Design Engineer. I want you to design a high-craft, luxury-grade, cryptographically authoritative UI/UX for SlabLock Protocol—a decentralized physical provenance and anti-counterfeiting platform for high-value graded trading card slabs (e.g., Pokemon TCG PSA/BGS/CGC 10 grails) and factory-sealed booster boxes.

Below is the complete technical, architectural, and repository context dump of the project so your designs and code map 1:1 to our working smart contracts, backend API, and mobile/web client.

---

## 1. Product Context & Core Problem We Solve
The secondary collectible market handles billions in volume, but suffers from three critical physical-to-digital vulnerabilities:
1. Slab Cracking & Card Substitution: Scammers crack open the ultrasonic weld of an authentic high-grade acrylic slab (e.g., PSA 10 Gem Mint), extract the 5-figure card, swap in a damaged or counterfeit copy, and reseal the case with UV resin. The static cert number still checks out online.
2. Photocopy / Replay Attacks: Scammers copy static 2D QR codes or serial numbers onto hundreds of fake slabs.
3. Booster Box Resealing: Factory shrink-wrap is slit open, weighed/stripped of holofoil hits, and resealed with heat guns.

### How SlabLock Solves This:
- Hardware Layer (NXP NTAG 424 DNA): Every physical slab/box embeds an ISO/IEC 14443-4 NFC microchip inside the tamper loop. On every smartphone tap, the silicon increments a monotonic 24-bit read counter and computes a dynamic AES-128 SUN (Secure Unique NFC) encrypted payload (piccData) + 8-byte truncated CMAC. Static copies or replayed URLs fail immediately.
- Forensic Storage Layer (IPFS): During encapsulation, multi-spectral high-resolution macro photos (surface grain, holographic micro-patterns, edge fiber alignment, corners) are hashed and pinned to IPFS (ipfs://Qm...) for side-by-side visual verification.
- Blockchain Layer (Polygon PoS / Amoy EVM): SlabRegistry.sol (ERC-721 + ERC-5791 Physical-Backed Token principles) enforces an append-only Finite State Machine (MINTED, SEALED, IN_TRANSIT, UNSEALED, VOID) and verifies EIP-712 hardware attestations signed by our Backend Cryptographic Relay.

---

## 2. Monorepo Structure & Tech Stack
- contracts/ (Foundry, Solidity 0.8.24, OpenZeppelin v5.0.2)
  - src/SlabRegistry.sol: ERC721Enumerable, AccessControl, Pausable, ReentrancyGuard, EIP712
  - test/SlabRegistry.t.sol: Unit & Fuzz test suite (12/12 passing)
  - script/DeploySlabLock.s.sol: Deploys & seeds 3 graded Pokemon slabs (SEALED, UNSEALED, VOID)
- backend/ (Fastify, Node.js v20, TypeScript, Prisma, viem)
  - prisma/schema.prisma: PostgreSQL schema (GradingHouse, PhysicalTag, SlabAsset, StateTransition)
  - src/crypto/sun.ts: AES-128-CBC PICC decryption, K_div HMAC/CMAC derivation, anti-replay check
  - src/services/relayer.ts: viem EIP-712 signer (CustodyTransfer & NfcAttestation typed data)
  - src/services/ipfs.ts: Deterministic Base58 CIDv0 forensic metadata pinning
  - src/services/db.ts: Store pre-seeded with Charizard, Pikachu, Illustrator, Umbreon VMAX
  - src/routes/: POST /api/v1/nfc/verify, POST /api/v1/grading/encapsulate, POST /api/v1/metadata/pin
- mobile/ (Expo SDK 51, React Native 0.74, React Native Web, TypeScript, viem)
  - index.js: registerRootComponent(App)
  - App.tsx: RootErrorBoundary + main shell
  - src/abi/SlabRegistry.ts: Full ABI & ItemState labels
  - src/web3/client.ts: viem createPublicClient + readSlabFromChain()
  - src/nfc/sunReader.ts: Native react-native-nfc-manager NDEF reader + Dev Demo payload builder
  - src/nfc/sunReader.web.ts: Web-safe shim (avoids bundling native NFC module on web)
  - src/screens/TapToVerifyScreen.tsx
  - src/components/CertificateInspectionView.tsx
  - src/components/DevDemoBottomSheet.tsx

---

## 3. On-Chain Data Model & Finite State Machine (SlabRegistry.sol)

### State Machine (ItemState)
- MINTED (0): Genesis digital record created; awaiting physical encapsulation.
- SEALED (1): Card encased inside ultrasonic-welded acrylic slab; verified intact (GREEN badge).
- IN_TRANSIT (2): Active escrow or custody transfer initiated; awaiting recipient co-location physical NFC tap within 120s (AMBER badge).
- UNSEALED (3): Terminal state. Ultrasonic weld or tamper loop breached. Permanently locked (RED critical tamper alert).
- VOID (4): Terminal state. Revoked by Grading Authority due to fraud or destruction (RED critical alert).

### Structs
- SubGrades: { uint8 centering, uint8 surface, uint8 corners, uint8 edges } (scaled by 10 on-chain, e.g. 100 = 10.0, 95 = 9.5)
- SlabRecord: { bytes32 certIdHash, bytes32 hardwareUidHash, uint8 overallGrade, SubGrades subGrades, ItemState currentState, address issuer, string metadataURI, uint64 mintedTimestamp, uint64 stateUpdatedTimestamp }

---

## 4. Backend API Contract & Data Shapes (http://localhost:3000)

### POST /api/v1/nfc/verify
- Request Body:
  {
    "piccData": "SIM:04A1B2C3D4E501:11",
    "cmac": "8E54A92B1C77F43D",
    "clientAddress": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
  }

- Success Response (200 OK - VerifiedCertificateData):
  export interface VerifiedCertificateData {
    verified: boolean;
    tagUid: string;              // e.g. "04A1B2C3D4E501"
    readCounter: number;         // Monotonic NTAG 424 DNA counter, e.g. 11
    tokenId: number;             // ERC-721 Token ID, e.g. 1
    certId: string;              // e.g. "CERT-PKMN-2026-0001"
    cardName: string;            // e.g. "1st Edition Shadowless Holo Charizard #4"
    cardSet: string;             // e.g. "1999 Pokemon Base Set"
    overallGrade: number;        // Normalized 1.0 - 10.0, e.g. 10.0
    subGrades: {
      centering: number;         // e.g. 10.0
      surface: number;           // e.g. 10.0
      corners: number;           // e.g. 10.0
      edges: number;             // e.g. 10.0
    };
    ipfsMetadataCid: string;     // e.g. "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco"
    onChainState: 'MINTED' | 'SEALED' | 'IN_TRANSIT' | 'UNSEALED' | 'VOID';
    ownerAddress?: string;
    issuerAddress?: string;
    claimSignature: {
      r: string;
      s: string;
      v: number;
      signature: string;
      deadline: number;          // Unix timestamp (+120s validity window)
    };
    nfcAttestationSignature?: {
      r: string;
      s: string;
      v: number;
      signature: string;
      deadline: number;
    };
  }

- Error Response (400 Bad Request / 401 Unauthorized):
  {
    "success": false,
    "error": {
      "code": "ERR_REPLAY_ATTACK",
      "message": "Read counter 1 is less than or equal to last authenticated counter (5)."
    }
  }

---

## 5. Seeded Demo Assets & Interactive States
Our app includes a persistent Dev Demo Mode drawer/sheet for testing in desktop browsers (http://localhost:8081) and emulators without physical NTAG 424 hardware:
1. [Simulate Valid Tap (Charizard PSA 10 - SEALED)]
   - Tag UID: 04A1B2C3D4E501 | Token #1 | CERT-PKMN-2026-0001
   - Card: 1st Edition Shadowless Holo Charizard #4 (1999 Pokemon Base Set)
   - Grade: 10.0 GEM MINT (Centering 10.0, Corners 10.0, Edges 10.0, Surface 10.0)
   - State: SEALED -> Renders Emerald Verified & Intact badge + full cryptographic telemetry.
2. [Simulate Compromised Tap (Pikachu - UNSEALED/CRACKED)]
   - Tag UID: 04A1B2C3D4E502 | Token #2 | CERT-PKMN-2026-0002
   - Card: 1st Edition Shadowless Pikachu #58 (1999 Pokemon Base Set)
   - Grade: 9.5 MINT+ (Centering 9.5, Surface 9.5, Corners 10.0, Edges 9.0)
   - State: UNSEALED -> Renders Crimson Critical Tamper Alert ("CASE BREACHED - DO NOT PURCHASE AS SEALED").
3. [Simulate Replay Attack (Counter Mismatch Error)]
   - Sends stale counter 1 against Tag 04A1B2C3D4E502 (lastCounter >= 5).
   - Triggers ERR_REPLAY_ATTACK Security Rejection Alert explaining that dynamic AES-128 CMAC monotonic counter validation blocked a cloned tag or replayed URL.

---

## 6. Design Direction & What I Want From You
Please design and provide production-ready React Native (Expo Web + iOS/Android compatible) components and screens for SlabLock with the following requirements:
1. Aesthetic Direction:
   - High-trust, dark vault / forensic hardware aesthetic (deep obsidian #090D16 / #020617 surfaces, brushed metallic/glassmorphic borders, holographic gold accents for Gem Mint 10 grades, razor-sharp monospace typography for cryptographic hex/CIDs/counters).
   - Unmistakable semantic state signaling:
     - SEALED: Emerald (#10B981) glow, verified shield, intact sonic-weld indicator.
     - UNSEALED / VOID: Crimson (#EF4444) hazard framing, cracked-seal warning, locked terminal state badge.
     - ERR_REPLAY_ATTACK: High-contrast security intercept modal/banner showing incoming counter vs. last recorded counter.
2. Views to Design & Implement:
   - Primary Tap-to-Verify Scanner Hero: Interactive NFC radar/pulse animation with clear 4cm proximity guidance.
   - Certificate & Digital Twin Inspection Card: Physical slab visual representation, overall grade badge (10.0 GEM MINT), 4-quadrant sub-grade breakdown bars (Centering, Corners, Edges, Surface), Forensic Macro Imagery Loupe preview (Surface Macro & Edges Macro from IPFS), and collapsible On-Chain & NTAG 424 DNA Cryptographic Telemetry (tagUid, readCounter, tokenId, ipfsMetadataCid, claimSignature, deadline countdown).
   - Collapsible / Docked Dev Demo Mode Controller: Clean floating developer dock at the bottom with the 3 simulation triggers (VALID_CHARIZARD_SEALED, COMPROMISED_PIKACHU_UNSEALED, REPLAY_ATTACK).
3. Technical Constraints (Crucial for Expo Web + Native):
   - Use standard React Native primitives (View, Text, TouchableOpacity, ScrollView, Animated, StyleSheet / inline style objects) so it renders identically on Expo Web (react-native-web at http://localhost:8081) and native iOS/Android without relying on native-only packages or broken PostCSS plugins.
   - Preserve our exact prop types (VerifiedCertificateData, DemoTriggerScenario) and API integration with POST http://localhost:3000/api/v1/nfc/verify.
