// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "forge-std/Script.sol";
import "forge-std/console2.sol";
import "../src/SlabRegistry.sol";

/**
 * @title DeploySlabLock
 * @notice Deploys SlabRegistry and seeds 3 sample graded Pokemon slabs (1 SEALED, 1 UNSEALED, 1 VOID).
 */
contract DeploySlabLock is Script {
    // Default Anvil account #0 private key fallback for local development
    uint256 internal constant DEFAULT_ANVIL_PK =
        0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;

    function run() external returns (SlabRegistry registry) {
        uint256 deployerPrivateKey = vm.envOr("DEPLOYER_PRIVATE_KEY", DEFAULT_ANVIL_PK);
        address deployer = vm.addr(deployerPrivateKey);
        address relayer = vm.envOr("RELAYER_ADDRESS", deployer);
        address collector = vm.envOr("COLLECTOR_ADDRESS", deployer);

        vm.startBroadcast(deployerPrivateKey);

        registry = new SlabRegistry(deployer, relayer);

        // 1. Mint Sample Graded Pokemon Slab #1 -> Remains SEALED
        // 1999 Pokemon Base Set 1st Edition Shadowless Holo Charizard #4 (PSA/SlabLock 10.0 Gem Mint)
        uint256 sealedTokenId = registry.mintSlab(
            collector,
            "CERT-PKMN-2026-0001",
            "04A1B2C3D4E501",
            100,
            SubGrades({centering: 100, surface: 100, corners: 100, edges: 100}),
            "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco"
        );

        // 2. Mint Sample Graded Pokemon Slab #2 -> Transitions to UNSEALED
        // 2006 Pokemon EX Dragon Frontiers Gold Star Rayquaza #107 (SlabLock 9.5 Mint+)
        uint256 unsealedTokenId = registry.mintSlab(
            collector,
            "CERT-PKMN-2026-0002",
            "04A1B2C3D4E502",
            95,
            SubGrades({centering: 95, surface: 95, corners: 100, edges: 90}),
            "QmZtmD2qtQgVPekm8a6ZububQ5D63Gzh9WAK7WeqBmyxyg"
        );
        registry.flagUnsealed(unsealedTokenId);

        // 3. Mint Sample Graded Pokemon Slab #3 -> Transitions to VOID
        // 1998 Pokemon Japanese CoroCoro Promo Pikachu Illustrator (SlabLock 9.0 Mint - Revoked/Void)
        uint256 voidTokenId = registry.mintSlab(
            collector,
            "CERT-PKMN-2026-0003",
            "04A1B2C3D4E503",
            90,
            SubGrades({centering: 90, surface: 90, corners: 90, edges: 90}),
            "QmPZ9gcCEpqKTo6aq61g2nXGUhM4iCL3ewB6LDXZCtioEB"
        );
        registry.flagVoid(voidTokenId);

        vm.stopBroadcast();

        console2.log("SlabRegistry deployed at:", address(registry));
        console2.log("Token #1 (SEALED) ID:", sealedTokenId);
        console2.log("Token #2 (UNSEALED) ID:", unsealedTokenId);
        console2.log("Token #3 (VOID) ID:", voidTokenId);
    }
}
