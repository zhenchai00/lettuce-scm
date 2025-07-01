import { getFabricService } from "@/lib/fabric";
import prisma from "@/lib/prisma";

export interface ProductJourneyEvent {
    eventType: string;
    timestamp: Date;
    description: string;
    txHash: string;
    user: {
        id: string;
        name: string;
        email: string;
    };
}

export interface ProductJourney {
    batchId: string;
    trackingKey: string;
    events: ProductJourneyEvent[];
}

export const getTrackingInfo = async (
    trackingNumber: string
): Promise<ProductJourney> => {
    // get the shipment based on the trackingkey = retailerId-batchId-shipmentId
    const shipment = await prisma.shipment.findFirst({
        where: {
            trackingKey: trackingNumber,
        },
        orderBy: {
            createdAt: "desc",
        },
        include: {
            batch: true,
            toUser: true,
            fromUser: true,
        },
    });
    // If no shipment found, return an empty array
    if (!shipment) {
        throw new Error("Shipment not found for the provided tracking number.");
    }

    // get the product batch details
    const batch = await prisma.batchProduct.findFirst({
        where: {
            id: shipment?.batchId,
        },
        include: {
            farmer: true,
        },
    });
    if (!batch) {
        throw new Error("Batch not found for the provided shipment.");
    }

    const distributorShipment = await prisma.shipment.findFirst({
        where: {
            batchId: batch?.id,
            fromUserId: batch?.farmerId,
            toUserId: shipment?.fromUserId,
        },
        orderBy: {
            createdAt: "desc",
        },
        include: {
            batch: true,
            toUser: true,
            fromUser: true,
        },
    });

    const stages = [
        {
            label: "farmer",
            shipmentId: "",
            userId: batch?.farmerId,
        },
        {
            label: "distributor",
            shipmentId: distributorShipment?.id ?? "",
            userId: shipment?.fromUserId,
        },
        {
            label: "distributor",
            shipmentId: shipment?.id ?? "",
            userId: shipment?.fromUserId,
        },
        {
            label: "retailer",
            shipmentId: shipment?.id,
            userId: shipment?.toUserId,
        },
    ];

    const fabricService = await getFabricService();
    const rawJson = await Promise.all(
        stages.map(({ shipmentId, userId }) =>
            fabricService
                .submitTransaction(
                    "GetProductJourney",
                    batch?.id,
                    shipmentId,
                    userId
                )
                .catch(() => null)
        )
    );
    console.log("Raw events by stage:", rawJson);

    const rawEvents = rawJson
        .filter((js) => typeof js === "string")
        .flatMap((js) => JSON.parse(js as string));

    const userCache = new Map<string, { name: string; email: string }>();
    const loadUser = async (uid: string) => {
        if (!userCache.has(uid)) {
            const u = await prisma.user.findUnique({
                where: { id: uid },
                select: {
                    name: true,
                    email: true,
                },
            });
            userCache.set(uid, {
                name: u?.name ?? "Unknown",
                email: u?.email ?? "Unknown",
            });
        }
        return userCache.get(uid)!;
    };

    const events = await Promise.all(
        rawEvents.map(async (e) => {
            const { name, email } = await loadUser(e.userId);
            return {
                eventType: e.eventType,
                timestamp: new Date(e.timestamp),
                description: e.description ?? "",
                txHash: e.txHash ?? "",
                user: { id: e.userId, name, email },
            } as ProductJourneyEvent;
        })
    );

    // 8) Sort & return
    events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    return {
        batchId: batch.id,
        trackingKey: trackingNumber,
        events,
    };
};
