import Head from "next/head";
import WithRole from "@/lib/auth/with-role";
import UserLayout from "@/components/layout/UserLayout";
import DistributorDashboardContent from "@/components/dashboard/DistributorDashboardContent";

const DistributorDashboard = () => {
    const title = "Distributor Dashboard";

    return (
        <WithRole allowedRoles={["DISTRIBUTOR"]}>
            <UserLayout title={title}>
                <div>
                    <Head>
                        <title>{title}</title>
                    </Head>
                    <h1 className="text-2xl font-bold mb-4">Distributor Dashboard</h1>
                </div>
                <DistributorDashboardContent />
            </UserLayout>
        </WithRole>
    );
};

export default DistributorDashboard;
