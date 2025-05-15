import { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/nav/AppSidebar";
import SidebarHeader from "@/components/nav/HeaderSidebar";

interface DashboardLayoutProps {
    children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
    return (
        <SidebarProvider defaultOpen={true}>
            <AppSidebar />
            <div className=" min-h-screen flex-1 transition-margin duration-200" id="dashboard-layout">
                <SidebarHeader />
                <div className="flex-1 p-4">
                    {children}
                </div>
            </div>
        </SidebarProvider>
    );
};

export default DashboardLayout;
