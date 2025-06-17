import UserLayout from "@/components/layout/UserLayout";
import PublicNav from "@/components/nav/PublicNav";
import WithRolePage from "@/lib/auth/with-role-page";
import { useSession } from "next-auth/react";

const ForbiddenPage = () => {
    const { data: session } = useSession();
    let loginButton = session ? true : false;
    return (
        <div>
            {session?.user?.name ? (
                <WithRolePage
                    allowedRoles={[
                        "ADMIN",
                        "FARMER",
                        "DISTRIBUTOR",
                        "RETAILER",
                    ]}
                >
                    <UserLayout title="Forbidden">
                        <main className="container mx-auto px-4 py-8">
                            <p className="text-4xl font-bold">
                                403 - Forbidden
                            </p>
                            <p>
                                You do not have permission to access this page.
                            </p>
                        </main>
                    </UserLayout>
                </WithRolePage>
            ) : (
                <div>
                    <PublicNav visibleLogin={loginButton} />
                    <main className="container mx-auto px-4 py-8">
                        <p className="text-4xl font-bold">403 - Forbidden</p>
                        <p>You do not have permission to access this page.</p>
                    </main>
                </div>
            )}
        </div>
    );
};

export default ForbiddenPage;
