import prisma from "@/lib/prisma";
import * as inventoryServices from "@/services/inventory";

jest.mock("@/lib/prisma", () => ({
    __esModule: true,
    default: jest.fn(),
}));
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe("Inventory service", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("getInventory", () => {
        it("returns [] when prisma.inventory.findMany resolves null", async () => {
            (mockPrisma.inventory.findMany as jest.Mock).mockResolvedValueOnce(
                null as any
            );
            const res = await inventoryServices.getInventory();
            expect(res).toEqual([]);
            expect(mockPrisma.inventory.findMany).toHaveBeenCalledWith({
                orderBy: { createdAt: "desc" },
                include: { user: true, batch: true },
            });
        });

        it("returns array when prisma.inventory.findMany returns data", async () => {
            const fake = [{ id: "i1", quantity: 10 }];
            (mockPrisma.inventory.findMany as jest.Mock).mockResolvedValueOnce(
                fake as any
            );
            const res = await inventoryServices.getInventory();
            expect(res).toBe(fake);
        });
    });

    describe("getInventoryById", () => {
        it("returns [] when not found", async () => {
            (
                mockPrisma.inventory.findUnique as jest.Mock
            ).mockResolvedValueOnce(null as any);
            const res = await inventoryServices.getInventoryById("nope");
            expect(res).toEqual([]);
            expect(mockPrisma.inventory.findUnique).toHaveBeenCalledWith({
                where: { id: "nope" },
                include: { user: true, batch: true },
            });
        });

        it("returns object when found", async () => {
            const inv = { id: "i2", quantity: 5 };
            (
                mockPrisma.inventory.findUnique as jest.Mock
            ).mockResolvedValueOnce(inv as any);
            const res = await inventoryServices.getInventoryById("i2");
            expect(res).toBe(inv);
        });
    });

    describe("getInventoryByUserId", () => {
        it("returns [] when none", async () => {
            (mockPrisma.inventory.findMany as jest.Mock).mockResolvedValueOnce(
                null as any
            );
            const res = await inventoryServices.getInventoryByUserId("u1");
            expect(res).toEqual([]);
            expect(mockPrisma.inventory.findMany).toHaveBeenCalledWith({
                where: { userId: "u1" },
                include: { user: true, batch: true },
                orderBy: { createdAt: "desc" },
            });
        });

        it("returns array when found", async () => {
            const arr = [{ id: "i3", userId: "u1" }];
            (mockPrisma.inventory.findMany as jest.Mock).mockResolvedValueOnce(
                arr as any
            );
            const res = await inventoryServices.getInventoryByUserId("u1");
            expect(res).toBe(arr);
        });
    });

    describe("getInventoryByUserRole", () => {
        it("returns [] when none", async () => {
            (mockPrisma.inventory.findMany as jest.Mock).mockResolvedValueOnce(
                null as any
            );
            const res = await inventoryServices.getInventoryByUserRole(
                "farmer"
            );
            expect(res).toEqual([]);
            expect(mockPrisma.inventory.findMany).toHaveBeenCalledWith({
                where: { user: { role: "farmer" } },
                include: { user: true, batch: true },
                orderBy: { createdAt: "desc" },
            });
        });

        it("returns array when found", async () => {
            const arr = [{ id: "i4", user: { role: "farmer" } }];
            (mockPrisma.inventory.findMany as jest.Mock).mockResolvedValueOnce(
                arr as any
            );
            const res = await inventoryServices.getInventoryByUserRole(
                "farmer"
            );
            expect(res).toBe(arr);
        });
    });

    describe("createInventory", () => {
        const input = { batchId: "b1", userId: "u1", quantity: 20 };

        it("creates and returns the new record", async () => {
            const created = {
                id: "i5",
                ...input,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            (mockPrisma.inventory.create as jest.Mock).mockResolvedValueOnce(
                created as any
            );

            const res = await inventoryServices.createInventory(input);
            expect(mockPrisma.inventory.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    ...input,
                    createdAt: expect.any(Date),
                    updatedAt: expect.any(Date),
                }),
                include: { user: true, batch: true },
            });
            expect(res).toEqual(created);
        });
    });

    describe("updateInventory", () => {
        const id = "i6";
        const updateData = { quantity: 30 };

        it("updates and returns the record", async () => {
            const updated = { id, ...updateData, updatedAt: new Date() };
            (mockPrisma.inventory.update as jest.Mock).mockResolvedValueOnce(
                updated as any
            );

            const res = await inventoryServices.updateInventory(id, updateData);
            expect(mockPrisma.inventory.update).toHaveBeenCalledWith({
                where: { id },
                data: expect.objectContaining({
                    quantity: 30,
                    updatedAt: expect.any(Date),
                }),
                include: { user: true, batch: true },
            });
            expect(res).toEqual(updated);
        });

        it("uses quantity = 0 when updatedData.quantity is undefined", async () => {
            const id = "i8";
            const updateData = {} as any; // no quantity provided
            const fakeUpdated = {
                id,
                quantity: 0,
                updatedAt: new Date(),
            };
            (mockPrisma.inventory.update as jest.Mock).mockResolvedValueOnce(
                fakeUpdated as any
            );

            const res = await inventoryServices.updateInventory(id, updateData);

            // It should default quantity to 0
            expect(mockPrisma.inventory.update).toHaveBeenCalledWith({
                where: { id },
                data: expect.objectContaining({
                    quantity: 0,
                    updatedAt: expect.any(Date),
                }),
                include: { user: true, batch: true },
            });

            expect(res).toEqual(fakeUpdated);
        });
    });

    describe("deleteInventory", () => {
        const id = "i7";

        it("deletes and returns the record", async () => {
            const deleted = { id };
            (mockPrisma.inventory.delete as jest.Mock).mockResolvedValueOnce(
                deleted as any
            );

            const res = await inventoryServices.deleteInventory(id);
            expect(mockPrisma.inventory.delete).toHaveBeenCalledWith({
                where: { id },
            });
            expect(res).toEqual(deleted);
        });
    });
});

describe("Inventory service error paths", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("getInventory: throws when findMany rejects", async () => {
        (mockPrisma.inventory.findMany as jest.Mock).mockRejectedValueOnce(
            new Error("DB down")
        );
        await expect(inventoryServices.getInventory()).rejects.toThrow(
            "Failed to fetch inventory: Error: DB down"
        );
    });

    it("getInventoryById: throws custom not found error when findUnique rejects", async () => {
        (mockPrisma.inventory.findUnique as jest.Mock).mockRejectedValueOnce(
            new Error("oops")
        );
        await expect(inventoryServices.getInventoryById("x")).rejects.toThrow(
            "Inventory with ID x not found"
        );
    });

    it("getInventoryByUserId: throws when findMany rejects", async () => {
        (mockPrisma.inventory.findMany as jest.Mock).mockRejectedValueOnce(
            new Error("nope")
        );
        await expect(
            inventoryServices.getInventoryByUserId("u1")
        ).rejects.toThrow("Inventory for user ID u1 not found");
    });

    it("getInventoryByUserRole: throws when findMany rejects", async () => {
        (mockPrisma.inventory.findMany as jest.Mock).mockRejectedValueOnce(
            new Error("err")
        );
        await expect(
            inventoryServices.getInventoryByUserRole("farmer")
        ).rejects.toThrow("Inventory for user role farmer not found");
    });

    it("createInventory: throws when prisma.create rejects", async () => {
        (mockPrisma.inventory.create as jest.Mock).mockRejectedValueOnce(
            new Error("write fail")
        );
        await expect(
            inventoryServices.createInventory({
                batchId: "b",
                userId: "u",
                quantity: 1,
            })
        ).rejects.toThrow("Failed to create inventory: Error: write fail");
    });

    it("updateInventory: throws when prisma.update rejects", async () => {
        (mockPrisma.inventory.update as jest.Mock).mockRejectedValueOnce(
            new Error("no update")
        );
        await expect(
            inventoryServices.updateInventory("i1", { quantity: 2 })
        ).rejects.toThrow(
            "Failed to update inventory with ID i1: Error: no update"
        );
    });

    it("deleteInventory: throws when prisma.delete rejects", async () => {
        (mockPrisma.inventory.delete as jest.Mock).mockRejectedValueOnce(
            new Error("gone")
        );
        await expect(inventoryServices.deleteInventory("i2")).rejects.toThrow(
            "Failed to delete inventory with ID i2: Error: gone"
        );
    });
});
