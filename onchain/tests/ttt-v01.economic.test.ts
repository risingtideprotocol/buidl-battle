import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { setupGame, TEST_BUY_IN_STX } from "./helpers";

describe("TTT Economic Features", () => {
    const accounts = simnet.getAccounts();
    const player1 = accounts.get("wallet_1")!;
    const player2 = accounts.get("wallet_2")!;

    describe("Buy-in Validation", () => {
        it("prevents incorrect buy-in amounts", async () => {
            const invalidBuyIn = await simnet.callPublicFn(
                "ttt-v01",
                "player-buy-in",
                [Cl.principal(player1), Cl.uint(500000)],
                player1
            );
            expect(invalidBuyIn.result).toBeErr(Cl.uint(3002)); // err-incorrect-buy-in
        });

        it("handles fee distribution correctly", async () => {
            await setupGame(simnet, player1, player2);

            const finalContractBalance = simnet.callReadOnlyFn(
                "ttt-v01",
                "get-match-balance",
                [],
                player1
            );

            // Verify contract received funds
            expect(finalContractBalance.result).toBeOk(Cl.uint(
                TEST_BUY_IN_STX
            ));

            // Verify creator cut
            const creatorCut = simnet.callReadOnlyFn(
                "ttt-v01",
                "get-creator-cut",
                [],
                player1
            );
            expect(creatorCut.result).toBeOk(Cl.uint(Math.floor(TEST_BUY_IN_STX * 0.5))); // 50% fee
        });
    });
}); 