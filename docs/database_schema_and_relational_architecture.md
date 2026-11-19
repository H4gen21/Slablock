# Database Schema & Entity-Relationship Architecture: SlabLock Protocol

---

## 1. Relational Entity-Relationship Diagram (ERD)

```
┌────────────────────────┐             1:N             ┌─────────────────────────┐
│     grading_houses     ├────────────────────────────►│       slab_assets       │
├────────────────────────┤                             ├─────────────────────────┤
│ id (PK)                │                             │ token_id (PK)           │
│ name                   │                             │ cert_id (Unique)        │
│ wallet_address (Unique)│                             │ tag_uid (FK, Unique)    │
│ is_authorized          │                             │ issuer_id (FK)          │
│ created_at             │                             │ card_name               │
└────────────────────────┘                             │ card_set                │
                                                       │ overall_grade           │
┌────────────────────────┐             1:1             │ centering_grade         │
│     physical_tags      ├────────────────────────────►│ surface_grade           │
├────────────────────────┤                             │ corners_grade           │
│ uid (PK)               │                             │ edges_grade             │
│ diversified_key        │                             │ current_state           │
│ last_counter           │                             │ ipfs_metadata_cid       │
│ tamper_status          │                             │ current_owner_wallet    │
│ created_at             │                             │ created_at              │
└────────────────────────┘                             └────────────┬────────────┘
                                                                    │
                                                                    │ 1:N
                                                                    ▼
                                                       ┌─────────────────────────┐
                                                       │    state_transitions    │
                                                       ├─────────────────────────┤
                                                       │ id (PK)                 │
                                                       │ token_id (FK)           │
                                                       │ from_state              │
                                                       │ to_state                │
                                                       │ tx_hash                 │
                                                       │ triggered_by            │
                                                       │ timestamp               │
                                                       └─────────────────────────┘
```

---

## 2. Prisma Schema Definition (`schema.prisma`)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum ItemState {
  MINTED
  SEALED
  IN_TRANSIT
  UNSEALED
  VOID
}

enum TamperStatus {
  INTACT
  BREACHED
}

model GradingHouse {
  id            String      @id @default(uuid()) @db.Uuid
  name          String      @db.VarChar(100)
  walletAddress String      @unique @map("wallet_address") @db.VarChar(42)
  isAuthorized  Boolean     @default(true) @map("is_authorized")
  createdAt     DateTime    @default(now()) @map("created_at") @db.Timestamptz
  slabs         SlabAsset[]

  @@map("grading_houses")
}

model PhysicalTag {
  uid            String       @id @db.VarChar(32)
  diversifiedKey String       @map("diversified_key") @db.VarChar(64)
  lastCounter    Int          @default(0) @map("last_counter")
  tamperStatus   TamperStatus @default(INTACT) @map("tamper_status")
  createdAt      DateTime     @default(now()) @map("created_at") @db.Timestamptz
  slabAsset      SlabAsset?

  @@map("physical_tags")
}

model SlabAsset {
  tokenId            BigInt             @id @map("token_id")
  certId             String             @unique @map("cert_id") @db.VarChar(50)
  tagUid             String             @unique @map("tag_uid") @db.VarChar(32)
  issuerId           String             @map("issuer_id") @db.Uuid
  cardName           String             @map("card_name") @db.VarChar(255)
  cardSet            String             @map("card_set") @db.VarChar(255)
  overallGrade       Decimal            @map("overall_grade") @db.Decimal(3, 1)
  centeringGrade     Decimal            @map("centering_grade") @db.Decimal(3, 1)
  surfaceGrade       Decimal            @map("surface_grade") @db.Decimal(3, 1)
  cornersGrade       Decimal            @map("corners_grade") @db.Decimal(3, 1)
  edgesGrade         Decimal            @map("edges_grade") @db.Decimal(3, 1)
  currentState       ItemState          @default(MINTED) @map("current_state")
  ipfsMetadataCid    String             @map("ipfs_metadata_cid") @db.VarChar(100)
  currentOwnerWallet String             @map("current_owner_wallet") @db.VarChar(42)
  createdAt          DateTime           @default(now()) @map("created_at") @db.Timestamptz

  issuer             GradingHouse       @relation(fields: [issuerId], references: [id])
  tag                PhysicalTag        @relation(fields: [tagUid], references: [uid])
  transitions        StateTransition[]

  @@index([currentOwnerWallet])
  @@index([currentState])
  @@map("slab_assets")
}

model StateTransition {
  id          String    @id @default(uuid()) @db.Uuid
  tokenId     BigInt    @map("token_id")
  fromState   ItemState @map("from_state")
  toState     ItemState @map("to_state")
  txHash      String    @unique @map("tx_hash") @db.VarChar(66)
  triggeredBy String    @map("triggered_by") @db.VarChar(42)
  timestamp   DateTime  @default(now()) @db.Timestamptz

  slab        SlabAsset @relation(fields: [tokenId], references: [tokenId], onDelete: Cascade)

  @@index([tokenId])
  @@map("state_transitions")
}
```

---

## 3. Data Integrity & Migration Strategy
- **Strict Referential Integrity:** Foreign keys enforce cascading constraints; a `SlabAsset` cannot be instantiated without a valid, pre-registered `PhysicalTag` entry.
- **Monotonic Sequence Indexing:** The `PhysicalTag.lastCounter` field updates in an isolated database transaction (`SERIALIZABLE`) to prevent race conditions during rapid NFC taps.