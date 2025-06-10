import Head from "next/head";
import WithRole from "@/lib/auth/with-role";
import UserLayout from "@/components/layout/UserLayout";
import AdminDashboardContent from "@/components/dashboard/AdminDashboardContent";

const AdminDashboard = () => {
    const title = "Admin Dashboard";

    return (
        <WithRole allowedRoles={["admin"]}>
            <UserLayout title={title}>
                <div>
                    <Head>
                        <title>{title}</title>
                    </Head>
                    <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
                </div>
                <AdminDashboardContent />
            </UserLayout>
        </WithRole>
    );
};

export default AdminDashboard;
