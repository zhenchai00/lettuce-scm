
export type ProductBatchData = {
    produceType: "BUTTERHEAD" | "LOOSELEAF" | "OAKLEAF" | "ROMAINE" | "SPINACH";
    description: string;
    plantingDate: Date;
    harvestDate: Date;
    quantity: number;
    blockchainTx?: string;
};

export type ProductBatchRow = {
    id: string;
    produceType: "BUTTERHEAD" | "LOOSELEAF" | "OAKLEAF" | "ROMAINE" | "SPINACH";
    description: string;
    plantingDate: Date;
    harvestDate: Date;
    quantity: number;
    blockchainTx?: string;
    createdAt: Date;
    updatedAt: Date;
}

export type CreateProductBatchData = Partial<ProductBatchData> & {
    farmer: string;
};

export type UpdateProductBatchData = {
    id: string;
    farmer?: string;
    data: Partial<ProductBatchData>;
};