import { UserRow } from "@/features/admin/users/type";
import { ProduceType } from "generated/prisma";

export type ProductBatchData = {
    produceType: ProduceType;
    description: string;
    plantingDate: Date;
    harvestDate: Date;
    quantity: number;
    blockchainTx?: string;
};

export type ProductBatchRow = {
    id: string;
    produceType: ProduceType;
    description: string;
    plantingDate: Date;
    harvestDate: Date;
    quantity: number;
    blockchainTx?: string;
    farmerId: string;
    createdAt: Date;
    updatedAt: Date;
    farmer?: UserRow;
};

export type CreateProductBatchData = Partial<ProductBatchData> & {
    farmer: string;
};

export type UpdateProductBatchData = {
    id: string;
    farmer?: string;
    data: Partial<ProductBatchData>;
};

export type FarmerDetails = {
    id: string;
    name: string;
    email: string;
    role: "FARMER";
    createdAt: Date;
    updatedAt: Date;
};
