// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "forge-std/Test.sol";
import "../src/SlabRegistry.sol";
import "../script/DeploySlabLock.s.sol";

contract SlabRegistryTest is Test {
    SlabRegistry private registry;

    address private admin = address(0xAD);
    address private grader = address(0x6A);
    address private collector = address(0xC0);
    address private buyer = address(0xB1);

    uint256 private relayerPrivateKey = 0xA11CE;
    address private relayer;

    function setUp() public {
        relayer = vm.addr(relayerPrivateKey);

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
        assertEq(uint256(slab.currentState), uint256(ItemState.SEALED));
        assertEq(slab.overallGrade, 98);
        assertEq(slab.subGrades.centering, 100);
        assertEq(slab.subGrades.surface, 95);
        assertEq(slab.issuer, grader);
        assertEq(registry.tokenURI(tokenId), "ipfs://QmTestCID123");
        vm.stopPrank();
    }

    function test_RevertIf_UnauthorizedMint() public {
        vm.startPrank(collector);
        SubGrades memory grades = SubGrades(90, 90, 90, 90);

        vm.expectRevert();
        registry.mintSlab(collector, "CERT-FAKE", "UID-FAKE", 90, grades, "QmFake");
        vm.stopPrank();
    }

    function test_RevertIf_DuplicateCertOrHardware() public {
        vm.startPrank(grader);
        SubGrades memory grades = SubGrades(95, 95, 95, 95);

        registry.mintSlab(collector, "CERT-DUP", "UID-DUP", 95, grades, "QmCID1");

        vm.expectRevert(SlabRegistry.CertAlreadyRegistered.selector);
        registry.mintSlab(collector, "CERT-DUP", "UID-NEW", 95, grades, "QmCID2");

        vm.expectRevert(SlabRegistry.HardwareAlreadyRegistered.selector);
        registry.mintSlab(collector, "CERT-NEW", "UID-DUP", 95, grades, "QmCID3");
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
        assertEq(uint256(slab.currentState), uint256(ItemState.UNSEALED));

        // Attempting to unseal again must revert
        vm.prank(collector);
        vm.expectRevert(SlabRegistry.TerminalStateLocked.selector);
        registry.flagUnsealed(tokenId);

        // Attempting to initiate or cancel transfer from UNSEALED must revert
        vm.prank(collector);
        vm.expectRevert(SlabRegistry.TerminalStateLocked.selector);
        registry.initiateTransfer(tokenId);

        vm.prank(collector);
        vm.expectRevert(SlabRegistry.TerminalStateLocked.selector);
        registry.cancelTransfer(tokenId);
    }

    function test_FlagVoid_LocksTerminalState() public {
        vm.startPrank(grader);
        SubGrades memory grades = SubGrades(100, 100, 100, 100);
        uint256 tokenId = registry.mintSlab(collector, "CERT-VOID", "UID-VOID", 100, grades, "QmVoid");

        registry.flagVoid(tokenId);

        SlabRecord memory slab = registry.getSlab(tokenId);
        assertEq(uint256(slab.currentState), uint256(ItemState.VOID));

        vm.expectRevert(SlabRegistry.TerminalStateLocked.selector);
        registry.flagVoid(tokenId);

        vm.expectRevert(SlabRegistry.TerminalStateLocked.selector);
        registry.flagUnsealed(tokenId);
        vm.stopPrank();
    }

    function test_InTransit_And_CustodyTransfer_EIP712() public {
        vm.prank(grader);
        SubGrades memory grades = SubGrades(100, 100, 100, 100);
        uint256 tokenId = registry.mintSlab(collector, "CERT-TRANSIT", "UID-TRANSIT", 100, grades, "QmTransit");

        vm.prank(collector);
        registry.initiateTransfer(tokenId);
        assertEq(uint256(registry.getSlab(tokenId).currentState), uint256(ItemState.IN_TRANSIT));

        uint256 deadline = block.timestamp + 120;
        uint256 nonce = registry.nonces(tokenId);

        bytes32 structHash = keccak256(
            abi.encode(registry.CUSTODY_TRANSFER_TYPEHASH(), tokenId, buyer, nonce, deadline)
        );
        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", registry.domainSeparator(), structHash)
        );

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(relayerPrivateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.prank(buyer);
        registry.claimCustodyWithAttestation(tokenId, buyer, deadline, signature);

        assertEq(registry.ownerOf(tokenId), buyer);
        assertEq(uint256(registry.getSlab(tokenId).currentState), uint256(ItemState.SEALED));
        assertEq(registry.nonces(tokenId), 1);

        // Replaying the same signature must revert due to incremented nonce
        vm.prank(buyer);
        vm.expectRevert(SlabRegistry.InvalidSignature.selector);
        registry.claimCustodyWithAttestation(tokenId, buyer, deadline, signature);
    }

    function _signNfcAttestation(
        uint256 tokenId,
        string memory uid,
        uint256 readCounter,
        address clientAddr,
        uint256 deadline
    ) internal view returns (bytes memory) {
        bytes32 structHash = keccak256(
            abi.encode(
                registry.NFC_ATTESTATION_TYPEHASH(),
                tokenId,
                keccak256(abi.encodePacked(uid)),
                readCounter,
                clientAddr,
                registry.nonces(tokenId),
                deadline
            )
        );
        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", registry.domainSeparator(), structHash)
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(relayerPrivateKey, digest);
        return abi.encodePacked(r, s, v);
    }

    function test_VerifyNfcAttestation_And_ReplayProtection() public {
        string memory uid = "04A1B2C3D4E5F6";
        vm.prank(grader);
        SubGrades memory grades = SubGrades(95, 95, 95, 95);
        uint256 tokenId = registry.mintSlab(collector, "CERT-NFC", uid, 95, grades, "QmNfc");

        uint256 readCounter = 42;
        uint256 deadline = block.timestamp + 120;
        bytes memory sig = _signNfcAttestation(tokenId, uid, readCounter, collector, deadline);

        bool verified = registry.verifyNfcAttestation(tokenId, uid, readCounter, collector, deadline, sig);
        assertTrue(verified);
        assertEq(registry.lastReadCounters(tokenId), 42);

        // Attempt with non-incrementing counter (<= 42) must revert with ReplayAttackDetected
        vm.expectRevert(SlabRegistry.ReplayAttackDetected.selector);
        registry.verifyNfcAttestation(tokenId, uid, 42, collector, deadline, sig);
    }

    function test_PauseAndUnpause() public {
        vm.prank(admin);
        registry.pause();

        vm.prank(grader);
        SubGrades memory grades = SubGrades(95, 95, 95, 95);
        vm.expectRevert(Pausable.EnforcedPause.selector);
        registry.mintSlab(collector, "CERT-PAUSE", "UID-PAUSE", 95, grades, "QmPause");

        vm.prank(admin);
        registry.unpause();

        vm.prank(grader);
        uint256 tokenId = registry.mintSlab(collector, "CERT-PAUSE", "UID-PAUSE", 95, grades, "QmPause");
        assertEq(tokenId, 1);
    }

    function testFuzz_GradingRange(uint8 overallGrade) public {
        vm.assume(overallGrade <= 100);
        vm.startPrank(grader);
        SubGrades memory grades = SubGrades(overallGrade, overallGrade, overallGrade, overallGrade);

        uint256 tokenId = registry.mintSlab(collector, "FUZZ_CERT", "FUZZ_UID", overallGrade, grades, "QmFuzz");
        assertEq(registry.getSlab(tokenId).overallGrade, overallGrade);
        vm.stopPrank();
    }

    function testFuzz_RevertInvalidGradingRange(uint8 invalidGrade) public {
        vm.assume(invalidGrade > 100);
        vm.startPrank(grader);
        SubGrades memory grades = SubGrades(90, 90, 90, 90);

        vm.expectRevert(SlabRegistry.InvalidGrade.selector);
        registry.mintSlab(collector, "FUZZ_BAD_CERT", "FUZZ_BAD_UID", invalidGrade, grades, "QmBad");
        vm.stopPrank();
    }

    function testFuzz_MonotonicNfcReadCounters(uint32 counter1, uint32 counter2) public {
        vm.assume(counter1 > 0);
        string memory uid = "04DEADBEEFCAFE";

        vm.prank(grader);
        SubGrades memory grades = SubGrades(100, 100, 100, 100);
        uint256 tokenId = registry.mintSlab(collector, "CERT-FUZZ-NFC", uid, 100, grades, "QmFuzzNfc");

        uint256 deadline = block.timestamp + 120;

        // First tap
        bytes memory sig1 = _signNfcAttestation(tokenId, uid, uint256(counter1), collector, deadline);
        registry.verifyNfcAttestation(tokenId, uid, uint256(counter1), collector, deadline, sig1);

        // Second tap
        bytes memory sig2 = _signNfcAttestation(tokenId, uid, uint256(counter2), collector, deadline);

        if (counter2 <= counter1) {
            vm.expectRevert(SlabRegistry.ReplayAttackDetected.selector);
            registry.verifyNfcAttestation(tokenId, uid, uint256(counter2), collector, deadline, sig2);
        } else {
            bool ok = registry.verifyNfcAttestation(tokenId, uid, uint256(counter2), collector, deadline, sig2);
            assertTrue(ok);
            assertEq(registry.lastReadCounters(tokenId), uint256(counter2));
        }
    }

    function test_DeploySlabLockScript_SeedsThreeSlabs() public {
        DeploySlabLock deployScript = new DeploySlabLock();
        SlabRegistry seededRegistry = deployScript.run();

        assertEq(seededRegistry.totalSupply(), 3);
        assertEq(uint256(seededRegistry.getSlab(1).currentState), uint256(ItemState.SEALED));
        assertEq(uint256(seededRegistry.getSlab(2).currentState), uint256(ItemState.UNSEALED));
        assertEq(uint256(seededRegistry.getSlab(3).currentState), uint256(ItemState.VOID));
    }
}
