import { FC, useState } from "react";
import { CommonStats } from "@/components/dashboard/CommonStats";

const RetailerDashboardContent:FC = () => {
    return (
        <div className="grid grid-cols-2 gap-4">
            <CommonStats title="Total Shipment (Pending)" value="120" />
            <CommonStats title="Total Shipment (Received)" value="738" />
            <CommonStats title="Total Inventory" value="350" />
            <CommonStats title="Total Products" value="500" />
        </div>
    )
}

export default RetailerDashboardContent;