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
    console.log("Created product batch:", productBatch);
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
    console.log("Updated product batch:", productBatch);

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
    return productBatch;
};

export const deleteProductBatch = async (id: string) => {
    console.log("Deleting product batch with ID:", id);

    const productBatch = await prisma.batchProduct.delete({
        where: { id },
    });
    console.log("Deleted product batch:", productBatch);
    return productBatch;
};
