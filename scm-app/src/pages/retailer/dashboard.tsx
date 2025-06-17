import Head from "next/head";
import WithRolePage from "@/lib/auth/with-role-page";
import UserLayout from "@/components/layout/UserLayout";
import RetailerDashboardContent from "@/components/dashboard/RetailerDashboardContent";

const RetailerDashboard = () => {
    const title = "Retailer Dashboard";

    return (
        <WithRolePage allowedRoles={["RETAILER"]}>
            <UserLayout title={title}>
                <div>
                    <Head>
                        <title>{title}</title>
                    </Head>
                    <h1 className="text-2xl font-bold mb-4">Retailer Dashboard</h1>
                </div>
                <RetailerDashboardContent />
            </UserLayout>
        </WithRolePage>
    );
};

export default RetailerDashboard;
