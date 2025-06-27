import { UserRow } from "@/features/admin/users/type";
import { ProductBatchRow } from "@/features/farmer/product-batch/type";

export type Inventory = {
    id: string;
    userId: string;
    productBatchId: string;
    quantity: number;
    createdAt: Date;
    updatedAt: Date;
    user: UserRow;
    batch: ProductBatchRow;
};

export type InventoryRow = Partial<Inventory>;
