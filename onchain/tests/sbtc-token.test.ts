import { describe, expect, it } from "vitest";
import { 
    initSimnet
} from "@hirosystems/clarinet-sdk";
import { Cl, cvToValue } from "@stacks/transactions";

const simnet = await initSimnet();

describe("Mock sBTC Token", () => {
    const deployer = simnet.deployer;
    const accounts = simnet.getAccounts();
    const wallet1 = accounts.get("wallet_1")!;
    const wallet2 = accounts.get("wallet_2")!;
    const INITIAL_SUPPLY = 1000000000n; // 100,000 sBTC with 8 decimals
    const ONE_SBTC = 100000000n; // 1 sBTC in base units (8 decimals)

    describe("SIP-010 Trait Compliance", () => {
        it("returns correct token name", async () => {
            const result = await simnet.callReadOnlyFn(
                "sbtc-token",
                "get-name",
                [],
                deployer
            );
            expect(result.result).toBeOk(Cl.stringAscii("sBTC"));
        });

        it("returns correct token symbol", async () => {
            const result = await simnet.callReadOnlyFn(
                "sbtc-token",
                "get-symbol",
                [],
                deployer
            );
            expect(result.result).toBeOk(Cl.stringAscii("sBTC"));
        });

        it("returns correct number of decimals", async () => {
            const result = await simnet.callReadOnlyFn(
                "sbtc-token",
                "get-decimals",
                [],
                deployer
            );
            expect(result.result).toBeOk(Cl.uint(8));
        });

        it("returns correct token URI", async () => {
            const result = await simnet.callReadOnlyFn(
                "sbtc-token",
                "get-token-uri",
                [],
                deployer
            );
            expect(result.result).toBeOk(Cl.some(Cl.stringUtf8("https://ipfs.io/ipfs/bafkreibqnozdui4ntgoh3oo437lvhg7qrsccmbzhgumwwjf2smb3eegyqu")));
        });
    });

    describe("Initial Supply", () => {
        it("mints initial supply to deployer", async () => {
            const balance = await simnet.callReadOnlyFn(
                "sbtc-token",
                "get-balance",
                [Cl.principal(deployer)],
                deployer
            );
            expect(balance.result).toBeOk(Cl.uint(INITIAL_SUPPLY));
        });

        it("reflects total supply", async () => {
            const supply = await simnet.callReadOnlyFn(
                "sbtc-token",
                "get-total-supply",
                [],
                deployer
            );
            expect(supply.result).toBeOk(Cl.uint(INITIAL_SUPPLY));
        });
    });

    describe("Transfer Functionality", () => {
        it("allows transfer between accounts", async () => {
            const amount = ONE_SBTC;
            
            // Initial transfer from deployer to wallet1
            const transfer = await simnet.callPublicFn(
                "sbtc-token",
                "transfer",
                [
                    Cl.uint(amount),
                    Cl.principal(deployer),
                    Cl.principal(wallet1),
                    Cl.none()
                ],
                deployer
            );
            expect(transfer.result).toBeOk(Cl.bool(true));

            // Check wallet1 balance
            const balance = await simnet.callReadOnlyFn(
                "sbtc-token",
                "get-balance",
                [Cl.principal(wallet1)],
                wallet1
            );
            expect(balance.result).toBeOk(Cl.uint(amount));
        });

        it("prevents transfer when balance is insufficient", async () => {
            const transfer = await simnet.callPublicFn(
                "sbtc-token",
                "transfer",
                [
                    Cl.uint(INITIAL_SUPPLY + ONE_SBTC),
                    Cl.principal(wallet1),
                    Cl.principal(wallet2),
                    Cl.none()
                ],
                wallet1
            );
            expect(transfer.result).toBeErr(Cl.uint(7)); // ERR_INSUFFICIENT_BALANCE
        });

        it("prevents unauthorized transfers", async () => {
            const transfer = await simnet.callPublicFn(
                "sbtc-token",
                "transfer",
                [
                    Cl.uint(ONE_SBTC),
                    Cl.principal(deployer),
                    Cl.principal(wallet1),
                    Cl.none()
                ],
                wallet1 // wallet1 trying to transfer deployer's tokens
            );
            expect(transfer.result).toBeErr(Cl.uint(4)); // ERR_NOT_OWNER
        });
    });

    describe("Faucet Functionality", () => {
        it("allows users to get test sBTC", async () => {
            const initialBalance = await simnet.callReadOnlyFn(
                "sbtc-token",
                "get-balance",
                [Cl.principal(wallet2)],
                wallet2
            );

            const faucet = await simnet.callPublicFn(
                "sbtc-token",
                "faucet",
                [],
                wallet2
            );
            expect(faucet.result).toBeOk(Cl.bool(true));

            const finalBalance = await simnet.callReadOnlyFn(
                "sbtc-token",
                "get-balance",
                [Cl.principal(wallet2)],
                wallet2
            );

            // Should have received 1 sBTC (100000000 base units)
            expect(finalBalance.result).toBeOk(
                Cl.uint(ONE_SBTC + BigInt(cvToValue(initialBalance.result).value))
            );
        });
    });
}); 