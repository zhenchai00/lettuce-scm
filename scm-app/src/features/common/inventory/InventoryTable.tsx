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
import { PenSquareIcon } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from "@/components/ui/tooltip";
import { InventoryRow } from "./type";
import EditInventoryForm from "./EditInventoryForm";
import { queryClient } from "@/lib/react-query";
import DeleteButton from "@/components/common/DeleteButton";
import { useMutation } from "@tanstack/react-query";
import { deleteInventory } from "./query";

interface InventoryTableProps {
    data: InventoryRow[];
    onUpdate: () => void;
}

const InventoryTable: FC<InventoryTableProps> = ({ data, onUpdate }) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    
    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteInventory(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "inventory"] });
            toast.success("Inventory item deleted successfully.");
            onUpdate();
        },
        onError: (e: any) => {
            toast.error(`Failed to delete inventory item: ${e.message}`);
        },
    });

    return (
        <div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Produce Type</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Owned By</TableHead>
                        <TableHead>Created On</TableHead>
                        <TableHead>Updated On</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((inventory) => (
                        <TableRow key={inventory.id}>
                            <TableCell>{inventory.id}</TableCell>
                            <TableCell>{inventory.batch?.produceType} - {inventory.batch?.id}</TableCell>
                            <TableCell>
                                {inventory.quantity ?? "N/A"}
                            </TableCell>
                            <TableCell>{inventory.user?.name}</TableCell>
                            <TableCell>
                                {inventory.createdAt
                                    ? format(
                                        new Date(inventory.createdAt),
                                        "yyyy-MM-dd HH:mm:ss"
                                    )
                                    : "N/A"}
                            </TableCell>
                            <TableCell>
                                {inventory.updatedAt
                                    ? format(
                                        new Date(inventory.updatedAt),
                                        "yyyy-MM-dd HH:mm:ss"
                                    )
                                    : "N/A"}
                            </TableCell>
                            <TableCell className="flex items-center gap-2">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            size="icon"
                                            onClick={() =>
                                                setEditingId(inventory.id ?? null)
                                            }
                                        >
                                            <PenSquareIcon className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Edit Item</TooltipContent>
                                </Tooltip>
                                <DeleteButton
                                    deleteMutation={() => {
                                        if (inventory.id) {
                                            deleteMutation.mutate(inventory.id);
                                        } else {
                                            toast.error("Inventory ID is missing.");
                                        }
                                    }}
                                    isPending={
                                        deleteMutation.status === "pending"
                                    }
                                    description="This action cannot be undone. This will permanently delete the inventory and all associated data."
                                />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            {editingId && (
                <EditInventoryForm
                    inventoryId={editingId}
                    onSuccess={() => {
                        setEditingId(null);
                        queryClient.invalidateQueries({ queryKey: ["admin", "inventory"] });
                    }}
                    onCancel={() => setEditingId(null)}
                    onUpdate={onUpdate}
                />
            )}
        </div>
    );
};

export default InventoryTable;
