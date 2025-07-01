// 1) Mock `crypto` so that `createPrivateKey` is a jest.fn
jest.mock("crypto", () => {
    const realCrypto = jest.requireActual("crypto");
    return {
        ...realCrypto,
        createPrivateKey: jest.fn(), // now mutable & mockable
    };
});

// 2) Mock Fabric Gateway but preserve everything except connect()
jest.mock("@hyperledger/fabric-gateway", () => {
    const real = jest.requireActual("@hyperledger/fabric-gateway");
    return {
        ...real, // keep hash, signers, etc.
        connect: jest.fn(), // override only connect()
    };
});

// Now your normal imports:
import * as grpc from "@grpc/grpc-js";
import * as crypto from "crypto"; // createPrivateKey is now jest.fn
import { connect as mockConnect, signers } from "@hyperledger/fabric-gateway";
import { promises as fs } from "fs";
import * as path from "path";
import { FabricGatewayService } from "@/lib/fabric-gateway-service";

// Mock the fabricConfig module
jest.mock("@/config/fabric-config", () => ({
    fabricConfig: {
        USER_IDENTITY: "User1@org1.example.com",
        PEER_NAME: "peer0.org1.example.com",
        PEER_ENDPOINT: "localhost:7051",
        PEER_HOST_ALIAS: "peer0.org1.example.com",
        MSP_ID: "Org1MSP",
        CHANNEL_NAME: "mychannel",
        CHAINCODE_NAME: "basic",
        getTlsCertPath: jest.fn(() => "/fake/tls/cert.pem"),
        getKeyDirectoryPath: jest.fn(() => "/fake/key/dir"),
        getCertDirectoryPath: jest.fn(() => "/fake/cert/dir"),
    },
}));

describe("FabricGatewayService – full coverage", () => {
    let svc: FabricGatewayService;

    beforeEach(() => {
        jest.restoreAllMocks();
        svc = new FabricGatewayService();
    });

    describe("getFirstDirFileName()", () => {
        it("finds the first .pem or .sk file", async () => {
            jest.spyOn(fs, "readdir").mockResolvedValueOnce([
                "ignore.txt",
                "key.sk",
                "cert.pem",
            ] as unknown as any); // Cast to any to satisfy Dirent[] type if needed
            const result = await (svc as any).getFirstDirFileName("/fake");
            expect(result).toBe(path.join("/fake", "key.sk"));
        });

        it("throws if no valid file", async () => {
            jest.spyOn(fs, "readdir").mockResolvedValueOnce([
                "foo.txt",
            ] as unknown as any);
            await expect(
                (svc as any).getFirstDirFileName("/fake")
            ).rejects.toThrow("No suitable files found in directory");
        });
    });

    describe("newIdentity()", () => {
        it("returns Identity with mspId and credentials", async () => {
            jest.spyOn(svc as any, "getFirstDirFileName").mockResolvedValueOnce(
                "/fake/cert.pem"
            );
            const fakeCred = Buffer.from("CERT");
            jest.spyOn(fs, "readFile").mockResolvedValueOnce(fakeCred);
            const identity = await (svc as any).newIdentity("/fake", "Org1MSP");
            expect(identity).toEqual({
                mspId: "Org1MSP",
                credentials: fakeCred,
            });
        });
    });

    describe("newGrpcConnection()", () => {
        it("creates grpc.Client with SSL credentials", async () => {
            const fakeCert = Buffer.from("CERT");
            jest.spyOn(fs, "readFile").mockResolvedValueOnce(fakeCert);
            const sslSpy = jest.spyOn(grpc.credentials, "createSsl");
            const client = await (svc as any).newGrpcConnection(
                "/tls.crt",
                "host:7051",
                "alias"
            );
            expect(sslSpy).toHaveBeenCalledWith(fakeCert);
            expect(client).toBeInstanceOf(grpc.Client);
        });
    });

    describe("newSigner()", () => {
        it("returns a signer from private key PEM", async () => {
            // stub file‐finding and readFile
            jest.spyOn(svc as any, "getFirstDirFileName").mockResolvedValueOnce(
                "/fake/key.pem"
            );
            const fakePem = Buffer.from("PEM");
            jest.spyOn(fs, "readFile").mockResolvedValueOnce(fakePem);

            // `crypto.createPrivateKey` is already a mock, so just set its return value:
            const fakeKey = {};
            (crypto.createPrivateKey as jest.Mock).mockReturnValueOnce(fakeKey);

            // spy the real signers factory
            const signerSpy = jest
                .spyOn(signers, "newPrivateKeySigner")
                .mockReturnValueOnce("SIGNER" as any);

            const signer = await (svc as any).newSigner("/fake");
            expect(crypto.createPrivateKey).toHaveBeenCalledWith(fakePem);
            expect(signerSpy).toHaveBeenCalledWith(fakeKey);
            expect(signer).toBe("SIGNER");
        });
    });

    describe("connect()", () => {
        it("early-returns if already connected with same identity", async () => {
            // simulate previous successful connect
            (svc as any).gateway = { close: () => {} };
            (svc as any).currentUserIdentity = "Me";
            // spy on fs to ensure no file reads occur
            const spyFs = jest.spyOn(fs, "readFile");
            const consoleSpy = jest.spyOn(console, 'log'); // Add this spy

            await svc.connect("Me");

            expect(spyFs).not.toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith('Already connected to Fabric network with the same user.'); // Add this assertion
            spyFs.mockRestore();
            consoleSpy.mockRestore(); // Clean up the spy
        })

        it("performs full connect flow on first call", async () => {
            // stub out the private helpers so no real FS/crypto/gRPC work happens:
            const fakeClient = { close: jest.fn() } as unknown as grpc.Client;
            jest.spyOn(svc as any, "newGrpcConnection").mockResolvedValueOnce(
                fakeClient
            );
            jest.spyOn(svc as any, "newIdentity").mockResolvedValueOnce({
                mspId: "X",
                credentials: Buffer.alloc(0),
            });
            jest.spyOn(svc as any, "newSigner").mockResolvedValueOnce(
                {} as any
            );

            // stub connect() from fabric-gateway to return a dummy gateway
            const fakeGateway = {
                getNetwork: jest.fn().mockReturnValue({
                    getContract: jest.fn().mockReturnValue({}),
                }),
                close: jest.fn(),
            };
            const connectSpy = jest.spyOn(
                require("@hyperledger/fabric-gateway"),
                "connect"
            ).mockReturnValue(fakeGateway as any);

            await svc.connect("UserA");
            // everything should be wired up
            expect((svc as any).client).toBe(fakeClient);
            expect((svc as any).gateway).toBe(fakeGateway);
            expect((svc as any).contract).toBeDefined();
            expect((svc as any).currentUserIdentity).toBe("UserA");

            const cfg = connectSpy.mock.calls[0][0] as {
                evaluateOptions: () => any;
                endorseOptions: () => any;
                submitOptions: () => any;
                commitStatusOptions: () => any;
            };
             // call each arrow so their lines get executed
            expect(typeof cfg.evaluateOptions).toBe("function");
            expect(typeof cfg.endorseOptions).toBe("function");
            expect(typeof cfg.submitOptions).toBe("function");
            expect(typeof cfg.commitStatusOptions).toBe("function");

            expect(cfg.evaluateOptions()).toHaveProperty("deadline");
            expect(cfg.endorseOptions()).toHaveProperty("deadline");
            expect(cfg.submitOptions()).toHaveProperty("deadline");
            expect(cfg.commitStatusOptions()).toHaveProperty("deadline");
        });

        it("cleans up on failure and rethrows", async () => {
            // stub newGrpcConnection to throw
            jest.spyOn(svc as any, "newGrpcConnection").mockRejectedValueOnce(
                new Error("oh no")
            );
            // ensure gateway and client will get cleared
            (svc as any).gateway = { close: jest.fn() };
            (svc as any).client = { close: jest.fn() };
            await expect(svc.connect("X")).rejects.toThrow("oh no");
            expect((svc as any).gateway).toBeNull();
            expect((svc as any).client).toBeNull();
            expect((svc as any).contract).toBeNull();
        });
    });

    describe("disconnect()", () => {
        it("closes gateway & client handles if present", async () => {
            const fakeGateway = { close: jest.fn() };
            const fakeClient = { close: jest.fn() };
            (svc as any).gateway = fakeGateway;
            (svc as any).client = fakeClient;
            (svc as any).contract = {};
            await svc.disconnect();
            expect(fakeGateway.close).toHaveBeenCalled();
            expect(fakeClient.close).toHaveBeenCalled();
            expect((svc as any).gateway).toBeNull();
            expect((svc as any).client).toBeNull();
            expect((svc as any).contract).toBeNull();
        });

        it("no‑ops if nothing to close", async () => {
            (svc as any).gateway = null;
            (svc as any).client = null;
            (svc as any).contract = null;
            // Should not throw
            await expect(svc.disconnect()).resolves.not.toThrow();
        });
    });

    describe("submitTransaction()", () => {
        it("throws if not connected", async () => {
            (svc as any).contract = null;
            await expect(svc.submitTransaction("F")).rejects.toThrow(
                "Not connected to Fabric network"
            );
        });

        it("decodes and returns payload on success", async () => {
            const fakeBytes = Buffer.from("HELLO");
            (svc as any).contract = {
                submitTransaction: jest.fn().mockResolvedValueOnce(fakeBytes),
            };
            const res = await svc.submitTransaction("Fn", "a", "b");
            expect(res).toBe("HELLO");
            expect(
                (svc as any).contract.submitTransaction
            ).toHaveBeenCalledWith("Fn", "a", "b");
        });

        it("rethrows underlying contract errors", async () => {
            const err = new Error("chaincode fail");
            (svc as any).contract = {
                submitTransaction: jest.fn().mockRejectedValueOnce(err),
            };
            await expect(svc.submitTransaction("Fn")).rejects.toBe(err);
        });
    });

    describe("evaluateTransaction()", () => {
        it("throws if not connected", async () => {
            (svc as any).contract = null;
            await expect(svc.evaluateTransaction("Q")).rejects.toThrow(
                "Not connected to Fabric network"
            );
        });

        it("parses JSON responses", async () => {
            const fakeBytes = Buffer.from('{"x":123}');
            (svc as any).contract = {
                evaluateTransaction: jest.fn().mockResolvedValueOnce(fakeBytes),
            };
            const consoleSpy = jest.spyOn(console, 'log'); // Spy on console.log
            const out = await svc.evaluateTransaction("Q", "p");
            expect(out).toEqual({ x: 123 });
            expect(consoleSpy).toHaveBeenCalledWith('*** Result:', { x: 123 }); // Assert console.log call
            consoleSpy.mockRestore(); // Restore console.log
        });

        it("returns raw string on invalid JSON", async () => {
            const fakeBytes = Buffer.from("NOT JSON");
            (svc as any).contract = {
                evaluateTransaction: jest.fn().mockResolvedValueOnce(fakeBytes),
            };
            const out = await svc.evaluateTransaction("Q");
            expect(out).toBe("NOT JSON");
        });

        it("rethrows underlying errors", async () => {
            const err = new Error("eval fail");
            (svc as any).contract = {
                evaluateTransaction: jest.fn().mockRejectedValueOnce(err),
            };
            await expect(svc.evaluateTransaction("Q")).rejects.toBe(err);
        });
    });

    describe("initLedger()", () => {
        it("throws if not connected", async () => {
            (svc as any).contract = null;
            await expect(svc.initLedger()).rejects.toThrow(
                "Not connected to Fabric network"
            );
        });

        it("delegates to submitTransaction", async () => {
            const spy = jest.fn().mockResolvedValue(Buffer.from("OK"));
            (svc as any).contract = { submitTransaction: spy } as any;
            await svc.initLedger();
            expect(spy).toHaveBeenCalledWith("InitLedger");
        });
    });
});
