import UserLayout from "@/components/layout/UserLayout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import CreateProductBatchForm from "@/features/farmer/product-batch/CreateProductBatchForm";
import ProductBatchTable from "@/features/farmer/product-batch/ProductBatchTable";
import { getProductBatches } from "@/features/farmer/product-batch/query";
import { ProductBatchRow } from "@/features/farmer/product-batch/type";
import WithRolePage from "@/lib/auth/with-role-page";
import { queryClient } from "@/lib/react-query";
import { useQuery } from "@tanstack/react-query";
import { Loader } from "lucide-react";
import { useMemo, useState } from "react";

const AdminProductBatchPage = () => {
    const BATCH_KEY = ["admin", "product-batches"];
    const [openCreateProductBatchDialog, setOpenCreateProductBatchDialog] =
        useState(false);

    const {
        data: productBatches = [],
        isLoading,
        isError,
    } = useQuery<ProductBatchRow[]>({
        queryKey: BATCH_KEY,
        queryFn: getProductBatches,
    });

    const handleCreated = () => {
        queryClient.invalidateQueries({
            queryKey: BATCH_KEY,
        });
        setOpenCreateProductBatchDialog(false);
    };
    const allowedRoles = useMemo(() => ["ADMIN"], []);
    return (
        <WithRolePage allowedRoles={allowedRoles}>
            <UserLayout title="Product Batch Management">
                <main className="p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-2xl font-bold mb-4">
                            List of Product Batch
                        </h1>
                        <Button
                            onClick={() =>
                                setOpenCreateProductBatchDialog(true)
                            }
                        >
                            Add Product Batch
                        </Button>
                    </div>

                    {openCreateProductBatchDialog && (
                        <CreateProductBatchForm
                            onSuccess={handleCreated}
                            onCancel={() =>
                                setOpenCreateProductBatchDialog(false)
                            }
                            queryKey={BATCH_KEY}
                        />
                    )}

                    {isLoading && (
                        <div className="flex items-center justify-center h-64">
                            <Loader className="animate-spin h-8 w-8 text-gray-500" />
                        </div>
                    )}

                    {isError && (
                        <Alert variant="destructive">
                            <AlertDescription>
                                Failed to load product batches. Please try again later.
                            </AlertDescription>
                        </Alert>
                    )}

                    {!isLoading && !isError && (
                        <div>
                            {productBatches.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <p>No product batches found.</p>
                                    <p>Please create a new product batch.</p>
                                </div>
                            ) : (
                                <ProductBatchTable
                                    data={productBatches}
                                    onUpdate={() =>
                                        queryClient.invalidateQueries({
                                            queryKey: BATCH_KEY,
                                        })
                                    }
                                    queryKey={BATCH_KEY}
                                />
                            )}
                        </div>
                    )}
                </main>
            </UserLayout>
        </WithRolePage>
    );
};
export default AdminProductBatchPage;
