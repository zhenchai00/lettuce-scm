import {
    CreateProductBatchData,
    UpdateProductBatchData,
} from "@/features/farmer/product-batch/type";
import prisma from "@/lib/prisma";

export const getProductBatches = async () => {
    const productBatches = await prisma.batchProduct.findMany({
        orderBy: {
            createdAt: "desc",
        },
        include: {
            farmer: true,
        },
    });
    return productBatches || [];
};

export const getProductBatchById = async (id: string) => {
    console.log("Fetching product batch with ID:", id);
    const productBatch = await prisma.batchProduct.findUnique({
        where: { id },
        include: {
            farmer: true,
        },
    });
    console.log("Fetched product batch:", productBatch);
    return productBatch || [];
};

export const getProductBatchesByUserId = async (userId: string) => {
    console.log("Fetching product batches for user ID:", userId);
    const productBatches = await prisma.batchProduct.findMany({
        where: { farmerId: userId },
        include: {
            farmer: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
    console.log("Fetched product batches for user:", productBatches);
    return productBatches || [];
};

export const getProductBatchByBlockchainTx = async (blockchainTx: string) => {
    console.log(
        "Fetching product batch with blockchain transaction:",
        blockchainTx
    );
    const productBatch = await prisma.batchProduct.findFirst({
        where: { blockchainTx },
        include: {
            farmer: true,
        },
    });
    console.log("Fetched product batch:", productBatch);
    return productBatch || [];
};

export const getAvailableProductBatches = async () => {
    console.log("Fetching available product batches");
    const productBatches = await prisma.batchProduct.findMany({
        where: {
            acquired: false,
        },
        include: {
            farmer: true,
        },
        orderBy: {
            createdAt: "asc",
        },
    });
    console.log("Fetched available product batches:", productBatches);
    return productBatches || [];
};

export const createProductBatch = async (data: CreateProductBatchData) => {
    console.log("Creating product batch:", data);

    if (!data.produceType) {
        throw new Error("produceType is required to create a product batch");
    }
    const productBatch = await prisma.batchProduct.create({
        data: {
            produceType: data.produceType,
            description: data.description,
            plantingDate: data.plantingDate ?? new Date(),
            farmer: { connect: { id: data.farmer } },
        },
        include: {
            farmer: true,
        },
    });
    console.log("Created product batch - " + productBatch.id, productBatch);

    const productEvent = await prisma.productEvent.create({
        data: {
            batch: { connect: { id: productBatch.id } },
            user: { connect: { id: data.farmer } },
            eventType: "PLANTED",
            description: `${productBatch.farmer?.name} planted product batch for ${productBatch.produceType}`,
            timestamp: new Date(),
        },
    });
    console.log("Created product event - " + productEvent.id, productEvent);

    const createAssetDetails = {
        id: productEvent.id,
        eventType: "PLANTED",
        timestamp: new Date().toISOString(),
        quantity: data.quantity || 0,
        description: `${productBatch.farmer?.name} planted product batch for ${productBatch.produceType}`,
        batchId: productBatch.id,
        userId: data.farmer,
    };
    const fabricService = await getFabricService();
    const createAssetResult = await fabricService.submitTransaction(
        "CreateAsset",
        JSON.stringify(createAssetDetails)
    );
    console.log("Created asset on blockchain:", createAssetResult);

    return productBatch;
};

export const updateProductBatch = async (
    id: string,
    data: Partial<UpdateProductBatchData>
) => {
    console.log("Updating product batch with ID:", id, "Data:", data);

    const { farmer, ...restData } = data;
    const updateData: any = { ...restData };
    if (farmer) {
        updateData.farmer = { connect: { id: farmer } };
    }

    const productBatch = await prisma.batchProduct.update({
        where: { id },
        data: updateData,
        include: {
            farmer: true,
        },
    });
    console.log("Updated product batch - " + productBatch.id, productBatch);

    if (productBatch.quantity && productBatch.farmerId) {
        // Create or update inventory record
        const inventory = await prisma.inventory.create({
            data: {
                batchId: productBatch.id,
                quantity: productBatch.quantity || 0,
                userId: productBatch.farmerId,
            },
            include: {
                user: true,
                batch: true,
            }
        });
        console.log("Created inventory record:", inventory);
    }

    const productEvent = await prisma.productEvent.create({
        data: {
            batch: { connect: { id: productBatch.id } },
            user: { connect: { id: productBatch.farmerId } },
            eventType: "HARVESTED",
            description: `${productBatch.farmer?.name} harvested product batch for ${productBatch.produceType}`,
            timestamp: new Date(),
        },
    });
    console.log("Created product event - " + productEvent.id, productEvent);

    return productBatch;
};

export const deleteProductBatch = async (id: string) => {
    console.log("Deleting product batch with ID:", id);

    const productBatch = await prisma.batchProduct.delete({
        where: { id },
    });
    console.log("Deleted product batch - " + productBatch.id, productBatch);
    return productBatch;
};
