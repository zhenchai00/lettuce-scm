import prisma from "@/lib/prisma";
import { getShopProducts } from "@/services/public/shop";

jest.mock("@/lib/prisma");

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe("getShopProducts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns [] when the database returns null", async () => {
    (mockPrisma.inventory.findMany as jest.Mock).mockResolvedValueOnce(null as any);

    const res = await getShopProducts();
    expect(res).toEqual([]);
    expect(mockPrisma.inventory.findMany).toHaveBeenCalledWith({
      where: { user: { role: "RETAILER" } },
      include: { batch: true, user: true },
      orderBy: { createdAt: "asc" },
    });
  });

  it("returns the array of products on success", async () => {
    const fake = [
      { id: "i1", quantity: 10, batch: { /* … */ }, user: { /* … */ } }
    ];
    (mockPrisma.inventory.findMany as jest.Mock).mockResolvedValueOnce(fake as any);

    const res = await getShopProducts();
    expect(res).toBe(fake);
  });

  it("propagates errors when the database call fails", async () => {
    (mockPrisma.inventory.findMany as jest.Mock).mockRejectedValueOnce(new Error("DB down"));
    await expect(getShopProducts()).rejects.toThrow("DB down");
  });
});