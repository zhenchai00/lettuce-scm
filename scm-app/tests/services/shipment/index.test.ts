// tests/services/shipment/index.test.ts
import { getFabricService } from "@/lib/fabric";
import prisma from "@/lib/prisma";
import * as svc from "@/services/shipment";

jest.mock("@/lib/prisma");
jest.mock("@/lib/fabric");

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockGetFabric = getFabricService as jest.MockedFunction<
    typeof getFabricService
>;

describe("Shipment Service", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("getShipment", () => {
        it("returns [] when DB returns null", async () => {
            (mockPrisma.shipment.findMany as jest.Mock).mockResolvedValueOnce(
                null as any
            );
            const res = await svc.getShipment();
            expect(res).toEqual([]);
            expect(mockPrisma.shipment.findMany).toHaveBeenCalledWith({
                orderBy: { createdAt: "desc" },
                include: { batch: true, fromUser: true, toUser: true },
            });
        });

        it("returns shipments on success", async () => {
            const fake = [{ id: "s1" }];
            (mockPrisma.shipment.findMany as jest.Mock).mockResolvedValueOnce(
                fake as any
            );
            const res = await svc.getShipment();
            expect(res).toBe(fake);
        });

        it("throws on error", async () => {
            (mockPrisma.shipment.findMany as jest.Mock).mockRejectedValueOnce(
                new Error("boom")
            );
            await expect(svc.getShipment()).rejects.toThrow(
                "Failed to fetch shipments"
            );
        });
    });

    describe("getShipmentById", () => {
        it("returns [] when not found", async () => {
            (mockPrisma.shipment.findUnique as jest.Mock).mockResolvedValueOnce(
                null as any
            );
            const res = await svc.getShipmentById("nope");
            expect(res).toEqual([]);
            expect(mockPrisma.shipment.findUnique).toHaveBeenCalledWith({
                where: { id: "nope" },
                include: { batch: true, fromUser: true, toUser: true },
            });
        });

        it("returns shipment when found", async () => {
            const fake = { id: "s2" };
            (mockPrisma.shipment.findUnique as jest.Mock).mockResolvedValueOnce(
                fake as any
            );
            const res = await svc.getShipmentById("s2");
            expect(res).toBe(fake);
        });

        it("throws on DB error", async () => {
            (mockPrisma.shipment.findUnique as jest.Mock).mockRejectedValueOnce(
                new Error("fail")
            );
            await expect(svc.getShipmentById("x")).rejects.toThrow(
                "Shipment with ID x not found"
            );
        });
    });

    describe("getAllShipmentByUserId", () => {
        it("returns [] when none", async () => {
            (mockPrisma.shipment.findMany as jest.Mock).mockResolvedValueOnce(
                null as any
            );
            const res = await svc.getAllShipmentByUserId("u1");
            expect(res).toEqual([]);
            expect(mockPrisma.shipment.findMany).toHaveBeenCalledWith({
                where: { OR: [{ fromUserId: "u1" }, { toUserId: "u1" }] },
                include: { batch: true, fromUser: true, toUser: true },
                orderBy: { createdAt: "desc" },
            });
        });

        it("returns array when found", async () => {
            const arr = [{ id: "s3" }];
            (mockPrisma.shipment.findMany as jest.Mock).mockResolvedValueOnce(
                arr as any
            );
            const res = await svc.getAllShipmentByUserId("u1");
            expect(res).toBe(arr);
        });

        it("throws on DB error", async () => {
            (mockPrisma.shipment.findMany as jest.Mock).mockRejectedValueOnce(
                new Error("oops")
            );
            await expect(svc.getAllShipmentByUserId("u1")).rejects.toThrow(
                "Shipments for user ID u1 not found"
            );
        });
    });

    describe("createShipment", () => {
        const input = {
            productBatch: "b1",
            fromUser: "fu1",
            toUser: "tu1",
            quantity: 5,
        };

        it("creates with both inventory and toUser", async () => {
            const inv = { user: { id: "fu1" }, batch: {} };
            (
                mockPrisma.inventory.findUnique as jest.Mock
            ).mockResolvedValueOnce(inv as any);
            (mockPrisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
                id: "tu1",
            } as any);
            const created = { id: "sh1" };
            (mockPrisma.shipment.create as jest.Mock).mockResolvedValueOnce(
                created as any
            );

            const res = await svc.createShipment(input);
            expect(res).toBe(created);
            expect(mockPrisma.shipment.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    quantity: 5,
                    status: "ORDERED",
                    batch: { connect: { id: "b1" } },
                    toUser: { connect: { id: "tu1" } },
                    fromUser: { connect: { id: "fu1" } },
                }),
                include: { batch: true, fromUser: true, toUser: true },
            });
        });

        it("creates without inventory or toUser", async () => {
            (
                mockPrisma.inventory.findUnique as jest.Mock
            ).mockResolvedValueOnce(null as any);
            (mockPrisma.user.findUnique as jest.Mock).mockResolvedValueOnce(
                null as any
            );
            const created = { id: "sh2" };
            (mockPrisma.shipment.create as jest.Mock).mockResolvedValueOnce(
                created as any
            );

            const res = await svc.createShipment(input);
            expect(res).toBe(created);
            // fromUser and toUser should be omitted
            expect(
                (
                    (mockPrisma.shipment.create as jest.Mock).mock
                        .calls[0][0] as any
                ).data
            ).not.toHaveProperty("fromUser");
        });

        it("throws on error", async () => {
            (
                mockPrisma.inventory.findUnique as jest.Mock
            ).mockRejectedValueOnce(new Error("bad"));
            await expect(svc.createShipment(input)).rejects.toThrow(
                /^Failed to create shipment: bad$/
            );
        });
    });

    describe("updateShipment", () => {
        const base = {
            id: "u1",
            batchId: "b1",
            fromUserId: "fu1",
            toUserId: "tu1",
            quantity: 2,
            fromUser: { name: "Alice" },
            toUser: { name: "Bob" },
        };

        let fakeTxContext: any;
        let fakeFabric: { submitTransaction: jest.Mock };

        beforeEach(() => {
            // Always stub Fabric before each call:
            fakeFabric = { submitTransaction: jest.fn() };
            mockGetFabric.mockResolvedValue(fakeFabric as any);

            // Default successful transaction context:
            fakeTxContext = {
                shipment: {
                    update: jest.fn().mockResolvedValue({ ...base, id: "u1" }),
                },
                inventory: {
                    findUnique: jest.fn().mockResolvedValue({ quantity: 10 }),
                    update: jest.fn().mockResolvedValue({
                        id: "i1",
                        batch: {},
                        user: {},
                        quantity: 8,
                    }),
                    upsert: jest.fn().mockResolvedValue({
                        id: "i2",
                        batch: {},
                        user: { role: "RETAILER" },
                        userId: "tu1",
                        batchId: "b1",
                        quantity: 2,
                    }),
                },
                productEvent: {
                    create: jest.fn().mockResolvedValue({ id: "e1" }),
                },
            };
            mockPrisma.$transaction.mockImplementation(async (cb) =>
                cb(fakeTxContext)
            );
        });

        it("handles OUTOFDELIVERY", async () => {
            await svc.updateShipment("u1", {
                status: "OUTOFDELIVERY",
                quantity: 2,
            });
            expect(fakeTxContext.shipment.update).toHaveBeenCalled();
            expect(fakeTxContext.inventory.findUnique).toHaveBeenCalled();
            expect(fakeFabric.submitTransaction).toHaveBeenCalledWith(
                "CreateAsset",
                expect.stringContaining('"eventType":"SHIPPED"')
            );
        });

        it("handles DELIVERED and trackingKey branch", async () => {
            await svc.updateShipment("u1", {
                status: "DELIVERED",
                quantity: 2,
            });
            expect(fakeTxContext.shipment.update).toHaveBeenCalled();
            expect(fakeTxContext.inventory.upsert).toHaveBeenCalled();
            // since upsert returned user.role = "RETAILER", we expect two more updates:
            expect(fakeFabric.submitTransaction).toHaveBeenCalledWith(
                "CreateAsset",
                expect.stringContaining('"eventType":"DELIVERED"')
            );
        });

        it("handles ORDERED (no side-effects)", async () => {
            // Should not error and should skip both IF branches:
            await expect(
                svc.updateShipment("u1", { status: "ORDERED" })
            ).resolves.toMatchObject({
                id: "u1",
            });
            expect(fakeFabric.submitTransaction).not.toHaveBeenCalled();
        });

        it("handles CANCELLED (no side-effects)", async () => {
            await expect(
                svc.updateShipment("u1", { status: "CANCELLED" })
            ).resolves.toMatchObject({
                id: "u1",
            });
            expect(fakeFabric.submitTransaction).not.toHaveBeenCalled();
        });

        it("throws if transaction fails", async () => {
            // Reset the stubbed transaction to throw:
            mockPrisma.$transaction.mockReset();
            mockPrisma.$transaction.mockRejectedValueOnce(new Error("txfail"));

            await expect(
                svc.updateShipment("u1", { status: "ORDERED" })
            ).rejects.toThrow(/^Failed to update shipment with ID u1: txfail$/);
        });

        it("throws if OUTOFDELIVERY inventory not found", async () => {
            // Make findUnique return null
            fakeTxContext.inventory.findUnique = jest
                .fn()
                .mockResolvedValue(null);
            mockPrisma.$transaction.mockImplementation(async (cb) =>
                cb(fakeTxContext)
            );

            await expect(
                svc.updateShipment("u1", {
                    status: "OUTOFDELIVERY",
                    quantity: 2,
                })
            ).rejects.toThrow(/Inventory not found for sender: fu1, batch: b1/);
        });

        it("warns on unknown status and proceeds", async () => {
            const warnSpy = jest
                .spyOn(console, "warn")
                .mockImplementation(() => {});
            const res = await svc.updateShipment("u1", {
                status: "WHOKNOWS",
                quantity: 5,
            });
            expect(res).toHaveProperty("id", "u1");
            expect(warnSpy).toHaveBeenCalledWith("Unknown status:", "WHOKNOWS");
            // No blockchain side‐effects
            expect(fakeFabric.submitTransaction).not.toHaveBeenCalled();
        });

        it("handles DELIVERED when user is not RETAILER (no trackingKey branch)", async () => {
            // stub upsert to return non‐retailer
            fakeTxContext.inventory.upsert = jest.fn().mockResolvedValue({
                id: "i2",
                batch: {},
                user: { role: "FARMER" },
                userId: "tu1",
                batchId: "b1",
                quantity: 2,
            });
            mockPrisma.$transaction.mockImplementation(async (cb) =>
                cb(fakeTxContext)
            );

            await svc.updateShipment("u1", {
                status: "DELIVERED",
                quantity: 2,
            });
            // we still submit the DELIVERED asset
            expect(fakeFabric.submitTransaction).toHaveBeenCalledWith(
                "CreateAsset",
                expect.stringContaining('"eventType":"DELIVERED"')
            );
            // but we do not do the extra shipment/inventory.update for tracking key
            // (no additional prisma.shipment.update calls beyond the first)
            expect(fakeTxContext.shipment.update).toHaveBeenCalledTimes(1);
        });
    });

    describe("deleteShipment", () => {
        it("deletes successfully", async () => {
            const del = { id: "d1" };
            (mockPrisma.shipment.delete as jest.Mock).mockResolvedValueOnce(
                del as any
            );
            const res = await svc.deleteShipment("d1");
            expect(res).toBe(del);
            expect(mockPrisma.shipment.delete).toHaveBeenCalledWith({
                where: { id: "d1" },
            });
        });

        it("throws on error", async () => {
            (mockPrisma.shipment.delete as jest.Mock).mockRejectedValueOnce(
                new Error("oops")
            );
            await expect(svc.deleteShipment("d1")).rejects.toThrow(
                /^Failed to delete shipment with ID d1: oops$/
            );
        });
    });
});
