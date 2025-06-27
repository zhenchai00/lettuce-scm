import { UserRow } from "@/features/admin/users/type";
import { ProductBatchRow } from "@/features/farmer/product-batch/type";

export type Shipment = {
    id: string;
    status: "ORDERED" | "OUTOFDELIVERY" | "DELIVERED" | "CANCELLED";
    quantity: number;
    trackingKey?: string;
    shippedDate?: Date;
    deliveryDate?: Date;
    batch?: ProductBatchRow;
    fromUser?: UserRow;
    toUser?: UserRow;
    createdAt: Date;
    updatedAt: Date;
};

export type ShipmentRow = Partial<Shipment>;