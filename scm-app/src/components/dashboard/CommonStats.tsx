import { FC } from "react";

interface CommonStatsProps {
    title: string;
    value: string | number;
}

export const CommonStats: FC<CommonStatsProps> = ({ title, value }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col">
        <span className="text-sm text-gray-500">{title}</span>
        <span className="text-2xl font-semibold">{value}</span>
    </div>
);


