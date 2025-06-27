import prisma from "@/lib/prisma"

export interface ProductJourneyEvent {
    eventType: string;
    timestamp: Date;
    description: string;
    user: {
        id: string;
        name: string;
        email: string;
    }
}

export interface ProductJourney {
    batchId: string;
    trackingKey: string;
    events: ProductJourneyEvent[];
}

export const getTrackingInfo = async (trackingNumber: string) => {
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
    console.log("Fetched tracking info for number:", trackingNumber, shipment);

    // If no shipment found, return an empty array
    if (!shipment) {
        console.log("No shipment found for tracking number:", trackingNumber);
        return [];
    }

    // get the product batch details
    const batchProduct = await prisma.batchProduct.findFirst({
        where: {
            id: shipment?.batchId,
        },
        include: {
            farmer: true,
        },
    });

    // farmer based product events will be used to show the journey of the product from farmer to retailer
    const farmerBasedProductEvents = await prisma.productEvent.findMany({
        where: {
            batchId: shipment?.batchId,
            userId: batchProduct?.farmerId,
        },
        include: {
            user: true,
        },
    });

    // distributor based product events will be used to show the journey of the product from distributor to retailer
    const distributorBasedProductEvents = await prisma.productEvent.findMany({
        where: {
            batchId: shipment?.batchId,
            userId: shipment?.fromUserId,
        },
        include: {
            user: true,
        },
    });

    // retailer based product events will be used to show the journey of the product from distributor to retailer
    const retailerBasedProductEvents = await prisma.productEvent.findMany({
        where: {
            batchId: shipment?.batchId,
            userId: shipment?.toUserId,
        },
        include: {
            user: true,
        },
    });

    // Combine all events into a single array
    const allEvents: ProductJourneyEvent[] = [
        ...farmerBasedProductEvents,
        ...distributorBasedProductEvents,
        ...retailerBasedProductEvents,
    ].map(event => ({
        eventType: event.eventType,
        timestamp: event.timestamp,
        description: event.description ?? "",
        user: {
            id: event.user.id,
            name: event.user.name,
            email: event.user.email,
        },
    }));

    // Sort events by timestamp in ascending order
    allEvents.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Create the product journey object
    const productJourney: ProductJourney = {
        batchId: shipment?.batchId || "",
        trackingKey: shipment?.trackingKey || "",
        events: allEvents,
    };

    return productJourney;
}