import { FC, useState } from "react";
import { CommonStats } from "@/components/dashboard/CommonStats";

const AdminDashboardContent: FC = () => {
    return (
        <div className="grid grid-cols-2 gap-4">
            <CommonStats title="Total Users (Admin)" value="1000" />
            <CommonStats title="Total Products" value="500" />
        </div>
    );
};

export default AdminDashboardContent;
