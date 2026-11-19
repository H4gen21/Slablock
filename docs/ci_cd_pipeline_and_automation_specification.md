# CI/CD Pipeline & Automation Specification: SlabLock Protocol

---

## 1. Automation Workflow Architecture

```
Push / Pull Request
       │
       ▼
┌────────────────────────────────────────────────────────┐
│             GitHub Actions Unified Matrix              │
│                                                        │
│  Job 1: Smart Contracts (Foundry)                      │
│  ├── forge build --sizes                               │
│  ├── forge test -vvv                                   │
│  └── Slither Static Security Audit                     │
│                                                        │
│  Job 2: Backend Relayer Service (Node.js)              │
│  ├── npm run lint (ESLint + Prettier)                  │
│  ├── npm run test:coverage (Vitest)                    │
│  └── Prisma Schema Validation & Migration Dry-Run      │
│                                                        │
│  Job 3: Mobile Client (React Native / Expo)           │
│  ├── expo doctor (Dependency Verification)             │
│  └── tsc --noEmit (TypeScript Compilation Check)       │
└────────────────────────────────────────────────────────┘
```

---

## 2. GitHub Actions Workflow Configuration (`.github/workflows/main.yml`)

```yaml
name: SlabLock Verification Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  contracts-audit-and-test:
    name: Foundry Test & Security Audit
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Codebase
        uses: actions/checkout@v4
        with:
          submodules: recursive

      - name: Install Foundry Toolchain
        uses: foundry-rs/foundry-toolchain@v1
        with:
          version: nightly

      - name: Verify Contract Sizing & Compilation
        run: |
          forge --version
          forge build --sizes

      - name: Run Foundry Unit & Fuzz Tests
        run: forge test -vvv

      - name: Run Slither Static Analysis
        uses: crytic/slither-action@v0.3.0
        continue-on-error: false
        with:
          ignore-compile: true
          fail-on: medium

  backend-relay-test:
    name: Node.js Relay & Crypto Verification
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Codebase
        uses: actions/checkout@v4

      - name: Setup Node.js v20 LTS
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json

      - name: Install Dependencies
        working-directory: ./backend
        run: npm ci

      - name: Validate Prisma Schema
        working-directory: ./backend
        run: npx prisma validate

      - name: Run Cryptographic Unit Tests
        working-directory: ./backend
        run: npm run test:coverage

  mobile-client-check:
    name: Mobile Typecheck & Validation
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Codebase
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
          cache-dependency-path: mobile/package-lock.json

      - name: Install Dependencies
        working-directory: ./mobile
        run: npm ci

      - name: Static Typecheck (tsc)
        working-directory: ./mobile
        run: npx tsc --noEmit
```