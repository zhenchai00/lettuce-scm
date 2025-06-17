import { CreateProductBatchData, UpdateProductBatchData } from "@/features/farmer/product-batch/type";
import prisma from "@/lib/prisma";

export const getProductBatches = async () => {
    const productBatches = await prisma.batchProduct.findMany({
        orderBy: {
            createdAt: "desc",
        },
    });
    return productBatches || [];
}

export const getProductBatchById = async (id: string) => {
    console.log("Fetching product batch with ID:", id);
    const productBatch = await prisma.batchProduct.findUnique({
        where: { id },
    });
    console.log("Fetched product batch:", productBatch);
    return productBatch || [];
};

export const getProductBatchByBlockchainTx = async (blockchainTx: string) => {
    console.log("Fetching product batch with blockchain transaction:", blockchainTx);
    const productBatch = await prisma.batchProduct.findFirst({
        where: { blockchainTx },
    });
    console.log("Fetched product batch:", productBatch);
    return productBatch || [];
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
    });
    console.log("Created product batch:", productBatch);
    return productBatch;
};

export const updateProductBatch = async (id: string, data: Partial<UpdateProductBatchData>) => {
    console.log("Updating product batch with ID:", id, "Data:", data);

    const { farmer, ...restData } = data;
    const updateData: any = { ...restData };
    if (farmer) {
        updateData.farmer = { connect: { id: farmer } };
    }

    const productBatch = await prisma.batchProduct.update({
        where: { id },
        data: updateData,
    });
    console.log("Updated product batch:", productBatch);
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