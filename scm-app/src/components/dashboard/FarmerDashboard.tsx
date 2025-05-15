import { FC, useState } from "react";
import { CommonStats } from "@/components/dashboard/CommonStats";

const FarmerDashboard:FC = () => {
    return (
        <div className="grid grid-cols-2 gap-4">
            <CommonStats title="Total Users (Farmer)" value="1000" />
            <CommonStats title="Total Products" value="500" />
        </div>
    )
}

export default FarmerDashboard;