import { Cl, cvToValue } from "@stacks/transactions";
import { describe, expect, it, beforeEach } from "vitest";
import { setupGame, playWinningGame } from "./helpers";

describe("TTT Edge Cases", () => {
    const accounts = simnet.getAccounts();
    const player1 = accounts.get("wallet_1")!;
    const player2 = accounts.get("wallet_2")!;
    const player3 = accounts.get("wallet_3")!;

    beforeEach(() => {
        // Reset contract state before each test
        simnet.mineBlock([]);
    });

    describe("Game State Functions", () => {
        it("returns correct fee info", async () => {
            const feeInfo = await simnet.callReadOnlyFn(
                "ttt-v01",
                "get-fee-info",
                [],
                player1
            );
            expect(feeInfo.result).toBeOk(Cl.tuple({
                "creator-cut": Cl.uint(500000),
                "match-cut": Cl.uint(500000),
                "creator-info": Cl.tuple({
                    "creator-1": Cl.tuple({
                        "percent-of-100": Cl.uint(100),
                        "name": Cl.stringAscii("DeOrganized"),
                        "address": Cl.principal("ST3VZSF1PEM2Q1780M589P5DT53W4Y0YK4M3T7923")
                    })
                })
            }));
        });

        it("returns correct current game state", async () => {
            await setupGame(simnet, player1, player2);
            await simnet.callPublicFn("ttt-v01", "start-match", [], player1);
            
            const gameState = await simnet.callReadOnlyFn(
                "ttt-v01",
                "get-current-game-state",
                [],
                player1
            );
            expect(gameState.result).toBeOk(Cl.tuple({
                "active-player": Cl.principal(player1),
                "turn-number": Cl.uint(0),
                "match-in-progress": Cl.bool(true),
                "current-match-id": Cl.uint(1),
                "board": Cl.tuple({
                    "square-0": Cl.none(),
                    "square-1": Cl.none(),
                    "square-2": Cl.none(),
                    "square-3": Cl.none(),
                    "square-4": Cl.none(),
                    "square-5": Cl.none(),
                    "square-6": Cl.none(),
                    "square-7": Cl.none(),
                    "square-8": Cl.none()
                })
            }));
        });

        it("returns correct match history", async () => {
            await setupGame(simnet, player1, player2);
            await simnet.callPublicFn("ttt-v01", "start-match", [], player1);
            await playWinningGame(simnet, player1, player2);
            
            const matchHistory = await simnet.callReadOnlyFn(
                "ttt-v01",
                "get-match-history",
                [Cl.uint(1)],
                player1
            );
            expect(matchHistory.result).toBeOk(Cl.tuple({
                "winner": Cl.some(Cl.some(Cl.principal(player1))),
                "board": Cl.tuple({
                    "square-0": Cl.some(Cl.tuple({
                        "turn": Cl.uint(0),
                        "player-number": Cl.uint(1),
                        "player": Cl.principal(player1)
                    })),
                    "square-5": Cl.some(Cl.tuple({
                        "turn": Cl.uint(1),
                        "player-number": Cl.uint(2),
                        "player": Cl.principal(player2)
                    })),
                    "square-1": Cl.some(Cl.tuple({
                        "turn": Cl.uint(2),
                        "player-number": Cl.uint(1),
                        "player": Cl.principal(player1)
                    })),
                    "square-7": Cl.some(Cl.tuple({
                        "turn": Cl.uint(3),
                        "player-number": Cl.uint(2),
                        "player": Cl.principal(player2)
                    })),
                    "square-2": Cl.some(Cl.tuple({
                        "turn": Cl.uint(4),
                        "player-number": Cl.uint(1),
                        "player": Cl.principal(player1)
                    })),
                    "square-3": Cl.none(),
                    "square-4": Cl.none(),
                    "square-6": Cl.none(),
                    "square-8": Cl.none()
                }),
                "items-used": Cl.uint(0),
                "nft-owner": Cl.none()
            }));
        });
    });

    describe("Move Validation", () => {
        it("prevents moves on out-of-bounds squares", async () => {
            await setupGame(simnet, player1, player2);
            await simnet.callPublicFn("ttt-v01", "start-match", [], player1);
            
            const invalidMove = await simnet.callPublicFn(
                "ttt-v01",
                "process-turn",
                [Cl.uint(0), Cl.uint(1), Cl.uint(9)],
                player1
            );
            expect(invalidMove.result).toBeErr(Cl.uint(3006)); // err-greater-than-zero
        });

        it("prevents moves after game ends", async () => {
            await setupGame(simnet, player1, player2);
            await simnet.callPublicFn("ttt-v01", "start-match", [], player1);
            await playWinningGame(simnet, player1, player2);
            
            const postGameMove = await simnet.callPublicFn(
                "ttt-v01",
                "process-turn",
                [Cl.uint(6), Cl.uint(1), Cl.uint(8)],
                player1
            );
            expect(postGameMove.result).toBeErr(Cl.uint(3001)); // err-match-over
        });
    });

    describe("Player Management", () => {
        it("prevents third player from joining", async () => {
            await setupGame(simnet, player1, player2);
            
            const player3Join = await simnet.callPublicFn(
                "ttt-v01",
                "player-buy-in",
                [Cl.principal(player3), Cl.uint(1000000)],
                player3
            );
            expect(player3Join.result).toBeErr(Cl.uint(3004)); // err-too-many-players
        });

        it("prevents starting match with only one player", async () => {
            // Only player1 joins
            await simnet.callPublicFn(
                "ttt-v01",
                "player-buy-in",
                [Cl.principal(player1), Cl.uint(1000000)],
                player1
            );

            const startMatch = await simnet.callPublicFn(
                "ttt-v01",
                "start-match",
                [],
                player1
            );
            expect(startMatch.result).toBeErr(Cl.uint(3003)); // err-not-enough-players
        });
    });

    describe("Economic Mechanics", () => {
        it("correctly handles claims after game ends", async () => {
            await setupGame(simnet, player1, player2);
            await simnet.callPublicFn("ttt-v01", "start-match", [], player1);
            await playWinningGame(simnet, player1, player2);
            
            const claim = await simnet.callPublicFn(
                "ttt-v01",
                "claim",
                [Cl.uint(1)],
                player1
            );
            expect(claim.result).toBeOk(Cl.bool(true));
        });

        it("prevents claiming rewards for non-existent match", async () => {
            const invalidClaim = await simnet.callPublicFn(
                "ttt-v01",
                "claim",
                [Cl.uint(999)],
                player1
            );
            expect(invalidClaim.result).toBeErr(Cl.uint(4004)); // err-not-found
        });

        it("prevents non-winner from claiming rewards", async () => {
            await setupGame(simnet, player1, player2);
            await simnet.callPublicFn("ttt-v01", "start-match", [], player1);
            await playWinningGame(simnet, player1, player2);
            
            const invalidClaim = await simnet.callPublicFn(
                "ttt-v01",
                "claim",
                [Cl.uint(1)],
                player2
            );
            expect(invalidClaim.result).toBeErr(Cl.uint(2100)); // err-unauthorized
        });

        it("allows winner to burn their award NFT", async () => {
            await setupGame(simnet, player1, player2);
            await simnet.callPublicFn("ttt-v01", "start-match", [], player1);
            await playWinningGame(simnet, player1, player2);
            
            // Claim the award first
            await simnet.callPublicFn(
                "ttt-v01",
                "claim",
                [Cl.uint(1)],
                player1
            );

            // Try to burn the award
            const burnResult = await simnet.callPublicFn(
                "ttt-v01",
                "burn-award",
                [Cl.uint(1)],
                player1
            );
            expect(burnResult.result).toBeOk(Cl.bool(true));
        });

        it("prevents non-owner from burning award NFT", async () => {
            await setupGame(simnet, player1, player2);
            await simnet.callPublicFn("ttt-v01", "start-match", [], player1);
            await playWinningGame(simnet, player1, player2);
            
            // Claim the award first
            await simnet.callPublicFn(
                "ttt-v01",
                "claim",
                [Cl.uint(1)],
                player1
            );

            // Try to burn the award as non-owner
            const burnResult = await simnet.callPublicFn(
                "ttt-v01",
                "burn-award",
                [Cl.uint(1)],
                player2
            );
            expect(burnResult.result).toBeErr(Cl.uint(2100)); // err-unauthorized
        });

        it("prevents burning non-existent award", async () => {
            const burnResult = await simnet.callPublicFn(
                "ttt-v01",
                "burn-award",
                [Cl.uint(999)],
                player1
            );
            expect(burnResult.result).toBeErr(Cl.uint(2002)); // err-unknown-match
        });

        it("correctly handles draw claims", async () => {
            await setupGame(simnet, player1, player2);
            const startResult = await simnet.callPublicFn("ttt-v01", "start-match", [], player1);
            const rawValue = cvToValue(startResult.result);
            const matchId = Number(rawValue.value);  // Extract the string value and convert to number

            // Play to a draw (X is player1, O is player2)
            // X O X
            // O O X 
            // X X O
            await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(0), Cl.uint(1), Cl.uint(0)], player1);  // X: top-left
            await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(1), Cl.uint(2), Cl.uint(1)], player2);  // O: top-middle
            await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(2), Cl.uint(1), Cl.uint(2)], player1);  // X: top-right
            await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(3), Cl.uint(2), Cl.uint(3)], player2);  // O: middle-left
            await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(5), Cl.uint(1), Cl.uint(5)], player1);  // X: middle-right
            await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(4), Cl.uint(2), Cl.uint(4)], player2);  // O: center
            await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(6), Cl.uint(1), Cl.uint(6)], player1);  // X: bottom-left
            await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(8), Cl.uint(2), Cl.uint(8)], player2);  // O: bottom-right
            await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(7), Cl.uint(1), Cl.uint(7)], player1);  // X: bottom-middle

            // Try to claim draw with the correct match ID
            const drawClaim1 = await simnet.callPublicFn(
                "ttt-v01",
                "claim-draw",
                [Cl.uint(matchId)],
                player1
            );

            expect(drawClaim1.result).toBeOk(Cl.bool(true));

            // Try to claim draw with the correct match ID
            const drawClaim2 = await simnet.callPublicFn(
                "ttt-v01",
                "claim-draw",
                [Cl.uint(matchId)],
                player2
            );

            expect(drawClaim2.result).toBeOk(Cl.bool(true));
        });

        it("prevents double draw claims", async () => {
            await setupGame(simnet, player1, player2);
            const startResult = await simnet.callPublicFn("ttt-v01", "start-match", [], player1);
            const matchId = Number(cvToValue(startResult.result).value);

            // Play to a draw using the same moves from the existing draw test
            await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(0), Cl.uint(1), Cl.uint(0)], player1);
            await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(1), Cl.uint(2), Cl.uint(1)], player2);
            await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(2), Cl.uint(1), Cl.uint(2)], player1);
            await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(3), Cl.uint(2), Cl.uint(3)], player2);
            await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(5), Cl.uint(1), Cl.uint(5)], player1);
            await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(4), Cl.uint(2), Cl.uint(4)], player2);
            await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(6), Cl.uint(1), Cl.uint(6)], player1);
            await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(8), Cl.uint(2), Cl.uint(8)], player2);
            await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(7), Cl.uint(1), Cl.uint(7)], player1);

            // First claim should succeed
            const drawClaim1 = await simnet.callPublicFn(
                "ttt-v01",
                "claim-draw",
                [Cl.uint(matchId)],
                player1
            );
            expect(drawClaim1.result).toBeOk(Cl.bool(true));

            // Second claim by same player should fail
            const drawClaim2 = await simnet.callPublicFn(
                "ttt-v01",
                "claim-draw",
                [Cl.uint(matchId)],
                player1
            );
            expect(drawClaim2.result).toBeErr(Cl.uint(2100)); // err-unauthorized
        });

        it("prevents unauthorized draw claims", async () => {
            const unauthorized = accounts.get("wallet_3")!;
            await setupGame(simnet, player1, player2);
            const startResult = await simnet.callPublicFn("ttt-v01", "start-match", [], player1);
            const matchId = Number(cvToValue(startResult.result).value);

            // Play to a draw using the same moves from the existing draw test
            await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(0), Cl.uint(1), Cl.uint(0)], player1);
            await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(1), Cl.uint(2), Cl.uint(1)], player2);
            await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(2), Cl.uint(1), Cl.uint(2)], player1);
            await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(3), Cl.uint(2), Cl.uint(3)], player2);
            await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(5), Cl.uint(1), Cl.uint(5)], player1);
            await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(4), Cl.uint(2), Cl.uint(4)], player2);
            await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(6), Cl.uint(1), Cl.uint(6)], player1);
            await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(8), Cl.uint(2), Cl.uint(8)], player2);
            await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(7), Cl.uint(1), Cl.uint(7)], player1);

            const drawClaim = await simnet.callPublicFn(
                "ttt-v01",
                "claim-draw",
                [Cl.uint(matchId)],
                unauthorized
            );
            expect(drawClaim.result).toBeErr(Cl.uint(2100)); // err-unauthorized
        });
    });

    describe("Game State", () => {
        it("correctly handles match reset after completion", async () => {
            // Play first match
            await setupGame(simnet, player1, player2);
            await simnet.callPublicFn("ttt-v01", "start-match", [], player1);
            await playWinningGame(simnet, player1, player2);
            
            // Try to start new match without new players
            const invalidStart = await simnet.callPublicFn(
                "ttt-v01",
                "start-match",
                [],
                player1
            );
            expect(invalidStart.result).toBeErr(Cl.uint(3003)); // err-not-enough-players
            
            // Verify match state is reset
            const playerCount = await simnet.callReadOnlyFn(
                "ttt-v01",
                "get-player-count",
                [],
                player1
            );
            expect(playerCount.result).toBeOk(Cl.uint(0));
        });

        it("allows admin to force draw an in-progress match", async () => {
            // Setup and start match
            await setupGame(simnet, player1, player2);
            await simnet.callPublicFn("ttt-v01", "start-match", [], player1);
            
            // Make some moves but don't complete game
            await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(1), Cl.uint(1), Cl.uint(0)], player1);
            await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(2), Cl.uint(2), Cl.uint(4)], player2);
            
            // Try force draw with non-admin (should fail)
            const invalidForceDraw = await simnet.callPublicFn(
                "ttt-v01",
                "admin-force-draw",
                [],
                player1
            );
            expect(invalidForceDraw.result).toBeErr(Cl.uint(2100)); // err-unauthorized
            
            // Force draw with admin
            const forceDraw = await simnet.callPublicFn(
                "ttt-v01",
                "admin-force-draw",
                [],
                accounts.get("deployer")! // contract owner
            );
            expect(forceDraw.result).toBeOk(Cl.bool(true));
            
            // Verify match state is reset
            const playerCount = await simnet.callReadOnlyFn(
                "ttt-v01",
                "get-player-count",
                [],
                player1
            );
            expect(playerCount.result).toBeOk(Cl.uint(0));
            
            // Verify match is marked as draw in winners map
            const matchWinner = await simnet.callReadOnlyFn(
                "ttt-v01",
                "get-match-winner",
                [Cl.uint(1)], // match ID
                player1
            );
            expect(matchWinner.result).toBeOk(Cl.tuple({
                "match-winner": Cl.some(Cl.none())
            }));

            // Verify both players can claim their share
            const claim1 = await simnet.callPublicFn(
                "ttt-v01",
                "claim-draw",
                [Cl.uint(1)],
                player1
            );
            expect(claim1.result).toBeOk(Cl.bool(true));

            const claim2 = await simnet.callPublicFn(
                "ttt-v01",
                "claim-draw",
                [Cl.uint(1)],
                player2
            );
            expect(claim2.result).toBeOk(Cl.bool(true));
        });
    });
}); 