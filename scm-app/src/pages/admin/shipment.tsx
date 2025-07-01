import UserLayout from "@/components/layout/UserLayout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import CreateShipmentForm from "@/features/common/shipment/CreateShipmentForm";
import { getShipment } from "@/features/common/shipment/query";
import ShipmentTable from "@/features/common/shipment/ShipmentTable";
import { ShipmentRow } from "@/features/common/shipment/type";
import WithRolePage from "@/lib/auth/with-role-page";
import { queryClient } from "@/lib/react-query";
import { useQuery } from "@tanstack/react-query";
import { Loader } from "lucide-react";
import { useState } from "react";

const AdminShipmentPage = () => {
    const [openCreateDialog, setOpenCreateDialog] = useState(false);

    const {
        data: shipment = [],
        isLoading,
        isError,
    } = useQuery<[ShipmentRow]>({
        queryKey: ["admin", "shipment"],
        queryFn: getShipment,
        retry: false,
    });

    const handleCreated = () => {
        queryClient.invalidateQueries({ queryKey: ["admin", "shipment"] });
        setOpenCreateDialog(false);
    };

    return (
        <WithRolePage allowedRoles={["ADMIN"]}>
            <UserLayout title="Shipment Management">
                <main className="p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-2xl font-bold mb-4">
                            List of Shipment
                        </h1>
                        {/* <Button onClick={() => setOpenCreateDialog(true)}>
                            Add Shipment
                        </Button> */}
                    </div>

                    {openCreateDialog && (
                        <CreateShipmentForm
                            onSuccess={handleCreated}
                            onCancel={() => setOpenCreateDialog(false)}
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
                                Failed to load shipment. Please try again later.
                            </AlertDescription>
                        </Alert>
                    )}

                    {!isLoading && !isError && (
                        <div>
                            {shipment.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <p>No shipment found.</p>
                                    <p>Please create a new shipment.</p>
                                </div>
                            ) : (
                                <ShipmentTable
                                    data={shipment}
                                    onUpdate={() =>
                                        queryClient.invalidateQueries({
                                            queryKey: ["admin", "shipment"],
                                        })
                                    }
                                    queryKey={["admin", "shipment"]}
                                />
                            )}
                        </div>
                    )}
                </main>
            </UserLayout>
        </WithRolePage>
    );
};

export default AdminShipmentPage;
