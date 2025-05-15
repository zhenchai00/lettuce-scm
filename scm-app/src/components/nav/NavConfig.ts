import { ComponentType } from "react";
import { Home, Package, Settings, User } from "lucide-react";

export const NAVI_CONFIG: Record<
    string,
    { href: string; label: string; icon: ComponentType<any> }[]
> = {
    admin: [
        { href: "/admin/dashboard", label: "Dashboard", icon: Home },
        { href: "/admin/users", label: "Users", icon: User },
        { href: "/admin/settings", label: "Settings", icon: Settings },
    ],

    farmer: [
        { href: "/farmer/dashboard", label: "Dashboard", icon: Home },
        { href: "/farmer/batches", label: "My Batches", icon: Package },
        { href: "/farmer/settings", label: "Settings", icon: Settings },
    ],
    distributor: [
        { href: "/distributor/dashboard", label: "Dashboard", icon: Home },
        { href: "/distributor/batches", label: "Shipments", icon: Package },
        { href: "/distributor/settings", label: "Settings", icon: Settings },
    ],
    retailer: [
        { href: "/retailer/dashboard", label: "Dashboard", icon: Home },
        { href: "/retailer/batches", label: "Orders", icon: Package },
        { href: "/retailer/settings", label: "Settings", icon: Settings },
    ],
};