import { FC, useState } from "react";
import { CommonStats } from "@/components/dashboard/CommonStats";

const AdminDashboardContent: FC = () => {
    return (
        <div className="grid grid-cols-2 gap-4">
            <CommonStats title="Total Users" value="100" />
            <CommonStats title="Total Products" value="200" />
            <CommonStats title="Total Shipment" value="530" />
            <CommonStats title="Total Inventory" value="703" />
            <CommonStats title="Total Contacts" value="54" />
        </div>
    );
};

export default AdminDashboardContent;
