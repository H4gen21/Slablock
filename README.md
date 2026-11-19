# SlabLock

Tamper-evident provenance for graded trading card slabs.

Each slab carries an **NXP NTAG 424 DNA** chip. Every tap produces a fresh, signed URL (SUN message with a CMAC and a rolling read counter). A backend relay checks that signature and the counter against the on-chain record, so a copied URL or a cloned label fails verification. The slab's lifecycle (sealed, in transit, unsealed, void) lives in a smart contract, and the grading details are pinned to IPFS.

> Status: in active development. The mobile app runs fully on demo data. The relay and contracts work locally but are not yet deployed.

## What's in the repo

```
.
├── contracts/   Solidity (Foundry) – SlabRegistry state machine + deploy script
├── backend/     Node.js relay (Fastify, Prisma/PostgreSQL, viem, Pinata/IPFS)
├── mobile/      Expo / React Native app (also runs on the web)
├── docs/        PRD, architecture, security, API, database, testing and CI/CD specs
└── .github/     CI: Foundry build + tests, backend build + tests against Postgres
```

### contracts/
`SlabRegistry.sol` tracks each slab as a token with a finite state machine:

```
MINTED ──► SEALED ◄──► IN_TRANSIT
              │
              ▼
     UNSEALED / VOID   (terminal, can never return to SEALED)
```

Key functions: `mintSlab`, `initiateTransfer`, `cancelTransfer`, `claimCustodyWithAttestation` (the new owner claims custody with a signature from the relay, issued only after a valid chip tap).

### backend/
| Route | Purpose |
| --- | --- |
| `POST /api/v1/nfc/verify` | Verify a chip tap (SUN/CMAC + replay counter) and return the certificate plus a short-lived custody claim signature |
| `GET /api/v1/slabs` | List registered slabs |
| `POST /api/v1/slabs/:tokenId/claim` | Record a custody claim |
| `POST /api/v1/grading/encapsulate` | Register a newly graded and encapsulated slab |
| `POST /api/v1/metadata/pin` | Pin the card manifest and macro images to IPFS |
| `GET /health` | Health check |

### mobile/
Screens: sign-in, home, collection, tap-to-verify (NFC), slab detail, transfer, activity and profile. The slab detail screen is a grade report: grade and region scores, a card viewer with zoom and a defect overlay, a dings table and map, corner and edge close-ups, and the chip and on-chain record with custody claim and transfer.

## Running it locally

**Requirements:** Node.js 20+, [Foundry](https://getfoundry.sh/), and PostgreSQL 16 (for the backend).

### Mobile app (web, demo data)
The quickest way to see the app. No backend needed.

```bash
cd mobile
npm ci
npm run dev          # http://localhost:8081
```

Useful demo links:
- `http://localhost:8081/?screen=detail-charizard&demo=1` – a perfect 10, mostly empty-state report
- `http://localhost:8081/?screen=detail-pikachu&demo=1` – a 9.5 with two dings

On a phone, NFC needs a native build (`npx expo prebuild`, then `npx expo run:android`) on a physical device.

### Backend relay
```bash
cd backend
npm ci
cp .env.example .env   # then set PORT=4000 – the app calls localhost:4000
npx prisma migrate dev --name init
npm run dev
npm test
```

### Contracts
```bash
cd contracts
forge install OpenZeppelin/openzeppelin-contracts@v5.0.2 foundry-rs/forge-std@v1.17.0
forge build --sizes
forge test -vvv
```

For a full local stack, run `anvil` and deploy with `contracts/script/DeploySlabLock.s.sol`. Then point `POLYGON_RPC_URL` and `SLAB_REGISTRY_ADDRESS` in `backend/.env` at it.

> The keys in `.env.example` are public test values (the Hardhat/Anvil default account and a sequential AES test key). Never use them outside local development.

## Branches
- `develop` – main line of work
- `feature/*` – feature branches, merged into `develop`
- Tag `pre-dig-report` – the app before the grade report redesign

## Documentation
The detailed specs are in [`docs/`](docs/):
[requirements](docs/project_requirements_document_prd.md) ·
[architecture](docs/system_architecture_technical_specification.md) ·
[blockchain & security](docs/blockchain_and_security_specification.md) ·
[API & crypto relay](docs/api_and_cryptographic_relay_specification.md) ·
[database](docs/database_schema_and_relational_architecture.md) ·
[testing](docs/testing_strategy_and_quality_assurance.md) ·
[CI/CD](docs/ci_cd_pipeline_and_automation_specification.md)
