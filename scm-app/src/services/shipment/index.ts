import prisma from "@/lib/prisma";

export const getShipment = async () => {
    console.log("Fetching shipments");
    const shipments = await prisma.shipment.findMany({
        orderBy: {
            createdAt: "desc",
        },
        include: {
            batch: true,
            fromUser: true,
            toUser: true,
        },
    });
    console.log("Fetched shipments:", shipments);
    return shipments || [];
};

export const getShipmentById = async (id: string) => {
    console.log("Fetching shipment with ID:", id);
    const shipment = await prisma.shipment.findUnique({
        where: { id },
        include: {
            batch: true,
            fromUser: true,
            toUser: true,
        },
    });
    console.log("Fetched shipment:", shipment);
    return shipment || [];
};

// Fetch all shipments for a specific user, either as sender or receiver
export const getAllShipmentByUserId = async (userId: string) => {
    console.log("Fetching shipments for user ID:", userId);
    const shipments = await prisma.shipment.findMany({
        where: {
            OR: [{ fromUserId: userId }, { toUserId: userId }],
        },
        include: {
            batch: true,
            fromUser: true,
            toUser: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
    console.log("Fetched shipments for user:", shipments);
    return shipments || [];
};

export const createShipment = async (data: any) => {
    console.log("Creating shipment:", data);
    const inventory = await prisma.inventory.findUnique({
        where: {
            unique_inventory: {
                batchId: data.productBatch,
                userId: data.fromUser,
            },
        },
        include: {
            batch: true,
            user: true,
        },
    });
    const toUser = await prisma.user.findUnique({
        where: { id: data.toUser },
    });
    const shipmentData: any = {
        createdAt: new Date(),
        updatedAt: new Date(),
        quantity: data.quantity,
        status: "ORDERED",
        batch: { connect: { id: data.productBatch } },
    };
    if (toUser) {
        shipmentData.toUser = { connect: { id: toUser.id } };
    }
    if (inventory?.user) {
        shipmentData.fromUser = { connect: { id: inventory.user.id } };
    }
    const shipment = await prisma.shipment.create({
        data: shipmentData,
        include: {
            batch: true,
            fromUser: true,
            toUser: true,
        },
    });
    console.log("Created shipment - " + shipment.id, shipment);
    return shipment;
};

export const updateShipment = async (id: string, data: any) => {
    console.log("Updating shipment with ID:", id, "Data:", data);
    switch (data.status) {
        case "ORDERED":
            data.shippedDate = null;
            data.deliveryDate = null;
            break;
        case "OUTOFDELIVERY":
            data.shippedDate = new Date();
            break;
        case "DELIVERED":
            data.deliveryDate = new Date();
            break;
        case "CANCELLED":
            data.shippedDate = null;
            data.deliveryDate = null;
            break;
        default:
            console.warn("Unknown status:", data.status);
            break;
    }
    const shipment = await prisma.shipment.update({
        where: { id },
        data: {
            ...data,
            updatedAt: new Date(),
        },
        include: {
            batch: true,
            fromUser: true,
            toUser: true,
        },
    });
    console.log("Updated shipment - " + shipment.id, shipment);

    // update sender inventory if the status is OUTOFDELIVERY
    if (data.status === "OUTOFDELIVERY") {
        const currentInventory = await prisma.inventory.findUnique({
            where: {
                unique_inventory: {
                    batchId: shipment.batchId,
                    userId: shipment.fromUserId,
                },
            },
        });
        if (!currentInventory) {
            console.warn("No inventory found for shipment:", shipment);
            return shipment;
        }
        const newInventory = await prisma.inventory.update({
            data: {
                // Decrease the quantity in sender's inventory
                quantity: currentInventory.quantity - (shipment.quantity || 0),
                updatedAt: new Date(),
            },
            where: {
                unique_inventory: {
                    batchId: shipment.batchId,
                    userId: shipment.fromUserId,
                },
            },
            include: {
                batch: true,
                user: true,
            },
        });
        console.log("Updated inventory - " + newInventory.id, newInventory);

        // update product event 
        const productEvent = await prisma.productEvent.create({
            data: {
                batchId: shipment.batchId,
                userId: shipment.fromUserId,
                shipmentId: shipment.id,
                quantity: (shipment.quantity || 0),
                eventType: "SHIPPED",
                description: `Shipment ${shipment.id} shipped from ${shipment.fromUser?.name} to ${shipment.toUser?.name}`,
                timestamp: new Date(),
            },
        });
        console.log("Created product event - " + productEvent.id, productEvent);
    }

    // update receiver inventory if the status is DELIVERED
    if (data.status === "DELIVERED") {
        const currentInventory = await prisma.inventory.findUnique({
            where: {
                unique_inventory: {
                    batchId: shipment.batchId,
                    userId: shipment.toUserId,
                },
            },
            include: {
                batch: true,
                user: true,
            }
        });
        const newInventory = await prisma.inventory.upsert({
            create: {
                batchId: shipment.batchId,
                userId: shipment.toUserId,
                quantity: shipment.quantity || 0,
                updatedAt: new Date(),
            },
            update: {
                quantity: currentInventory
                    ? currentInventory.quantity + (shipment.quantity || 0)
                    : shipment.quantity || 0,
                updatedAt: new Date(),
            },
            where: {
                unique_inventory: {
                    batchId: shipment.batchId,
                    userId: shipment.toUserId,
                },
            },
            include: {
                batch: true,
                user: true,
            }
        });
        console.log("Updated inventory:", newInventory);

        if (newInventory.user.role === "RETAILER") {
            const batch = await prisma.shipment.update({
                where: { id },
                data: {
                    // this is to let consumer know the shipment is delivered
                    trackingKey: `${newInventory.userId}-${newInventory.id}-${newInventory.batchId}`,
                }
            });
            console.log("Updated shipment with tracking key - " + batch.id, batch);
        }

        // update product event
        const productEvent = await prisma.productEvent.create({
            data: {
                batchId: shipment.batchId,
                shipmentId: shipment.id,
                userId: shipment.toUserId,
                quantity: shipment.quantity || 0,
                eventType: "DELIVERED",
                description: `Shipment ${shipment.id} received by to ${shipment.toUser?.name}`,
                timestamp: new Date(),
            },
        });
        console.log("Created product event - " + productEvent.id, productEvent);
    }
    return shipment;
};

export const deleteShipment = async (id: string) => {
    console.log("Deleting shipment with ID:", id);
    const shipment = await prisma.shipment.delete({
        where: { id },
    });
    console.log("Deleted shipment:", shipment);
    return shipment;
};
