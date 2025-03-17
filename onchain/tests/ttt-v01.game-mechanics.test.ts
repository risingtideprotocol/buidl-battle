import { Cl, cvToValue } from "@stacks/transactions";
import { describe, expect, it, beforeEach } from "vitest";
import { setupGame, playWinningGame, TEST_BUY_IN_STX } from "./helpers";

describe("TTT Game Mechanics", () => {
    const accounts = simnet.getAccounts();
    const player1 = accounts.get("wallet_1")!;
    const player2 = accounts.get("wallet_2")!;

    beforeEach(() => {
        // Reset contract state before each test
        simnet.mineBlock([]);
    });

    describe("Move Validation", () => {
        it("prevents moves on occupied squares", async () => {
            await setupGame(simnet, player1, player2);
            await simnet.callPublicFn("ttt-v01", "start-match", [], player1);

            // Make initial move (using turn 0)
            const move1 = await simnet.callPublicFn(
                "ttt-v01",
                "process-turn",
                [Cl.uint(0), Cl.uint(1), Cl.uint(0)],
                player1
            );
            // Expect ok false since this isn't a winning move
            expect(move1.result).toBeOk(Cl.bool(false));

            // Mine block to ensure first move is processed
            await simnet.mineBlock([]);

            // Try to play on same square
            const move2 = await simnet.callPublicFn(
                "ttt-v01",
                "process-turn",
                [Cl.uint(1), Cl.uint(2), Cl.uint(0)],
                player2
            );
            expect(move2.result).toBeErr(Cl.uint(3007)); // err-square-occupied
        });

        it("prevents moves out of turn", async () => {
            await setupGame(simnet, player1, player2);
            await simnet.callPublicFn("ttt-v01", "start-match", [], player1);

            // Player 2 tries to play first (using turn 0)
            const invalidMove = await simnet.callPublicFn(
                "ttt-v01",
                "process-turn",
                [Cl.uint(0), Cl.uint(2), Cl.uint(0)],
                player2
            );
            expect(invalidMove.result).toBeErr(Cl.uint(3005));
        });
    });

    describe("Win Conditions", () => {
        it("correctly identifies horizontal wins - top row", async () => {
            await setupGame(simnet, player1, player2);
            await simnet.callPublicFn("ttt-v01", "start-match", [], player1);

            // Player 1 plays top row (0,1,2)
            await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(1), Cl.uint(1), Cl.uint(0)], player1);
            await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(2), Cl.uint(2), Cl.uint(3)], player2);
            await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(3), Cl.uint(1), Cl.uint(1)], player1);
            await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(4), Cl.uint(2), Cl.uint(4)], player2);
            await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(5), Cl.uint(1), Cl.uint(2)], player1);

            const winner = await simnet.callReadOnlyFn("ttt-v01", "get-match-winner", [Cl.uint(1)], player1);
            expect(winner.result).toBeOk(Cl.tuple({
                "match-winner": Cl.some(Cl.some(Cl.principal(player1)))
            }));
        });

        it("correctly identifies vertical wins - left column", async () => {
            await setupGame(simnet, player1, player2);
            await simnet.callPublicFn("ttt-v01", "start-match", [], player1);

            // Player 1 plays left column (0,3,6)
            await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(1), Cl.uint(1), Cl.uint(0)], player1);
            await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(2), Cl.uint(2), Cl.uint(1)], player2);
            await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(3), Cl.uint(1), Cl.uint(3)], player1);
            await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(4), Cl.uint(2), Cl.uint(4)], player2);
            await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(5), Cl.uint(1), Cl.uint(6)], player1);

            const winner = await simnet.callReadOnlyFn("ttt-v01", "get-match-winner", [Cl.uint(1)], player1);
            expect(winner.result).toBeOk(Cl.tuple({
                "match-winner": Cl.some(Cl.some(Cl.principal(player1)))
            }));
        });

        it("correctly identifies diagonal wins - top-left to bottom-right", async () => {
            await setupGame(simnet, player1, player2);
            await simnet.callPublicFn("ttt-v01", "start-match", [], player1);

            // Use existing playWinningGame helper as it implements diagonal win
            await playWinningGame(simnet, player1, player2);

            const winner = await simnet.callReadOnlyFn("ttt-v01", "get-match-winner", [Cl.uint(1)], player1);
            expect(winner.result).toBeOk(Cl.tuple({
                "match-winner": Cl.some(Cl.some(Cl.principal(player1)))
            }));
        });

        it("correctly identifies draws", async () => {
            await setupGame(simnet, player1, player2);
            await simnet.callPublicFn("ttt-v01", "start-match", [], player1);

            // Play to a draw
            await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(1), Cl.uint(1), Cl.uint(0)], player1);
            await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(2), Cl.uint(2), Cl.uint(1)], player2);
            await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(3), Cl.uint(1), Cl.uint(2)], player1);
            await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(4), Cl.uint(2), Cl.uint(4)], player2);
            await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(5), Cl.uint(1), Cl.uint(7)], player1);
            await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(6), Cl.uint(2), Cl.uint(3)], player2);
            await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(7), Cl.uint(1), Cl.uint(5)], player1);
            await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(8), Cl.uint(2), Cl.uint(8)], player2);
            await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(9), Cl.uint(1), Cl.uint(6)], player1);

            const winner = await simnet.callReadOnlyFn("ttt-v01", "get-match-winner", [Cl.uint(1)], player1);
            expect(winner.result).toBeOk(Cl.tuple({
                "match-winner": Cl.some(Cl.none())
            }));

            const matchData = await simnet.callReadOnlyFn("ttt-v01", "get-match-data", [Cl.uint(1)], player1);
            expect(matchData.result).toBeOk(Cl.tuple({
                "square-0": Cl.some(Cl.tuple({ turn: Cl.uint(0), "player-number": Cl.uint(1), player: Cl.principal(player1) })),
                "square-1": Cl.some(Cl.tuple({ turn: Cl.uint(1), "player-number": Cl.uint(2), player: Cl.principal(player2) })),
                "square-2": Cl.some(Cl.tuple({ turn: Cl.uint(2), "player-number": Cl.uint(1), player: Cl.principal(player1) })),
                "square-3": Cl.some(Cl.tuple({ turn: Cl.uint(5), "player-number": Cl.uint(2), player: Cl.principal(player2) })),
                "square-4": Cl.some(Cl.tuple({ turn: Cl.uint(3), "player-number": Cl.uint(2), player: Cl.principal(player2) })),
                "square-5": Cl.some(Cl.tuple({ turn: Cl.uint(6), "player-number": Cl.uint(1), player: Cl.principal(player1) })),
                "square-6": Cl.some(Cl.tuple({ turn: Cl.uint(8), "player-number": Cl.uint(1), player: Cl.principal(player1) })),
                "square-7": Cl.some(Cl.tuple({ turn: Cl.uint(4), "player-number": Cl.uint(1), player: Cl.principal(player1) })),
                "square-8": Cl.some(Cl.tuple({ turn: Cl.uint(7), "player-number": Cl.uint(2), player: Cl.principal(player2) }))
            }));
        });
    });

    describe("Bomb Mechanics", () => {
        it("allows using a bomb on occupied square", async () => {
            await setupGame(simnet, player1, player2);
            await simnet.callPublicFn("ttt-v01", "start-match", [], player1);

            // Make initial move
            await simnet.callPublicFn(
                "ttt-v01",
                "process-turn",
                [Cl.uint(0), Cl.uint(1), Cl.uint(0)],
                player1
            );

            // Use bomb on the occupied square
            const bombResult = await simnet.callPublicFn(
                "ttt-v01",
                "use-bomb",
                [Cl.uint(0)],
                player2
            );
            expect(bombResult.result).toBeOk(Cl.bool(true));

            // Verify square is now empty
            const gameState = await simnet.callReadOnlyFn(
                "ttt-v01",
                "get-current-game-state",
                [],
                player1
            );
            const board = cvToValue(gameState.result).value.board;
            expect(board["square-0"]).toBe(undefined);
        });

        it("prevents using bomb on empty square", async () => {
            await setupGame(simnet, player1, player2);
            await simnet.callPublicFn("ttt-v01", "start-match", [], player1);

            const bombResult = await simnet.callPublicFn(
                "ttt-v01",
                "use-bomb",
                [Cl.uint(0)],
                player2
            );
            expect(bombResult.result).toBeErr(Cl.uint(3012)); // err-square-empty
        });

        it("tracks remaining bombs correctly", async () => {
            await setupGame(simnet, player1, player2);
            await simnet.callPublicFn("ttt-v01", "start-match", [], player1);

            // Make some moves
            await simnet.callPublicFn(
                "ttt-v01",
                "process-turn",
                [Cl.uint(0), Cl.uint(1), Cl.uint(0)],
                player1
            );
            await simnet.callPublicFn(
                "ttt-v01",
                "process-turn",
                [Cl.uint(1), Cl.uint(2), Cl.uint(1)],
                player2
            );

            // Use bombs and check remaining count
            const bombStatus1 = await simnet.callReadOnlyFn(
                "ttt-v01",
                "get-bomb-status",
                [],
                player1
            );
            expect(Number(cvToValue(bombStatus1.result).value['bombs-remaining'].value)).toBe(3);

            await simnet.callPublicFn("ttt-v01", "use-bomb", [Cl.uint(0)], player1);

            const bombStatus2 = await simnet.callReadOnlyFn(
                "ttt-v01",
                "get-bomb-status",
                [],
                player1
            );
            expect(Number(cvToValue(bombStatus2.result).value['bombs-remaining'].value)).toBe(2);
        });

        it("prevents using more than max bombs", async () => {
            await setupGame(simnet, player1, player2);
            await simnet.callPublicFn("ttt-v01", "start-match", [], player1);

            // Make moves to have squares to bomb
            await simnet.callPublicFn(
                "ttt-v01",
                "process-turn",
                [Cl.uint(0), Cl.uint(1), Cl.uint(0)],
                player1
            );
            await simnet.callPublicFn(
                "ttt-v01",
                "process-turn",
                [Cl.uint(1), Cl.uint(2), Cl.uint(1)],
                player2
            );
            await simnet.callPublicFn(
                "ttt-v01",
                "process-turn",
                [Cl.uint(2), Cl.uint(1), Cl.uint(2)],
                player1
            );
            await simnet.callPublicFn(
                "ttt-v01",
                "process-turn",
                [Cl.uint(3), Cl.uint(2), Cl.uint(3)],
                player2
            );

            // Use all 3 bombs
            await simnet.callPublicFn("ttt-v01", "use-bomb", [Cl.uint(0)], player1);
            await simnet.callPublicFn("ttt-v01", "use-bomb", [Cl.uint(1)], player1);
            await simnet.callPublicFn("ttt-v01", "use-bomb", [Cl.uint(2)], player1);

            // Try to use a fourth bomb
            const bombResult = await simnet.callPublicFn(
                "ttt-v01",
                "use-bomb",
                [Cl.uint(3)],
                player1
            );
            expect(bombResult.result).toBeErr(Cl.uint(3011)); // err-no-bombs-remaining
        });

        it("verifies bomb cost calculation", async () => {
            await setupGame(simnet, player1, player2);
            await simnet.callPublicFn("ttt-v01", "start-match", [], player1);

            const bombStatus = await simnet.callReadOnlyFn(
                "ttt-v01",
                "get-bomb-status",
                [],
                player1
            );
            
            // Bomb should cost 50% of buy-in
            expect(Number(cvToValue(bombStatus.result).value['bomb-cost'].value)).toBe(TEST_BUY_IN_STX * 0.5);
        });
    });
}); 