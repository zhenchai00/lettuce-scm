import UserLayout from "@/components/layout/UserLayout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ContactTable from "@/features/contact/ContactTable";
import { getContacts } from "@/features/contact/query";
import WithRolePage from "@/lib/auth/with-role-page";
import { useQuery } from "@tanstack/react-query";
import { Loader } from "lucide-react";

const AdminContactPage = () => {
    const {
        data: contacts = [],
        isLoading,
        isError,
    } = useQuery({
        queryKey: ["admin", "contacts"],
        queryFn: getContacts,
        retry: false,
    });

    return (
        <WithRolePage allowedRoles={["ADMIN"]}>
            <UserLayout title="Customer Contact Management">
                <main className="p-4">
                    {isLoading && (
                        <div className="flex items-center justify-center h-64">
                            <Loader className="animate-spin h-8 w-8 text-gray-500" />
                        </div>
                    )}

                    {isError && (
                        <Alert variant="destructive">
                            <AlertDescription>
                                Failed to load contacts. Please try again later.
                            </AlertDescription>
                        </Alert>
                    )}
                    {!isLoading && !isError && (
                        <div>
                            {contacts.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <p>No contacts found.</p>
                                </div>
                            ) : (
                                <ContactTable data={contacts} />
                            )}
                        </div>
                    )}
                </main>
            </UserLayout>
        </WithRolePage>
    );
};

export default AdminContactPage;
