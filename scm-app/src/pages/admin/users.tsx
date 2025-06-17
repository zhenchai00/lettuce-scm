import UserLayout from "@/components/layout/UserLayout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import CreateUserForm from "@/features/admin/users/CreateUserForm";
import { getUsers } from "@/features/admin/users/query";
import { UserRow } from "@/features/admin/users/type";
import UserTable from "@/features/admin/users/UserTable";
import WithRolePage from "@/lib/auth/with-role-page";
import { queryClient } from "@/lib/react-query";
import { useQuery } from "@tanstack/react-query";
import { Loader } from "lucide-react";
import { useState } from "react";

const UsersPage = () => {
    const [openCreateUserDialog, setOpenCreateUserDialog] = useState(false);

    const {
        data: users = [],
        isLoading,
        isError,
    } = useQuery<UserRow[]>({
        queryKey: ["admin", "users"],
        queryFn: getUsers,
        retry: false,
    });

    const handleCreated = () => {
        queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
        setOpenCreateUserDialog(false);
    };

    return (
        <WithRolePage allowedRoles={["ADMIN"]}>
            <UserLayout title="User Management">
                <main className="p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-2xl font-bold mb-4">
                            List of Users
                        </h1>
                        <Button onClick={() => setOpenCreateUserDialog(true)}>
                            Add User
                        </Button>
                    </div>

                    {openCreateUserDialog && (
                        <CreateUserForm
                            onSuccess={handleCreated}
                            onCancel={() => setOpenCreateUserDialog(false)}
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
                                Failed to load users. Please try again later.
                            </AlertDescription>
                        </Alert>
                    )}

                    {!isLoading && !isError && (
                        <div>
                            {users.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <p>No users found.</p>
                                    <p>Please create a new user.</p>
                                </div>
                            ) : (
                                <UserTable
                                    data={users}
                                    onUpdate={() =>
                                        queryClient.invalidateQueries({
                                            queryKey: ["users"],
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

export default UsersPage;
