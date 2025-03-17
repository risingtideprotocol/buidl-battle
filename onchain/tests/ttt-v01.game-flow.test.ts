import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { setupGame, playWinningGame, TEST_BUY_IN_STX, TEST_BUY_IN_SBTC } from "./helpers";

describe("TTT Game Flow", () => {
    const accounts = simnet.getAccounts();
    const player1 = accounts.get("wallet_1")!;
    const player2 = accounts.get("wallet_2")!;

    it("allows a complete game to be played", async () => {
        const { playerOneJoined, playerTwoJoined } = await setupGame(simnet, player1, player2);
        expect(playerOneJoined.result).toBeOk(Cl.bool(true));
        expect(playerTwoJoined.result).toBeOk(Cl.bool(true));

        const startMatch = await simnet.callPublicFn("ttt-v01", "start-match", [], player1);
        expect(startMatch.result).toBeOk(Cl.uint(1));

        await playWinningGame(simnet, player1, player2);

        const winner = await simnet.callReadOnlyFn(
            "ttt-v01",
            "get-match-winner",
            [Cl.uint(1)],
            player1
        );

        expect(winner.result).toBeOk(Cl.tuple({
            "match-winner": Cl.some(Cl.some(Cl.principal(player1)))
        }));
    });

    it("prevents same address from joining as both players", async () => {
        // First join as player 1 with STX
        const playerOneJoined = await simnet.callPublicFn(
            "ttt-v01",
            "player-buy-in",
            [Cl.principal(player1), Cl.uint(TEST_BUY_IN_STX)],
            player1
        );
        expect(playerOneJoined.result).toBeOk(Cl.bool(true));

        // Try to join as player 2 with same address using STX
        const playerTwoAttempt = await simnet.callPublicFn(
            "ttt-v01",
            "player-buy-in",
            [Cl.principal(player1), Cl.uint(TEST_BUY_IN_STX)],
            player1
        );
        expect(playerTwoAttempt.result).toBeErr(Cl.uint(2100)); // err-unauthorized

        // Also try with sBTC buy-in
        const playerTwoSbtcAttempt = await simnet.callPublicFn(
            "ttt-v01",
            "player-buy-in-sbtc",
            [Cl.principal(player1), Cl.uint(TEST_BUY_IN_SBTC)],
            player1
        );
        expect(playerTwoSbtcAttempt.result).toBeErr(Cl.uint(2100)); // err-unauthorized
    });
}); 