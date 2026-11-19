# System Architecture & Technical Specification: SlabLock Protocol

---

## 1. End-to-End System Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             PHYSICAL HARDWARE LAYER                              │
│                                                                                  │
│   ┌──────────────────────────────────────────────────────────────────────────┐   │
│   │ Sonic-Welded Acrylic Slab / Tamper-Evident Booster Wrap                  │   │
│   │ Embedded NXP NTAG 424 DNA Silicon (AES-128 Dynamic CMAC Engine)          │   │
│   └──────────────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         │ RF Induction (13.56 MHz, ISO 14443-A)
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                            MOBILE CLIENT (REACT NATIVE)                          │
│                                                                                  │
│   • Core Framework: React Native 0.74+ via Expo Prebuild (TypeScript)            │
│   • NFC Hardware Interface: react-native-nfc-manager                             │
│   • Blockchain RPC Layer: viem (TypeScript Native EVM Interface)                 │
│   • Styling & Design System: NativeWind (Tailwind CSS v3)                        │
│   • Authentication: Supabase Auth (Google OAuth 2.0 PKCE Flow)                   │
└──────────────────┬───────────────────────────────────────────┬───────────────────┘
                   │ HTTPS POST /api/v1/nfc/verify             │ JSON-RPC (eth_call)
                   │ Payload: { piccData, cmac }               │ Query State / CID
                   ▼                                           ▼
┌──────────────────────────────────────────────┐     ┌─────────────────────────────┐
│          BACKEND CRYPTOGRAPHIC RELAY         │     │     POLYGON BLOCKCHAIN      │
│                                              │     │      (AMOY TESTNET / POS)   │
│  • Runtime: Node.js v20 LTS + Fastify        │     │                             │
│  • Cryptography: node:crypto (AES-128-CBC    │     │  • SlabRegistry.sol         │
│    CMAC-K1/K2 Subkey Derivation Engine)      │     │    - ERC-721 Token Identity │
│  • Database ORM: Prisma ORM v5               │     │    - ERC-5791 PBT Interface │
│  • Primary Database: PostgreSQL 15 (Supabase)│     │    - Finite State Machine   │
│  • IPFS Integration: Pinata SDK              │────►│  • AccessControl.sol        │
│  • Web3 Signer: viem/accounts (EIP-712       │ Tx  │    - GRADER_ROLE            │
│    Relayer Wallet for Gasless Attestation)   │Relay│    - RELAYER_ROLE           │
└──────────────────────┬───────────────────────┘     └──────────────▲──────────────┘
                       │ Pinned Forensic Media                      │ Read Proofs
                       ▼                                            │
┌───────────────────────────────────────────────────────────────────┴──────────────┐
│                    DECENTRALIZED STORAGE NETWORK (IPFS)                          │
│   • Content-Addressed Forensic Image Archives (CIDv1)                            │
│   • Microscopic High-Resolution Macro Photography (Surface, Edges, Holo)         │
│   • Cryptographic Grading Manifest: metadata.json                                │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack Justification Matrix

| Subsystem | Selected Technology | Alternative Evaluated | Engineering Justification |
| :--- | :--- | :--- | :--- |
| **Mobile Core** | **React Native + Expo** | Flutter (Dart) | Preserves TypeScript across entire codebase (FE, BE, Smart Contract scripts). Expo Prebuild provides full native bridging for custom NFC APDU commands without requiring raw Objective-C/Java boilerplate. |
| **Web3 Client** | **`viem`** | `ethers.js` v6 / `web3.js` | Modular, tree-shakeable, and built natively in TypeScript. Reduces mobile bundle size by $\approx 60\%$ compared to standard `ethers.js`, with significantly faster JSON-RPC ABI encoding/decoding. |
| **Styling** | **NativeWind (Tailwind)** | React Native `StyleSheet` | Enables unified utility-first styling patterns identical to standard web development workflows; accelerates responsive UI layout design for cross-platform viewports. |
| **Backend API** | **Fastify + Node.js** | Express.js | Low-overhead HTTP framework capable of processing up to $30,000\text{ req/sec}$. Essential for low-latency cryptographic handshakes during high-traffic physical convention scanning. |
| **Blockchain** | **Polygon PoS (EVM)** | Ethereum Mainnet / Solana | Sub-cent transaction execution costs ($\le \$0.005$) and $2\text{-second}$ block finality allow high-frequency custody updates and state changes without economic friction. EVM standard ensures full tooling parity with Foundry. |
| **Smart Contract Tooling** | **Foundry (`forge`)** | Hardhat | Blazing-fast execution speeds; tests and deployment scripts are written natively in Solidity, eliminating context-switching between JS/TS and Solidity. Features built-in invariant and fuzz testing. |
| **Decentralized Storage**| **IPFS via Pinata** | Centralized AWS S3 | Immutable, content-addressed data guarantees that forensic verification photos cannot be modified, swapped, or subjected to link rot by centralized hosting administrators. |

---

## 3. Cryptographic Hardware Subsystem (NXP NTAG 424 DNA)

### 3.1 Secure Unique NFC (SUN) Architecture
The NXP NTAG 424 DNA operates at $13.56\text{ MHz}$ following ISO/IEC 14443-4 standards. It uses an internal AES-128 hardware coprocessor to implement the Secure Unique NFC (SUN) protocol:
1. **Dynamic Authentication Payload:** Every time the tag is powered by an RF field (smartphone tap), its internal read counter incrementer advances by $+1$.
2. **Dynamic NDEF Construction:** The tag outputs an ASCII-encoded URL string containing two cryptographic parameters:
   - `picc_data`: An encrypted vector containing the 7-byte tag UID and the 3-byte Read Counter.
   - `cmac`: An 8-byte truncation of an AES-128 Cipher-based Message Authentication Code calculated over the dynamic URL and counter value.

### 3.2 Key Diversification Pipeline
To prevent a compromised physical tag from endangering the entire ecosystem, every physical tag uses a diversified subkey derived from a Master Key ($K_{\text{master}}$):

$$K_{\text{div}} = \text{CMAC}_{K_{\text{master}}}\left(\text{0x01} \parallel \text{UID} \parallel \text{0x00}^{8}\right)$$

The backend server maintains $K_{\text{master}}$ within an environment-isolated vault. When a verification payload is received:
1. The server extracts the raw `picc_data` and decrypts it using an initial decryption key.
2. The decrypted payload reveals the specific tag `UID` and the `ReadCounter`.
3. The server computes $K_{\text{div}}$ using the formula above.
4. The server re-computes the expected CMAC over the dynamic vector and matches it against the client's submitted `cmac`.
5. If the CMAC matches and $\text{ReadCounter} > \text{LastSeenCounter}$, the attestation is mathematically verified.

---

## 4. Mobile System Design & Native NFC Bridging

### 4.1 Native NFC Session Management
The mobile client leverages `react-native-nfc-manager` to instantiate a native ISO-DEP polling session:
- **Android:** Employs `NfcAdapter.enableReaderMode` with `FLAG_READER_NFC_A` and `FLAG_READER_SKIP_NDEF_CHECK` to read raw NDEF data records and bypass standard OS browser redirection.
- **iOS:** Spawns a native `NFCTagReaderSession` targeting `iso15693` / `iso14443` polling tags, rendering the standardized iOS modal sheet during verification.

### 4.2 Viem Client Configuration (Amoy Testnet)
The client instantiates a lightweight, read-only `publicClient` to interact with the deployed `SlabRegistry` smart contract:
```typescript
import { createPublicClient, http } from 'viem';
import { polygonAmoy } from 'viem/chains';

export const polygonClient = createPublicClient({
  chain: polygonAmoy,
  transport: http(process.env.EXPO_PUBLIC_POLYGON_RPC_URL),
});
```