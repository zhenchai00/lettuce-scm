// tests/services/public/tracking.test.ts
import { getTrackingInfo } from "@/services/public/tracking";
import prisma from "@/lib/prisma";
import { getFabricService } from "@/lib/fabric";

// poke in the private helper so we can test its fallback
import * as trackingModule from "@/services/public/tracking";

jest.mock("@/lib/prisma");
jest.mock("@/lib/fabric");

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockGetFabric = getFabricService as jest.MockedFunction<
    typeof getFabricService
>;

describe("getTrackingInfo", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("throws if no shipment matches the tracking number", async () => {
        (mockPrisma.shipment.findFirst as jest.Mock).mockResolvedValueOnce(
            null as any
        );
        await expect(getTrackingInfo("nope")).rejects.toThrow(
            "Shipment not found for the provided tracking number."
        );
    });

    it("throws if shipment found but batch is missing", async () => {
        (mockPrisma.shipment.findFirst as jest.Mock).mockResolvedValueOnce({
            id: "s1",
            batchId: "b1",
            fromUserId: "fu1",
            toUserId: "tu1",
            trackingKey: "foo",
            createdAt: new Date(),
        } as any);
        (mockPrisma.batchProduct.findFirst as jest.Mock).mockResolvedValueOnce(
            null as any
        );

        await expect(getTrackingInfo("foo")).rejects.toThrow(
            "Batch not found for the provided shipment."
        );
    });

    it("builds and returns a sorted ProductJourney on success", async () => {
        const now = Date.now();

        // 1) Main shipment
        (mockPrisma.shipment.findFirst as jest.Mock)
            .mockResolvedValueOnce({
                id: "s-main",
                batchId: "b1",
                fromUserId: "fu1",
                toUserId: "tu1",
                trackingKey: "foo",
                createdAt: new Date(now - 1000),
            } as any)
            // 2) Distributor‐stage shipment
            .mockResolvedValueOnce({
                id: "s-dist",
                batchId: "b1",
                fromUserId: "farmer1",
                toUserId: "fu1",
                createdAt: new Date(now - 1500),
            } as any);

        // 3) Batch lookup
        (mockPrisma.batchProduct.findFirst as jest.Mock).mockResolvedValueOnce({
            id: "b1",
            farmerId: "farmer1",
            createdAt: new Date(now - 2000),
        } as any);

        // 4) On‐chain payloads: both payloads list userId=farmer1
        const fake1 = [
            {
                eventType: "PLANTED",
                timestamp: new Date(now - 3000).toISOString(),
                description: "planted",
                txHash: "t1",
                userId: "farmer1",
            },
        ];
        const fake2 = [
            {
                eventType: "SHIPPED",
                timestamp: new Date(now - 2500).toISOString(),
                description: "shipped",
                txHash: "t2",
                userId: "farmer1",
            },
        ];

        const fabricMock = {
            submitTransaction: jest
                .fn()
                .mockResolvedValueOnce(JSON.stringify(fake1)) // stage0
                .mockResolvedValueOnce(JSON.stringify(fake2)) // stage1
                .mockRejectedValueOnce(new Error("err")) // stage2 → swallowed
                .mockResolvedValueOnce("[]"), // stage3
        };
        mockGetFabric.mockResolvedValueOnce(fabricMock as any);

        // 5) Only farmer1 ever looked up
        (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
            id: "farmer1",
            name: "Farmer Joe",
            email: "farmer@x.com",
        } as any);

        const journey = await getTrackingInfo("foo");

        expect(journey.batchId).toBe("b1");
        expect(journey.trackingKey).toBe("foo");
        expect(journey.events).toHaveLength(2);

        // both events come from farmer1
        expect(journey.events[0]).toMatchObject({
            eventType: "PLANTED",
            description: "planted",
            txHash: "t1",
            user: { id: "farmer1", name: "Farmer Joe", email: "farmer@x.com" },
        });
        expect(journey.events[1]).toMatchObject({
            eventType: "SHIPPED",
            description: "shipped",
            txHash: "t2",
            user: { id: "farmer1", name: "Farmer Joe", email: "farmer@x.com" },
        });

        expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(2);
        // four on-chain calls
        expect(fabricMock.submitTransaction).toHaveBeenCalledTimes(4);
    });
});
