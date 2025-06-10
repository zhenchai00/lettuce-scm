import Head from "next/head";
import WithRole from "@/lib/auth/with-role";
import UserLayout from "@/components/layout/UserLayout";
import RetailerDashboardContent from "@/components/dashboard/RetailerDashboardContent";

const RetailerDashboard = () => {
    const title = "Retailer Dashboard";

    return (
        <WithRole allowedRoles={["retailer"]}>
            <UserLayout title={title}>
                <div>
                    <Head>
                        <title>{title}</title>
                    </Head>
                    <h1 className="text-2xl font-bold mb-4">Retailer Dashboard</h1>
                </div>
                <RetailerDashboardContent />
            </UserLayout>
        </WithRole>
    );
};

export default RetailerDashboard;
