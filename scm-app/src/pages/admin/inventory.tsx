import UserLayout from "@/components/layout/UserLayout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import InventoryTable from "@/features/common/inventory/InventoryTable";
import { getInventory } from "@/features/common/inventory/query";
import { InventoryRow } from "@/features/common/inventory/type";
import WithRolePage from "@/lib/auth/with-role-page";
import { queryClient } from "@/lib/react-query";
import { useQuery } from "@tanstack/react-query";
import { Loader } from "lucide-react";
import { useState } from "react";

const AdminInventoryPage = () => {
    const [openCreateDialog, setOpenCreateDialog] = useState(false);

    const {
        data: inventory = [],
        isLoading,
        isError,
    } = useQuery<InventoryRow[]>({
        queryKey: ["admin", "inventory"],
        queryFn: getInventory,
        retry: false,
    });

    const handleCreated = () => {
        queryClient.invalidateQueries({ queryKey: ["admin", "inventory"] });
        setOpenCreateDialog(false);
    };

    return (
        <WithRolePage allowedRoles={["ADMIN"]}>
            <UserLayout title="Inventory Management">
                <main className="p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-2xl font-bold mb-4">
                            List of Inventory Item
                        </h1>
                        {/* <Button onClick={() => setOpenCreateDialog(true)}>
                            Add Inventory
                        </Button> */}
                    </div>

                    {/* {openCreateDialog && (
                        <CreateInventoryForm
                            onSuccess={handleCreated}
                            onCancel={() => setOpenCreateDialog(false)}
                        />
                    )} */}

                    {isLoading && (
                        <div className="flex items-center justify-center h-64">
                            <Loader className="animate-spin h-8 w-8 text-gray-500" />
                        </div>
                    )}

                    {isError && (
                        <Alert variant="destructive">
                            <AlertDescription>
                                Failed to load inventory. Please try again later.
                            </AlertDescription>
                        </Alert>
                    )}

                    {!isLoading && !isError && (
                        <div>
                            {inventory.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <p>No inventory found.</p>
                                    <p>Please create a new inventory.</p>
                                </div>
                            ) : (
                                <InventoryTable
                                    data={inventory}
                                    onUpdate={() =>
                                        queryClient.invalidateQueries({
                                            queryKey: ["admin", "inventory"],
                                        })
                                    }
                                />
                            )}
                        </div>
                    )}
                </main>
            </UserLayout>
        </WithRolePage>
    );
};

export default AdminInventoryPage;
