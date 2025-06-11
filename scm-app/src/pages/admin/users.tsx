import UserLayout from "@/components/layout/UserLayout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import CreateUserForm from "@/features/admin/users/CreateUserForm";
import { getUsers } from "@/features/admin/users/query";
import { UserRow } from "@/features/admin/users/type";
import UserTable from "@/features/admin/users/UserTable";
import WithRole from "@/lib/auth/with-role";
import { queryClient } from "@/lib/react-query";
import { useQuery } from "@tanstack/react-query";
import { Loader } from "lucide-react";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { useState } from "react";

const UsersPage = () => {
    const [openCreateUserDialog, setOpenCreateUserDialog] = useState(false);

    const {data: users = [], isLoading, isError} = useQuery<UserRow[]>({
        queryKey: ["admin", "users"],
        queryFn: getUsers,
    })

    const handleCreated = () => {
        queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
        setOpenCreateUserDialog(false);
    }

    return (
        <WithRole allowedRoles={["ADMIN"]}>
            <UserLayout title="User Management">
                <Head>
                    <title>Users Management</title>
                </Head>
                <main className="p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-2xl font-bold mb-4">User Management</h1>
                        <Button onClick={() => setOpenCreateUserDialog(true)}>Add User</Button>
                    </div>

                    {openCreateUserDialog && (
                        <CreateUserForm onSuccess={handleCreated} onCancel={() => setOpenCreateUserDialog(false)} />
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
                        <UserTable data={users} onUpdate={() => queryClient.invalidateQueries({ queryKey: ["users"] })} />
                    )}
                </main>
            </UserLayout>
        </WithRole>
    );
};

export default UsersPage;
