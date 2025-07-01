import prisma from "@/lib/prisma";
import * as batchSvc from "@/services/product-batch";
import { getFabricService } from "@/lib/fabric";
import { FabricGatewayService } from "@/lib/fabric-gateway-service";

jest.mock("@/lib/prisma");
jest.mock("@/lib/fabric");
jest.mock("@/lib/fabric-gateway-service");

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockGetFabric = getFabricService as jest.MockedFunction<
    typeof getFabricService
>;

describe("Product-batch service", () => {
    const sampleBatch = {
        id: "b1",
        produceType: "A",
        farmer: { id: "u1", name: "F" },
    };
    const sampleEvent = { id: "e1", batch: { id: "b1" } };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // Utility to mock $transaction
    const setupTransaction = (txMock: any) => {
        mockPrisma.$transaction.mockImplementation(async (fn) => fn(txMock));
    };

    describe("getProductBatches", () => {
        it("returns [] on null", async () => {
            (
                mockPrisma.batchProduct.findMany as jest.Mock
            ).mockResolvedValueOnce(null as any);
            const res = await batchSvc.getProductBatches();
            expect(res).toEqual([]);
            expect(mockPrisma.batchProduct.findMany).toHaveBeenCalledWith({
                orderBy: { createdAt: "desc" },
                include: { farmer: true },
            });
        });

        it("returns the array on success", async () => {
            const arr = [sampleBatch];
            (
                mockPrisma.batchProduct.findMany as jest.Mock
            ).mockResolvedValueOnce(arr as any);
            const res = await batchSvc.getProductBatches();
            expect(res).toBe(arr);
        });

        it("throws on DB error", async () => {
            (
                mockPrisma.batchProduct.findMany as jest.Mock
            ).mockRejectedValueOnce(new Error("fail"));
            await expect(batchSvc.getProductBatches()).rejects.toThrow(
                "Failed to fetch product batches: Error: fail"
            );
        });
    });

    describe("getProductBatchById", () => {
        it("returns [] when not found", async () => {
            (
                mockPrisma.batchProduct.findUnique as jest.Mock
            ).mockResolvedValueOnce(null as any);
            const res = await batchSvc.getProductBatchById("x");
            expect(res).toEqual([]);
        });

        it("returns object when found", async () => {
            (
                mockPrisma.batchProduct.findUnique as jest.Mock
            ).mockResolvedValueOnce(sampleBatch as any);
            const res = await batchSvc.getProductBatchById("b1");
            expect(res).toBe(sampleBatch);
        });

        it("throws on DB error", async () => {
            (
                mockPrisma.batchProduct.findUnique as jest.Mock
            ).mockRejectedValueOnce(new Error("oops"));
            await expect(batchSvc.getProductBatchById("b1")).rejects.toThrow(
                "Product batch with ID b1 not found"
            );
        });
    });

    describe("getProductBatchesByUserId", () => {
        it("returns [] when none", async () => {
            (
                mockPrisma.batchProduct.findMany as jest.Mock
            ).mockResolvedValueOnce(null as any);
            const res = await batchSvc.getProductBatchesByUserId("u1");
            expect(res).toEqual([]);
        });

        it("returns array when found", async () => {
            const arr = [sampleBatch];
            (
                mockPrisma.batchProduct.findMany as jest.Mock
            ).mockResolvedValueOnce(arr as any);
            const res = await batchSvc.getProductBatchesByUserId("u1");
            expect(res).toBe(arr);
        });

        it("throws on DB error", async () => {
            (
                mockPrisma.batchProduct.findMany as jest.Mock
            ).mockRejectedValueOnce(new Error("err"));
            await expect(
                batchSvc.getProductBatchesByUserId("u1")
            ).rejects.toThrow("Product batches for user ID u1 not found");
        });
    });

    describe("getProductBatchByBlockchainTx", () => {
        it("returns [] when none", async () => {
            (
                mockPrisma.batchProduct.findFirst as jest.Mock
            ).mockResolvedValueOnce(null as any);
            const res = await batchSvc.getProductBatchByBlockchainTx("tx1");
            expect(res).toEqual([]);
        });

        it("returns object when found", async () => {
            (
                mockPrisma.batchProduct.findFirst as jest.Mock
            ).mockResolvedValueOnce(sampleBatch as any);
            const res = await batchSvc.getProductBatchByBlockchainTx("tx1");
            expect(res).toBe(sampleBatch);
        });

        it("throws on DB error", async () => {
            (
                mockPrisma.batchProduct.findFirst as jest.Mock
            ).mockRejectedValueOnce(new Error("err"));
            await expect(
                batchSvc.getProductBatchByBlockchainTx("tx1")
            ).rejects.toThrow(
                "Product batch with blockchain transaction tx1 not found"
            );
        });
    });

    describe("getAvailableProductBatches", () => {
        it("returns [] when null", async () => {
            (
                mockPrisma.batchProduct.findMany as jest.Mock
            ).mockResolvedValueOnce(null as any);
            const res = await batchSvc.getAvailableProductBatches();
            expect(res).toEqual([]);
        });

        it("returns array on success", async () => {
            const arr = [sampleBatch];
            (
                mockPrisma.batchProduct.findMany as jest.Mock
            ).mockResolvedValueOnce(arr as any);
            const res = await batchSvc.getAvailableProductBatches();
            expect(res).toBe(arr);
            expect(mockPrisma.batchProduct.findMany).toHaveBeenCalledWith({
                where: { acquired: false },
                include: { farmer: true },
                orderBy: { createdAt: "asc" },
            });
        });

        it("throws on DB error", async () => {
            (
                mockPrisma.batchProduct.findMany as jest.Mock
            ).mockRejectedValueOnce(new Error("down"));
            await expect(batchSvc.getAvailableProductBatches()).rejects.toThrow(
                "Failed to fetch available product batches: Error: down"
            );
        });
    });

    describe("createProductBatch", () => {
        const input = {
            produceType: "T",
            description: "D",
            farmer: "u1",
            quantity: 5,
        };

        it("throws if produceType missing", async () => {
            // @ts-expect-error missing produceType
            await expect(batchSvc.createProductBatch({ description: "x" })
            ).rejects.toThrow(
                "produceType is required to create a product batch"
            );
        });

        it("creates successfully via transaction & blockchain", async () => {
            // set up tx mocks
            const txMock: any = {
                batchProduct: {
                    create: jest.fn().mockResolvedValue(sampleBatch),
                },
                productEvent: {
                    create: jest.fn().mockResolvedValue(sampleEvent),
                },
                inventory: { create: jest.fn() },
            };
            setupTransaction(txMock);
            // stub fabric
            const fabricMock: Partial<FabricGatewayService> = {
                submitTransaction: jest.fn().mockResolvedValue("ok"),
            };
            mockGetFabric.mockResolvedValueOnce(
                fabricMock as FabricGatewayService
            );

            const res = await batchSvc.createProductBatch(input as any);
            expect(res).toBe(sampleBatch);
            expect(txMock.batchProduct.create).toHaveBeenCalled();
            expect(txMock.productEvent.create).toHaveBeenCalled();
            expect(fabricMock.submitTransaction).toHaveBeenCalledWith(
                "CreateAsset",
                expect.stringContaining('"eventType":"PLANTED"')
            );
        });

        it("rethrows when transaction fails", async () => {
            mockPrisma.$transaction.mockRejectedValueOnce(
                new Error("Failed to create product batch: Error: tx fail")
            );
            await expect(
                batchSvc.createProductBatch(input as any)
            ).rejects.toThrow("Failed to create product batch: Error: tx fail");
        });
    });

    describe("updateProductBatch", () => {
        const updateData = { quantity: 10, farmer: "u1" };

        it("updates successfully via transaction & blockchain and creates inventory", async () => {
            const updatedBatch = {
                id: "b1",
                quantity: 10,
                farmer: { id: "u1", name: "F" },
                farmerId: "u1",
                produceType: "A",
            };
            const txMock: any = {
                batchProduct: {
                    update: jest.fn().mockResolvedValue(updatedBatch),
                },
                productEvent: {
                    create: jest.fn().mockResolvedValue(sampleEvent),
                },
                inventory: { create: jest.fn().mockResolvedValue({}) },
            };
            setupTransaction(txMock);
            const fabricMock: Partial<FabricGatewayService> = {
                submitTransaction: jest.fn().mockResolvedValue("ok"),
            };
            mockGetFabric.mockResolvedValueOnce(
                fabricMock as FabricGatewayService
            );

            const consoleSpy = jest.spyOn(console, "log");

            const res = await batchSvc.updateProductBatch("b1", updateData);
            expect(res).toBe(updatedBatch);
            expect(txMock.batchProduct.update).toHaveBeenCalledWith(
                expect.objectContaining({ where: { id: "b1" } })
            );
            expect(txMock.inventory.create).toHaveBeenCalledWith({
                data: {
                    batchId: updatedBatch.id,
                    quantity: 10,
                    userId: updatedBatch.farmerId,
                },
                include: {
                    user: true,
                    batch: true,
                },
            });
            expect(consoleSpy).toHaveBeenCalledWith(
                "Created inventory record:",
                expect.any(Object)
            );
            expect(fabricMock.submitTransaction).toHaveBeenCalledWith(
                "CreateAsset",
                expect.stringContaining('"eventType":"HARVESTED"')
            );

            consoleSpy.mockRestore();
        });

        it("updates successfully via transaction & blockchain but skips inventory creation if quantity is null", async () => {
            const updatedBatchWithoutQuantity = {
                id: "b1",
                quantity: null, // quantity is null
                farmer: { id: "u1", name: "F" },
                farmerId: "u1", // farmerId is present
                produceType: "A",
            };
            const txMock: any = {
                batchProduct: {
                    update: jest
                        .fn()
                        .mockResolvedValue(updatedBatchWithoutQuantity),
                },
                productEvent: {
                    create: jest.fn().mockResolvedValue(sampleEvent),
                },
                inventory: { create: jest.fn().mockResolvedValue({}) },
            };
            setupTransaction(txMock);
            const fabricMock: Partial<FabricGatewayService> = {
                submitTransaction: jest.fn().mockResolvedValue("ok"),
            };
            mockGetFabric.mockResolvedValueOnce(
                fabricMock as FabricGatewayService
            );

            const consoleSpy = jest.spyOn(console, "log");

            const res = await batchSvc.updateProductBatch("b1", {
                quantity: undefined, // Pass undefined to simulate no quantity update, leading to null in mock
                farmer: "u1", // Ensure farmer is passed so farmerId is present in the returned batch
            });
            expect(res).toBe(updatedBatchWithoutQuantity);
            expect(txMock.batchProduct.update).toHaveBeenCalledWith(
                expect.objectContaining({ where: { id: "b1" } })
            );
            expect(txMock.inventory.create).not.toHaveBeenCalled();
            expect(consoleSpy).not.toHaveBeenCalledWith(
                "Created inventory record:",
                expect.any(Object)
            );
            expect(fabricMock.submitTransaction).toHaveBeenCalledWith(
                "CreateAsset",
                expect.stringContaining('"eventType":"HARVESTED"')
            );

            consoleSpy.mockRestore();
        });

        it("updates successfully via transaction & blockchain but skips inventory creation if farmerId is null", async () => {
            const updatedBatchWithoutFarmerId = {
                id: "b1",
                quantity: 10,
                farmer: null,
                farmerId: null, // farmerId is null
                produceType: "A",
            };
            const txMock: any = {
                batchProduct: {
                    update: jest
                        .fn()
                        .mockResolvedValue(updatedBatchWithoutFarmerId),
                },
                productEvent: {
                    create: jest.fn().mockResolvedValue(sampleEvent),
                },
                inventory: { create: jest.fn().mockResolvedValue({}) },
            };
            setupTransaction(txMock);
            const fabricMock: Partial<FabricGatewayService> = {
                submitTransaction: jest.fn().mockResolvedValue("ok"),
            };
            mockGetFabric.mockResolvedValueOnce(
                fabricMock as FabricGatewayService
            );

            const consoleSpy = jest.spyOn(console, "log");

            const res = await batchSvc.updateProductBatch("b1", {
                farmer: undefined, // Pass undefined to simulate no farmer update, leading to null in mock
                quantity: 10, // Ensure quantity is passed so it's present in the returned batch
            });
            expect(res).toBe(updatedBatchWithoutFarmerId);
            expect(txMock.batchProduct.update).toHaveBeenCalledWith(
                expect.objectContaining({ where: { id: "b1" } })
            );
            expect(txMock.inventory.create).not.toHaveBeenCalled();
            expect(consoleSpy).not.toHaveBeenCalledWith(
                "Created inventory record:",
                expect.any(Object)
            );
            expect(fabricMock.submitTransaction).toHaveBeenCalledWith(
                "CreateAsset",
                expect.stringContaining('"eventType":"HARVESTED"')
            );

            consoleSpy.mockRestore();
        });

        it("rethrows when transaction errors", async () => {
            mockPrisma.$transaction.mockRejectedValueOnce(
                new Error("Failed to update product batch: Error: bad tx")
            );
            await expect(
                batchSvc.updateProductBatch("b1", updateData)
            ).rejects.toThrow("Failed to update product batch: Error: bad tx");
        });
    });

    describe("deleteProductBatch", () => {
        it("deletes successfully", async () => {
            (mockPrisma.batchProduct.delete as jest.Mock).mockResolvedValueOnce(
                sampleBatch as any
            );
            const res = await batchSvc.deleteProductBatch("b1");
            expect(res).toBe(sampleBatch);
            expect(mockPrisma.batchProduct.delete).toHaveBeenCalledWith({
                where: { id: "b1" },
            });
        });

        it("throws on DB error", async () => {
            (mockPrisma.batchProduct.delete as jest.Mock).mockRejectedValueOnce(
                new Error("nope")
            );
            await expect(batchSvc.deleteProductBatch("b1")).rejects.toThrow(
                "Failed to delete product batch: Error: nope"
            );
        });
    });
});
