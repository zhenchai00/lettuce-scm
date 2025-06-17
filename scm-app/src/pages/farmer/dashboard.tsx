import Head from "next/head";
import UserLayout from "@/components/layout/UserLayout";
import FarmerDashboardContent from "@/components/dashboard/FarmerDashboardContent";
import WithRolePage from "@/lib/auth/with-role-page";

const FarmerDashboard = () => {
    const title = "Farmer Dashboard";

    return (
        <WithRolePage allowedRoles={["FARMER"]}>
            <UserLayout title={title}>
                <div>
                    <Head>
                        <title>{title}</title>
                    </Head>
                    <h1 className="text-2xl font-bold mb-4">Farmer Dashboard</h1>
                </div>
                <FarmerDashboardContent />
            </UserLayout>
        </WithRolePage>
    );
};

export default FarmerDashboard;
