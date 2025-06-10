import Head from "next/head";
import WithRole from "@/lib/auth/with-role";
import UserLayout from "@/components/layout/UserLayout";
import FarmerDashboardContent from "@/components/dashboard/FarmerDashboardContent";

const FarmerDashboard = () => {
    const title = "Farmer Dashboard";

    return (
        <WithRole allowedRoles={["farmer"]}>
            <UserLayout title={title}>
                <div>
                    <Head>
                        <title>{title}</title>
                    </Head>
                    <h1 className="text-2xl font-bold mb-4">Farmer Dashboard</h1>
                </div>
                <FarmerDashboardContent />
            </UserLayout>
        </WithRole>
    );
};

export default FarmerDashboard;
