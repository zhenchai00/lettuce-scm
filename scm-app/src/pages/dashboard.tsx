"use client";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

const AdminDashboard = dynamic(() => import("@/components/dashboard/AdminDashboard"));
const FarmerDashboard = dynamic(() => import("@/components/dashboard/FarmerDashboard"));
const DistributorDashboard = dynamic(() => import("@/components/dashboard/DistributorDashboard"));
const RetailerDashboard = dynamic(() => import("@/components/dashboard/RetailerDashboard"));

const Dashboard = () => {
    const {data: session, status} = useSession();
    const router = useRouter();

    if (status === "loading") {
        return <div>Loading...</div>;
    }
    if (!session) {
        void router.replace("/auth/login");
        return null;
    }

    const userRole = session.user.role as string;
    let content;
    switch (userRole) {
        case "admin":
            content =  <AdminDashboard />;
            break;
        case "farmer":
            content =  <FarmerDashboard />;
            break;
        case "distributor":
            content =  <DistributorDashboard />;
            break;
        case "retailer":
            content =  <RetailerDashboard />;
            break;
        default:
            content =  <div>Unauthorized</div>;
            break;
    }
    return (
        <DashboardLayout>
            {content}
        </DashboardLayout>
    );
}

export default Dashboard;