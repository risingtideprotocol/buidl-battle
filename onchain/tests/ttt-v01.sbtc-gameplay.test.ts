import { Cl, cvToValue } from "@stacks/transactions";
import { describe, expect, it, beforeEach } from "vitest";
import { TEST_BUY_IN_SBTC } from "./helpers";
import { initSimnet } from "@hirosystems/clarinet-sdk";

const simnet = await initSimnet();

describe("TTT sBTC Gameplay", () => {
    const accounts = simnet.getAccounts();
    const deployer = accounts.get("deployer")!;
    const player1 = accounts.get("wallet_1")!;
    const player2 = accounts.get("wallet_2")!;

    beforeEach(async () => {
        // Reset contract state
        simnet.mineBlock([]);
        
        // Set preferred currency to sBTC
        await simnet.callPublicFn(
            "ttt-v01", 
            "set-preferred-currency", 
            [Cl.uint(2)],  // currency-sbtc = 2
            deployer
        );
        
        // Get test sBTC for players using faucet
        await simnet.callPublicFn("sbtc-token", "faucet", [], player1);
        await simnet.callPublicFn("sbtc-token", "faucet", [], player2);
    });

    const setupSbtcGame = async () => {
        const playerOneJoined = await simnet.callPublicFn(
            "ttt-v01",
            "player-buy-in-sbtc",
            [Cl.principal(player1), Cl.uint(TEST_BUY_IN_SBTC)],
            player1
        );

        const playerTwoJoined = await simnet.callPublicFn(
            "ttt-v01",
            "player-buy-in-sbtc",
            [Cl.principal(player2), Cl.uint(TEST_BUY_IN_SBTC)],
            player2
        );

        return { playerOneJoined, playerTwoJoined };
    };

    describe("sBTC Buy-in", () => {
        it("allows players to join with sBTC", async () => {
            const { playerOneJoined, playerTwoJoined } = await setupSbtcGame();
            expect(playerOneJoined.result).toBeOk(Cl.bool(true));
            expect(playerTwoJoined.result).toBeOk(Cl.bool(true));
        });

        it("verifies sBTC transfer to contract", async () => {
            await setupSbtcGame();
            
            const contractBalance = await simnet.callReadOnlyFn(
                "sbtc-token",
                "get-balance",
                [Cl.principal(`${simnet.deployer}.ttt-v01`)],
                player1
            );
            
            expect(contractBalance.result).toBeOk(Cl.uint(TEST_BUY_IN_SBTC));
        });

        it("fails when player has insufficient sBTC balance", async () => {
            // Try to buy in with more sBTC than player has (>1,000,000)
            const result = await simnet.callPublicFn(
                "ttt-v01",
                "player-buy-in-sbtc",
                [Cl.principal(player1), Cl.uint(TEST_BUY_IN_SBTC + 100000000)],
                player1
            );

            // Should fail with ERR_INSUFFICIENT_BALANCE from sBTC contract
            expect(result.result).toBeErr(Cl.uint(3002)); 
        });
    });

    describe("sBTC Winnings Distribution", () => {
        it("correctly distributes sBTC to winner", async () => {
            await setupSbtcGame();
            await simnet.callPublicFn("ttt-v01", "start-match", [], player1);

            // Play winning sequence for player1
            await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(0), Cl.uint(1), Cl.uint(0)], player1);
            await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(1), Cl.uint(2), Cl.uint(3)], player2);
            await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(2), Cl.uint(1), Cl.uint(1)], player1);
            await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(3), Cl.uint(2), Cl.uint(4)], player2);
            await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(4), Cl.uint(1), Cl.uint(2)], player1);

            const initialBalance = await simnet.callReadOnlyFn(
                "sbtc-token",
                "get-balance",
                [Cl.principal(player1)],
                player1
            );

            // Claim winnings
            await simnet.callPublicFn("ttt-v01", "claim", [Cl.uint(1)], player1);

            const finalBalance = await simnet.callReadOnlyFn(
                "sbtc-token",
                "get-balance",
                [Cl.principal(player1)],
                player1
            );

            // Winner should receive 50% of total buy-ins
            const expectedWinnings = TEST_BUY_IN_SBTC;
            expect(finalBalance.result).toBeOk(
                Cl.uint(BigInt(cvToValue(initialBalance.result).value) + BigInt(expectedWinnings))
            );
        });

        it("correctly handles sBTC distribution in draw", async () => {
            await setupSbtcGame();
            await simnet.callPublicFn("ttt-v01", "start-match", [], player1);

            // Play to a draw
            await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(0), Cl.uint(1), Cl.uint(0)], player1); // P1: 0 (top left)
            await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(1), Cl.uint(2), Cl.uint(1)], player2); // P2: 1 (top middle)
            await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(2), Cl.uint(1), Cl.uint(2)], player1); // P1: 2 (top right)
            await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(3), Cl.uint(2), Cl.uint(6)], player2); // P2: 6 (bottom left)
            await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(4), Cl.uint(1), Cl.uint(3)], player1); // P1: 3 (middle left)
            await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(5), Cl.uint(2), Cl.uint(5)], player2); // P2: 5 (middle right)
            await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(6), Cl.uint(1), Cl.uint(7)], player1); // P1: 7 (bottom middle)
            await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(7), Cl.uint(2), Cl.uint(8)], player2); // P2: 8 (bottom right)
            await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(8), Cl.uint(1), Cl.uint(4)], player1); // P1: 4 (center)

            // Check player initial balance
            const initialBalance = await simnet.callReadOnlyFn(
                "sbtc-token",
                "get-balance",
                [Cl.principal(player1)],
                player1
            );

            // Claim draw
            await simnet.callPublicFn("ttt-v01", "claim-draw", [Cl.uint(1)], player1);
            
            // Mine a block to process the sBTC transfer
            await simnet.mineBlock([]);

            // Check player final balance
            const finalBalance = await simnet.callReadOnlyFn(
                "sbtc-token",
                "get-balance",
                [Cl.principal(player1)],
                player1
            );

            // Each player should receive 50% of their original buy-in back
            const expectedReturn = TEST_BUY_IN_SBTC / 2;
            expect(finalBalance.result).toBeOk(
                Cl.uint(BigInt(cvToValue(initialBalance.result).value) + BigInt(expectedReturn))
            );
        });
    
    });
}); 