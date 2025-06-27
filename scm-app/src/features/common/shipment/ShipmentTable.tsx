import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { FC, useState } from "react";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/react-query";
import { ClipboardCopy } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from "@/components/ui/tooltip";
import { ShipmentRow } from "./type";
import { Badge } from "@/components/ui/badge";
import UpdateShipmentForm from "./UpdateShipmentForm";
import { updateShipment } from "./query";
import UpdateShipmentStatusButton from "@/components/common/UpdateShipmentStatusButton";
import { useSession } from "next-auth/react";

interface ShipmentTableProps {
    data: ShipmentRow[];
    onUpdate: () => void;
    queryKey: string[];
}

const ShipmentTable: FC<ShipmentTableProps> = ({ data, onUpdate, queryKey }) => {
    const { data: session } = useSession();
    const UserRole = session?.user?.role || "FARMER";
    const userId = session?.user?.id || "";
    const [updatingStatusId, setUpdatingStatusId] = useState<ShipmentRow | null>(null);

    const updateDeliveredStatusMutation = useMutation({
        mutationFn: (shipment: ShipmentRow) => {
            let updateStatus;
            if (shipment.status === "OUTOFDELIVERY") {
                updateStatus = "DELIVERED";
            }
            return updateShipment(shipment.id || "", {
                status: updateStatus,
            });
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey });
            toast.success("Shipment status updated successfully - " + data.trackingKey);
            onUpdate();
        },
        onError: (e: any) => {
            toast.error(`Failed to update shipment status: ${e.message}`);
        },
    });

    return (
        <div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>From User</TableHead>
                        <TableHead>To User</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Status</TableHead>
                        {UserRole === "RETAILER" && (
                            <TableHead className="text-center">Tracking Key</TableHead>
                        )}
                        <TableHead>Out of Delivery</TableHead>
                        <TableHead>Shipped Date</TableHead>
                        <TableHead>Created On</TableHead>
                        <TableHead>Updated On</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((shipment) => (
                        <TableRow key={shipment.id}>
                            <TableCell>{shipment.id}</TableCell>
                            <TableCell className="text-center">{shipment.fromUser?.name} - {shipment.fromUser?.role}</TableCell>
                            <TableCell className="text-center">{shipment.toUser?.name} - {shipment.toUser?.role}</TableCell>
                            <TableCell className="text-center">{shipment.quantity}</TableCell>
                            <TableCell className="justify-center">
                                {(() => {
                                    switch (shipment.status) {
                                        case "ORDERED":
                                            return <Badge variant="outline">{shipment.status}</Badge>;
                                        case "OUTOFDELIVERY":
                                            return <Badge variant="secondary" className="bg-blue-500 text-white">{shipment.status}</Badge>;
                                        case "DELIVERED":
                                            return <Badge variant="secondary" className="bg-green-500 text-white">{shipment.status}</Badge>;
                                        case "CANCELLED":
                                            return <Badge variant="destructive">{shipment.status}</Badge>;
                                        default:
                                            return shipment.status;
                                    }
                                })()}
                            </TableCell>
                            {UserRole === "RETAILER" && (
                                <TableCell className="text-wrap w-24 text-center">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(
                                                        shipment.trackingKey || ""
                                                    );
                                                    shipment.trackingKey && toast.success("Tracking Key copied to clipboard");
                                                }}
                                            >
                                                {shipment.trackingKey ? "Copy" : "N/A"}
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            {shipment.trackingKey ? (
                                                <span className="text-sm">
                                                    Click to copy tracking key - <strong>{shipment.trackingKey}</strong>
                                                </span>
                                            ) : (
                                                <span className="text-sm">No tracking key available</span>
                                            )}
                                        </TooltipContent>
                                    </Tooltip>
                                </TableCell>
                            )}
                            <TableCell>
                                {shipment.shippedDate
                                    ? format(
                                        new Date(shipment.shippedDate),
                                        "yyyy-MM-dd HH:mm:ss"
                                    )
                                    : "N/A"}
                            </TableCell>
                            <TableCell>
                                {shipment.deliveryDate
                                    ? format(
                                        new Date(shipment.deliveryDate),
                                        "yyyy-MM-dd HH:mm:ss"
                                    )
                                    : "N/A"}
                            </TableCell>
                            <TableCell>
                                {shipment.createdAt
                                    ? format(
                                        new Date(shipment.createdAt),
                                        "yyyy-MM-dd HH:mm:ss"
                                    )
                                    : "N/A"}
                            </TableCell>
                            <TableCell>
                                {shipment.updatedAt
                                    ? format(
                                        new Date(shipment.updatedAt),
                                        "yyyy-MM-dd HH:mm:ss"
                                    )
                                    : "N/A"}
                            </TableCell>
                            <TableCell className="flex items-center gap-2">
                                {(shipment.status === "ORDERED" && (shipment.fromUser?.id === userId || UserRole === "ADMIN")) && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                size="icon"
                                                onClick={() =>
                                                    setUpdatingStatusId(shipment)
                                                }
                                                className="bg-blue-500 hover:bg-blue-600 text-white"
                                            >
                                                <ClipboardCopy className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Update Status</TooltipContent>
                                    </Tooltip>
                                )}
                                {(shipment.status == "OUTOFDELIVERY" && ((shipment.toUser?.id === userId && shipment.fromUser?.id !== userId) || UserRole === "ADMIN")) && (
                                    <UpdateShipmentStatusButton
                                        updateMutation={() =>
                                            updateDeliveredStatusMutation.mutate(
                                                shipment
                                            )
                                        }
                                        isPending={
                                            updateDeliveredStatusMutation.status === "pending"
                                        }
                                        description="This action will update the shipment status."
                                        status={"DELIVERED"}
                                        tooltip="Update Shipment Status to Delivered"
                                    />
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            {updatingStatusId && (
                <UpdateShipmentForm
                    shipment={updatingStatusId}
                    onSuccess={() => {
                        setUpdatingStatusId(null);
                        onUpdate();
                    }}
                    onCancel={() => setUpdatingStatusId(null)}
                />
            )}
        </div>
    );
};

export default ShipmentTable;
