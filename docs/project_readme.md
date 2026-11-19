# SlabLock: Physical-Backed Integrity & Provenance Protocol

[![Foundry Tested](https://img.shields.io/badge/Foundry-passing-brightgreen.svg)](https://getfoundry.sh/)
[![Network: Polygon Amoy](https://img.shields.io/badge/Polygon-Amoy%20Testnet-8247E5.svg)](https://polygon.technology/)
[![Hardware: NXP NTAG 424](https://img.shields.io/badge/Hardware-NTAG%20424%20DNA-blue.svg)](https://www.nxp.com/)

---

## 1. Project Overview
**SlabLock** is a decentralized provenance and anti-counterfeiting protocol engineered to secure high-value collectible trading card slabs (e.g., Pokémon TCG) and factory-sealed booster boxes. 

By marrying physical encapsulation with **NXP NTAG 424 DNA** microchips and an EVM-based smart contract state machine, SlabLock permanently eliminates:
* **Slab Cracking:** Opening authentic grading cases to swap out valuable cards for damaged or counterfeit versions.
* **Photocopy / Replay Attacks:** Generating thousands of duplicate fake labels using static QR codes or copied serial numbers.
* **Secondary Market Resealing:** Slicing factory booster box plastic wrap and resealing manipulated boxes with heat guns.

---

## 2. Monorepo Structure

```
slablock-protocol/
├── contracts/             # Solidity Smart Contracts (Foundry)
│   ├── src/
│   │   └── SlabRegistry.sol # Core ERC-721 / PBT Finite State Machine
│   ├── test/
│   │   └── SlabRegistry.t.sol # Unit & Fuzz Invariant Test Suite
│   └── foundry.toml
│
├── backend/               # Cryptographic Relay & Ingestion Service
│   ├── src/
│   │   ├── crypto/        # AES-128 CMAC and Diversified Subkey Derivation
│   │   ├── routes/        # Fastify API Route Handlers
│   │   └── services/      # IPFS Pinata Service & Prisma Integration
│   ├── prisma/
│   │   └── schema.prisma  # PostgreSQL Schema
│   └── package.json
│
├── mobile/                # React Native Client (Expo Prebuild)
│   ├── src/
│   │   ├── components/    # NativeWind UI Components
│   │   ├── nfc/           # react-native-nfc-manager APDU Handlers
│   │   └── web3/          # viem Client Configuration
│   └── app.json
│
└── docs/                  # Formal Architecture & Technical Specifications
    ├── 01_PRD.md
    ├── 02_ARCHITECTURE_AND_TECH_SPEC.md
    ├── 03_BLOCKCHAIN_AND_SECURITY_SPEC.md
    ├── 04_API_AND_CRYPTO_SPEC.md
    ├── 05_DATABASE_SCHEMA.md
    ├── 06_TESTING_AND_QA_PLAN.md
    └── 07_CICD_PIPELINE.md
```

---

## 3. Quickstart & Local Setup

### 3.1 Prerequisites
* [Foundry](https://getfoundry.sh/) (`forge`, `cast`, `anvil`)
* [Node.js](https://nodejs.org/) v20 LTS or higher
* [Docker Desktop](https://www.docker.com/) (for PostgreSQL)

### 3.2 Smart Contract Pipeline (Foundry)
```bash
# Clone repository
git clone https://github.com/slablock/slablock-core.git
cd slablock-core/contracts

# Install OpenZeppelin dependencies
forge install OpenZeppelin/openzeppelin-contracts

# Compile contracts & inspect sizing
forge build --sizes

# Run full test suite with traces
forge test -vvv
```

### 3.3 Backend Cryptographic Relay
```bash
cd ../backend

# Install dependencies
npm ci

# Configure environment variables
cp .env.example .env

# Run PostgreSQL via Docker & apply migrations
npx prisma migrate dev --name init

# Start development server
npm run dev
```

### 3.4 Mobile Client (React Native)
```bash
cd ../mobile

# Install dependencies
npm ci

# Run Expo Prebuild (Required for Native NFC Modules)
npx expo prebuild

# Launch Android development build (Physical device required for NFC)
npx expo run:android
```

---

## 4. Key Design Decisions

| Architectural Component | Decision | Trade-Off / Rationalization |
| :--- | :--- | :--- |
| **Authentication Hardware** | NXP NTAG 424 DNA (Dynamic SUN/CMAC) | Chosen over optical QR codes. Standard QR codes can be duplicated via optical photocopiers; NTAG 424 DNA runs symmetric cryptographic operations on silicon, generating a fresh, un-replayable OTP on every tap. |
| **Relay Layer** | Server-Side Key Diversification | Symmetric AES-128 master keys cannot reside safely on public blockchains or client mobile binaries. An isolated Node.js service performs verification before dispatching on-chain state updates. |
| **Metadata Permanence** | IPFS via Pinata Gateway | Preserves multi-spectral forensic macro images without risking link rot or centralized cloud deletion. |
| **Blockchain Choice** | Polygon PoS (Amoy Testnet) | Sub-second finality and negligible gas costs ($\le \$0.005$) ensure that custody transfers and physical verification do not impose prohibitive transaction fees on collectors. |