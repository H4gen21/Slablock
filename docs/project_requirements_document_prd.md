# Product Requirements Document (PRD): SlabLock Protocol
**Decentralized Provenance & Tamper-Evident Physical Twin Architecture for Collectibles**

---

## 1. Document Control & Executive Summary
- **Project Identifier:** SlabLock (GSLC Architecture)
- **Target Category:** Decentralized Physical Provenance, Anti-Counterfeiting, Physical-Backed Tokens (PBT)
- **Target Asset Classes:** High-End Trading Card Game (TCG) Graded Slabs (e.g., PSA/CGC/BGS Encapsulated Cards) and Factory-Sealed Booster Boxes.
- **Core Mission:** Eliminate "slab cracking" (forcibly opening authentic ultrasonic-welded acrylic cases to replace pristine cards with counterfeits/low-grade alternatives) and secondary market booster box resealing. This is accomplished by cryptographically marrying physical packaging to an append-only, decentralized Ethereum Virtual Machine (EVM) ledger using dynamic hardware authentication (NXP NTAG 424 DNA) and decentralized forensic storage (IPFS).

---

## 2. Problem Statement & Market Opportunity

### 2.1 The Secondary Market Vulnerability
The collectible secondary market handles billions in annual volume across peer-to-peer marketplaces, card shows, and auction houses. However, current verification mechanisms rely on flawed physical-to-digital bridges:
1. **The Photocopier / Duplication Vulnerability:** Conventional grading cases and retail packaging rely on static 2D QR codes or printed serial numbers. Because optical prints lack dynamic computation, bad actors photocopy legitimate cert numbers or QR codes and paste them onto hundreds of counterfeit acrylic holders or resealed boxes.
2. **Slab Cracking & Card Substitution:** Fraudsters use fine dental saws or specialized pliers to crack open the sonic weld of an authentic high-grade case (e.g., PSA 10 Gem Mint), extract the four-to-five-figure card, insert an altered, heavily played, or counterfeit card, and reseal the case using cyanoacrylate or UV resin. The static cert number on the label still points to a legitimate online database record.
3. **Shrink-Wrap Resealing:** Factory booster boxes are routinely slit open at the seams, stripped of packs containing holofoil hits (or weighed to extract heavy packs), repacked with common filler packs, and re-wrapped with retail heat-shrink plastic.
4. **Centralized Database Failure & Ephemerality:** Existing certificate lookup systems rely exclusively on centralized corporate databases. If the grading authority's server suffers an outage, database corruption, or malicious internal record manipulation, provenance validation collapses.

### 2.2 The SlabLock Solution
SlabLock introduces a trustless, hardware-bound **Digital Twin** architecture:
- Every physical slab or box is embedded with a secure microchip (NXP NTAG 424 DNA) capable of symmetric-key cryptographic calculations on every read.
- The chip generates an unpredictable, single-use dynamic attestation (Secure Unique NFC - SUN) on every smartphone tap, rendering static photocopies and cloned NFC signals obsolete.
- High-resolution, multi-spectral forensic macro-imagery of the card's physical features (centering, surface grain, holographic micro-patterns, edge fiber alignment) is captured during encapsulation, hashed via SHA-256, and permanently pinned to decentralized storage (IPFS).
- An EVM-based smart contract enforces an immutable, append-only finite state machine (`MINTED`, `SEALED`, `IN_TRANSIT`, `UNSEALED`, `VOID`). Once breached or unsealed, the digital twin permanently invalidates the physical container's sealed status on-chain.

---

## 3. Personas & Stakeholder Profiles

### 3.1 Certified Grading Authority (Genesis Issuer)
- **Role:** Professional grading houses, third-party authenticators, or authorized brand issuance nodes.
- **Responsibilities:**
  - Execute multi-point physical inspections (Centering, Surface, Corners, Edges).
  - Capture standardized microscopic forensic photography.
  - Insert the physical card into the tamper-resistant acrylic slab containing the embedded cryptographic tag.
  - Execute ultrasonic welding (sonic seal).
  - Call the genesis smart contract to mint the digital twin and anchor the forensic image hashes to IPFS.

### 3.2 The High-End Collector / Investor (Consensus Verifier)
- **Role:** Transactor purchasing, holding, or trading four-to-six-figure collectible assets.
- **Needs:**
  - Instant, frictionless, zero-knowledge verification in physical environments (e.g., card conventions, local game stores) using an ordinary consumer smartphone.
  - 100% mathematical guarantee that the card inside the case matches the exact card evaluated at the grading facility.
  - Proof that the case has not been cracked, glued, or tampered with since issuance.

### 3.3 Marketplace / Auction Platform (Consensus Node / Integration Partner)
- **Role:** Secondary marketplaces (e.g., peer-to-peer apps, consignment platforms, auction houses).
- **Needs:**
  - Machine-readable smart contract APIs to verify custody and authentication state programmatically before releasing escrow funds.
  - Elimination of buyer-dispute fraud regarding counterfeit or swapped merchandise.

---

## 4. Functional Requirements

### 4.1 Module 1: Genesis Minting & Physical Encapsulation
- **FR-1.1:** The system shall restrict minting authorization exclusively to addresses holding the `GRADER_ROLE` via Role-Based Access Control (RBAC).
- **FR-1.2:** The mint transaction must accept and store:
  - Unique physical container identifier (`certId`).
  - Cryptographic public identifier derived from the physical chip.
  - Exact sub-grade breakdown (Centering, Surface, Corners, Edges) normalized on a 1.0 to 10.0 scale.
  - IPFS Content Identifier (`CID`) referencing the decentralized forensic metadata archive.
- **FR-1.3:** The contract must emit a `SlabMinted` event containing the initial token ID, container ID, and initial state (`SEALED`).

### 4.2 Module 2: Dynamic Tap-to-Verify (Anti-Cloning Engine)
- **FR-2.1:** The mobile client must establish near-field communication (ISO 14443-4) with the embedded tag upon physical proximity ($\le 4\text{ cm}$).
- **FR-2.2:** The tag must dynamically generate a cryptographic SUN token comprising an encrypted payload (`PICCData`) and an 8-byte Cipher-based Message Authentication Code (`CMAC`) calculated using an internal incrementing read counter.
- **FR-2.3:** The system backend must verify the CMAC using a diversified hardware key and check that the current read counter strictly exceeds the last recorded counter for that tag UID, mitigating replay attacks.
- **FR-2.4:** Upon successful cryptographic validation, the client must query the Polygon contract to display current state, chain-of-custody provenance, and download forensic macro photos directly from IPFS for side-by-side visual inspection.

### 4.3 Module 3: Custody Transfer & Handshake
- **FR-3.1:** The system shall support transfer of digital twin ownership between Ethereum-compatible wallets.
- **FR-3.2:** A custody transfer must require co-location verification: the recipient must provide a signature, and the physical tag must be tapped within a 120-second validity window to guarantee that physical delivery matches digital transfer.
- **FR-3.3:** The smart contract must emit a `CustodyTransferred` event detailing the previous owner, new owner, block timestamp, and transaction hash.

### 4.4 Module 4: Tamper Detection & State Transition
- **FR-4.1:** The smart contract must implement an irreversible finite state machine with the following states:
  - `MINTED`: Genesis record created; awaiting encapsulation confirmation.
  - `SEALED`: Card sealed inside intact container; verified authentic.
  - `IN_TRANSIT`: Escrow or active transfer initiated; awaiting final tap claim.
  - `UNSEALED`: Terminal state indicating the physical container or tamper-evident seal has been breached.
  - `VOID`: Terminal state invoked by the grading authority in the event of documented physical destruction or discovered fraud.
- **FR-4.2:** Once a token transitions to `UNSEALED` or `VOID`, the smart contract logic must throw an explicit error (`TerminalStateLocked()`) on any attempt to revert to `SEALED`.

---

## 5. Non-Functional Requirements

### 5.1 Performance & Latency
- **NFR-1.1 (Verification SLA):** Total time elapsed from physical mobile tap to rendering verified status and high-resolution forensic images must not exceed $1,800\text{ ms}$ over a standard 4G cellular data connection.
- **NFR-1.2 (Blockchain Throughput):** The chosen blockchain layer must guarantee deterministic transaction finality in $\le 3$ seconds with sub-cent gas fees ($\le \$0.01\text{ USD}$ per state transition).

### 5.2 Security & Integrity
- **NFR-2.1 (Key Secrecy):** Master AES-128 hardware keys used for tag diversification must never be stored on mobile devices, committed to version control, or exposed on-chain. Decryption must occur strictly within an isolated server-side Hardware Security Module (HSM) or secure enclave environment.
- **NFR-2.2 (Decentralization of Assets):** No core metadata or visual proof assets shall be hosted on ephemeral centralized cloud storage (e.g., raw AWS S3 buckets). All media must be addressed using content hashes pinned on IPFS or Filecoin.
- **NFR-2.3 (Smart Contract Robustness):** Contracts must achieve 100% test branch coverage and zero high- or medium-severity vulnerabilities when analyzed by automated static analyzers (Slither, Mythril).

### 5.3 Hardware Specifications
- **NFR-3.1 (Tag Form Factor):** The physical chip must be an NXP NTAG 424 DNA compliant with ISO/IEC 14443-A and NFC Forum Type 4 Tag specifications.
- **NFR-3.2 (Environmental Durability):** The tag antenna and silicon must maintain functional resonance through ultrasonic plastic welding temperatures ($160^\circ\text{C}$ to $220^\circ\text{C}$ instantaneous surface pulse) and endure standard ambient electromagnetic interference.