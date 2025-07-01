import {
    CreateProductBatchData,
    UpdateProductBatchData,
} from "@/features/farmer/product-batch/type";
import { getFabricService } from "@/lib/fabric";
import prisma from "@/lib/prisma";

export const getProductBatches = async () => {
    try {
        const productBatches = await prisma.batchProduct.findMany({
            orderBy: {
                createdAt: "desc",
            },
            include: {
                farmer: true,
            },
        });
        return productBatches || [];
    } catch (error) {
        console.error("Error fetching product batches:", error);
        throw new Error("Failed to fetch product batches: " + error);
    }
};

export const getProductBatchById = async (id: string) => {
    try {
        console.log("Fetching product batch with ID:", id);
        const productBatch = await prisma.batchProduct.findUnique({
            where: { id },
            include: {
                farmer: true,
            },
        });
        console.log("Fetched product batch:", productBatch);
        return productBatch || [];
    } catch (error) {
        console.error("Error fetching product batch by ID:", error);
        throw new Error(`Product batch with ID ${id} not found`);
    }
};

export const getProductBatchesByUserId = async (userId: string) => {
    try {
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
    } catch (error) {
        console.error("Error fetching product batches by user ID:", error);
        throw new Error(`Product batches for user ID ${userId} not found`);
    }
};

export const getProductBatchByBlockchainTx = async (blockchainTx: string) => {
    try {
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
    } catch (error) {
        console.error(
            "Error fetching product batch by blockchain transaction:",
            error
        );
        throw new Error(
            `Product batch with blockchain transaction ${blockchainTx} not found`
        );
    }
};

export const getAvailableProductBatches = async () => {
    try {
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
    } catch (error) {
        console.error("Error fetching available product batches:", error);
        throw new Error("Failed to fetch available product batches: " + error);
    }
};

export const createProductBatch = async (data: CreateProductBatchData) => {
    try {
        console.log("Creating product batch:", data);
        if (!data.produceType) {
            throw new Error(
                "produceType is required to create a product batch"
            );
        }

        return prisma.$transaction(async (tx) => {
            const productBatch = await tx.batchProduct.create({
                data: {
                    produceType: data.produceType as NonNullable<
                        typeof data.produceType
                    >,
                    description: data.description,
                    plantingDate: data.plantingDate ?? new Date(),
                    farmer: { connect: { id: data.farmer } },
                },
                include: {
                    farmer: true,
                },
            });
            console.log(
                "Created product batch - " + productBatch.id,
                productBatch
            );

            const productEvent = await tx.productEvent.create({
                data: {
                    batch: { connect: { id: productBatch.id } },
                    user: { connect: { id: data.farmer } },
                    eventType: "PLANTED",
                    description: `${productBatch.farmer?.name} planted product batch for ${productBatch.produceType}`,
                    timestamp: new Date(),
                },
            });
            console.log(
                "Created product event - " + productEvent.id,
                productEvent
            );

            const fabricService = await getFabricService();
            const createAssetDetails = {
                id: productEvent.id,
                eventType: "PLANTED",
                timestamp: new Date().toISOString(),
                quantity: data.quantity || 0,
                description: `${productBatch.farmer?.name} planted product batch for ${productBatch.produceType}`,
                batchId: productBatch.id,
                userId: data.farmer,
            };
            await fabricService.submitTransaction(
                "CreateAsset",
                JSON.stringify(createAssetDetails)
            );
            console.log("Created asset on blockchain (PLANTED)");

            return productBatch;
        });
    } catch (error) {
        console.error("Error creating product batch:", error);
        throw new Error("Failed to create product batch: " + error);
    }
};

export const updateProductBatch = async (
    id: string,
    data: Partial<UpdateProductBatchData>
) => {
    try {
        console.log("Updating product batch with ID:", id, "Data:", data);

        return prisma.$transaction(async (tx) => {
            // 1. update the product batch
            const { farmer, ...restData } = data;
            const updateData: any = { ...restData };
            if (farmer) {
                updateData.farmer = { connect: { id: farmer } };
            }
            const productBatch = await tx.batchProduct.update({
                where: { id },
                data: updateData,
                include: {
                    farmer: true,
                },
            });
            console.log(
                "Updated product batch - " + productBatch.id,
                productBatch
            );

            // 2. optional inventory entry
            if (productBatch.quantity && productBatch.farmerId) {
                // Create or update inventory record
                const inventory = await tx.inventory.create({
                    data: {
                        batchId: productBatch.id,
                        quantity: productBatch.quantity,
                        userId: productBatch.farmerId,
                    },
                    include: {
                        user: true,
                        batch: true,
                    },
                });
                console.log("Created inventory record:", inventory);
            }

            // 3. create product event
            const productEvent = await tx.productEvent.create({
                data: {
                    batch: { connect: { id: productBatch.id } },
                    user: { connect: { id: productBatch.farmerId } },
                    eventType: "HARVESTED",
                    description: `${productBatch.farmer?.name} harvested product batch for ${productBatch.produceType}`,
                    timestamp: new Date(),
                },
            });
            console.log(
                "Created product event - " + productEvent.id,
                productEvent
            );

            // 4. create asset on blockchain
            const createAssetDetails = {
                id: productEvent.id,
                eventType: "HARVESTED",
                timestamp: new Date().toISOString(),
                quantity: productBatch.quantity || 0,
                description: `${productBatch.farmer?.name} harvested product batch for ${productBatch.produceType}`,
                batchId: productBatch.id,
                userId: productBatch.farmerId,
            };
            const fabricService = await getFabricService();
            await fabricService.submitTransaction(
                "CreateAsset",
                JSON.stringify(createAssetDetails)
            );
            console.log("Created asset on blockchain (HARVESTED)");

            return productBatch;
        });
    } catch (error) {
        console.error("Error updating product batch:", error);
        throw new Error("Failed to update product batch: " + error);
    }
};

export const deleteProductBatch = async (id: string) => {
    try {
        console.log("Deleting product batch with ID:", id);

        const productBatch = await prisma.batchProduct.delete({
            where: { id },
        });
        console.log("Deleted product batch - " + productBatch.id, productBatch);
        return productBatch;
    } catch (error) {
        console.error("Error deleting product batch:", error);
        throw new Error("Failed to delete product batch: " + error);
    }
};
