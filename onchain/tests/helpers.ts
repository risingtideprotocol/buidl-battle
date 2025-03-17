import { Cl } from "@stacks/transactions";

export const TEST_BUY_IN_STX = 1000000;      // Matches buy-in
export const TEST_BUY_IN_SBTC = 150000;      // Matches buy-in-sbtc

export const setupGame = async (simnet: any, player1: string, player2: string) => {
    const playerOneJoined = await simnet.callPublicFn(
        "ttt-v01",
        "player-buy-in",
        [Cl.principal(player1), Cl.uint(TEST_BUY_IN_STX)],
        player1
    );

    const playerTwoJoined = await simnet.callPublicFn(
        "ttt-v01",
        "player-buy-in",
        [Cl.principal(player2), Cl.uint(TEST_BUY_IN_STX)],
        player2
    );

    return { playerOneJoined, playerTwoJoined };
};

export const playWinningGame = async (simnet: any, player1: string, player2: string) => {
    // Play a winning sequence for player1 (diagonal win)
    await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(1), Cl.uint(1), Cl.uint(0)], player1);
    await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(2), Cl.uint(2), Cl.uint(5)], player2);
    await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(3), Cl.uint(1), Cl.uint(1)], player1);
    await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(4), Cl.uint(2), Cl.uint(7)], player2);
    await simnet.callPublicFn("ttt-v01", "process-turn", [Cl.uint(5), Cl.uint(1), Cl.uint(2)], player1);
}; 