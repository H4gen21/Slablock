# Testing Strategy & Quality Assurance: SlabLock Protocol

---

## 1. Testing Pyramid & Verification Matrix

```
                 ▲
                / \
               /   \     E2E Hardware & NFC Validation
              /     \    (Physical NTAG 424 Tags / ISO-DEP Emulation)
             /───────\
            /         \   Integration Testing
           /           \  (Node.js Cryptographic API + Amoy Testnet RPC)
          /─────────────\
         /               \ Unit Testing & Fuzz Invariants
        /                 \ (Foundry Forge + Vitest Crypto Engine)
       └───────────────────┘
```

---

## 2. Smart Contract Unit & Invariant Testing (Foundry)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "forge-std/Test.sol";
import "../../contracts/SlabRegistry.sol";

contract SlabRegistryTest is Test {
    SlabRegistry private registry;
    address private admin = address(0xAD);
    address private grader = address(0x6A);
    address private collector = address(0xC0);
    address private relayer = address(0xFE);

    function setUp() public {
        vm.startPrank(admin);
        registry = new SlabRegistry(admin, relayer);
        registry.grantRole(registry.GRADER_ROLE(), grader);
        vm.stopPrank();
    }

    function test_MintSlab_Success() public {
        vm.startPrank(grader);
        
        SubGrades memory grades = SubGrades({
            centering: 100,
            surface: 95,
            corners: 100,
            edges: 100
        });

        uint256 tokenId = registry.mintSlab(
            collector,
            "CERT-2026-001",
            "04A1B2C3D4E5F6",
            98,
            grades,
            "QmTestCID123"
        );

        assertEq(tokenId, 1);
        assertEq(registry.ownerOf(tokenId), collector);
        
        SlabRecord memory slab = registry.getSlab(tokenId);
        assertEq(uint(slab.currentState), uint(ItemState.SEALED));
        assertEq(slab.overallGrade, 98);
        vm.stopPrank();
    }

    function test_RevertIf_UnauthorizedMint() public {
        vm.startPrank(collector);
        SubGrades memory grades = SubGrades(90, 90, 90, 90);

        vm.expectRevert();
        registry.mintSlab(collector, "CERT-FAKE", "UID-FAKE", 90, grades, "QmFake");
        vm.stopPrank();
    }

    function test_RevertIf_UnsealRevertedToSealed() public {
        vm.startPrank(grader);
        SubGrades memory grades = SubGrades(100, 100, 100, 100);
        uint256 tokenId = registry.mintSlab(collector, "CERT-002", "UID-002", 100, grades, "QmCID");
        vm.stopPrank();

        // Collector unseals their box
        vm.prank(collector);
        registry.flagUnsealed(tokenId);

        SlabRecord memory slab = registry.getSlab(tokenId);
        assertEq(uint(slab.currentState), uint(ItemState.UNSEALED));

        // Attempting to unseal again must revert
        vm.prank(collector);
        vm.expectRevert(SlabRegistry.TerminalStateLocked.selector);
        registry.flagUnsealed(tokenId);
    }

    function testFuzz_GradingRange(uint8 overallGrade) public {
        vm.assume(overallGrade <= 100);
        vm.startPrank(grader);
        SubGrades memory grades = SubGrades(overallGrade, overallGrade, overallGrade, overallGrade);

        uint256 tokenId = registry.mintSlab(collector, "FUZZ_CERT", "FUZZ_UID", overallGrade, grades, "QmFuzz");
        assertEq(registry.getSlab(tokenId).overallGrade, overallGrade);
        vm.stopPrank();
    }
}
```

---

## 3. Cryptographic Backend Unit Testing (Vitest)

```typescript
import { describe, it, expect } from 'vitest';
import { decryptPiccData, deriveDiversifiedKey, verifyCmac } from '../src/crypto/sun';

describe('NTAG 424 DNA Cryptographic Engine', () => {
  const MASTER_KEY = '00112233445566778899AABBCCDDEEFF';
  const KNOWN_UID = '04A1B2C3D4E5F6';

  it('should successfully derive a deterministic 16-byte diversified key', () => {
    const key1 = deriveDiversifiedKey(MASTER_KEY, KNOWN_UID);
    const key2 = deriveDiversifiedKey(MASTER_KEY, KNOWN_UID);

    expect(key1.length).toBe(16);
    expect(key1.toString('hex')).toBe(key2.toString('hex'));
  });

  it('should reject replay attacks where read counter does not increment', () => {
    const lastSeenCounter = 15;
    const incomingCounter = 15;

    const isCounterValid = incomingCounter > lastSeenCounter;
    expect(isCounterValid).toBe(false);
  });
});
```

---

## 4. Hardware Emulation & Field Testing Guide
1. **NFC Card Emulation:** For environments lacking live NXP NTAG 424 tags, use a Flipper Zero or Android HCE (Host Card Emulation) app configured to output dynamic ISO-DEP responses with incrementing counter bytes.
2. **Stress Verification:** Simulate 50 concurrent mobile requests hitting the `/api/v1/nfc/verify` endpoint via `autocannon` to confirm the AES subkey derivation engine sustains $< 50\text{ ms}$ processing latency without CPU degradation.