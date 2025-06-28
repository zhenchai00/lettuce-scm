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
import { queryClient } from "@/lib/react-query";
import { PenSquareIcon } from "lucide-react";
import { ProductBatchRow } from "./type";
import EditProductBatchForm from "./EditProductBatchForm";
import { format } from "date-fns";
import DeleteButton from "@/components/common/DeleteButton";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { deleteProductBatch } from "./query";
import WithRoleComponent from "@/lib/auth/with-role-component";
import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface ProductBatchTableProps {
    data: ProductBatchRow[];
    onUpdate: () => void;
    queryKey: string[];
}

const ProductBatchTable: FC<ProductBatchTableProps> = ({ data, onUpdate, queryKey }) => {
    const [editingId, setEditingId] = useState<string | null>(null);

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteProductBatch(id),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey,
            });
            toast.success("Product batch deleted successfully.");
        },
        onError: (e: any) => {
            toast.error(`Failed to delete product batch: ${e.message}`);
        },
    });

    return (
        <div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>UUID</TableHead>
                        <TableHead>Produce Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Planting Date</TableHead>
                        <TableHead>Harvest Date</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Blockchain TX</TableHead>
                        <TableHead>Farmer Name</TableHead>
                        <TableHead>Created On</TableHead>
                        <TableHead>Updated On</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((productBatch) => (
                        <TableRow key={productBatch.id}>
                            <TableCell>{productBatch.id}</TableCell>
                            <TableCell>{productBatch.produceType}</TableCell>
                            <TableCell>{productBatch.description}</TableCell>
                            <TableCell className="text-center">
                                {
                                    productBatch.plantingDate ? (
                                        productBatch.harvestDate ? (
                                            <span>
                                                {format(new Date(productBatch.plantingDate), "yyyy-MM-dd")}
                                            </span>
                                        ) : (
                                        <Badge className="bg-yellow-500 text-white">
                                            {format(new Date(productBatch.plantingDate), "yyyy-MM-dd")}
                                        </Badge>
                                        )
                                    ) : (
                                        "N/A"
                                    )
                                }
                            </TableCell>
                            <TableCell className="text-center">
                                {productBatch.harvestDate ? (
                                    <Badge className="bg-green-500 text-white">
                                        {format(new Date(productBatch.harvestDate), "yyyy-MM-dd")}
                                    </Badge>
                                ) : (
                                    "N/A"
                                )}
                            </TableCell>
                            <TableCell className="text-center">
                                {productBatch.quantity
                                    ? productBatch.quantity
                                    : "N/A"}
                            </TableCell>
                            <TableCell className="text-center">
                                {productBatch.blockchainTx
                                    ? productBatch.blockchainTx
                                    : "N/A"}
                            </TableCell>
                            <TableCell>{productBatch.farmer?.name}</TableCell>
                            <TableCell>
                                {format(
                                    new Date(productBatch.createdAt),
                                    "yyyy-MM-dd HH:mm:ss"
                                )}
                            </TableCell>
                            <TableCell>
                                {format(
                                    new Date(productBatch.updatedAt),
                                    "yyyy-MM-dd HH:mm:ss"
                                )}
                            </TableCell>
                            <TableCell className="flex items-center gap-2">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            size="icon"
                                            onClick={() =>
                                                setEditingId(productBatch.id)
                                            }
                                        >
                                            <PenSquareIcon className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Edit Item</TooltipContent>
                                </Tooltip>
                                <WithRoleComponent allowedRoles={["ADMIN"]}>
                                    <DeleteButton
                                        deleteMutation={() => {
                                            deleteMutation.mutate(
                                                productBatch.id
                                            );
                                        }}
                                        isPending={
                                            deleteMutation.status === "pending"
                                        }
                                        description="This action cannot be undone. This will delete permanently the product batch and all associated data."
                                    />
                                </WithRoleComponent>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            {editingId && (
                <EditProductBatchForm
                    batchId={editingId}
                    onSuccess={() => {
                        setEditingId(null);
                        queryClient.invalidateQueries({
                            queryKey,
                        });
                    }}
                    onCancel={() => setEditingId(null)}
                />
            )}
        </div>
    );
};

export default ProductBatchTable;
