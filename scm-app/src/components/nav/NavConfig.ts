import { ComponentType } from "react";
import { Contact, Home, Package, PackageSearch, Settings, User } from "lucide-react";

export const NAVI_CONFIG: Record<
    string,
    { href: string; label: string; icon: ComponentType<any> }[]
> = {
    ADMIN: [
        { href: "/admin/dashboard", label: "Dashboard", icon: Home },
        { href: "/farmer/product-batch", label: "Product Batches", icon: Package },
        { href: "/admin/users", label: "Users", icon: User },
        { href: "/admin/contact", label: "Customer Contact", icon: Contact },
        { href: "/admin/settings", label: "Settings", icon: Settings },
    ],

    FARMER: [
        { href: "/farmer/dashboard", label: "Dashboard", icon: Home },
        { href: "/farmer/product-batch", label: "My Batches", icon: Package },
        { href: "/farmer/inventory", label: "Inventory", icon: PackageSearch },
        { href: "/farmer/settings", label: "Settings", icon: Settings },
    ],
    DISTRIBUTOR: [
        { href: "/distributor/dashboard", label: "Dashboard", icon: Home },
        { href: "/distributor/batches", label: "Shipments", icon: Package },
        { href: "/distributor/settings", label: "Settings", icon: Settings },
    ],
    RETAILER: [
        { href: "/retailer/dashboard", label: "Dashboard", icon: Home },
        { href: "/retailer/batches", label: "Orders", icon: Package },
        { href: "/retailer/settings", label: "Settings", icon: Settings },
    ],
};