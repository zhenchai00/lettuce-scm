import { ComponentType } from "react";
import { Contact, Home, Package, PackageSearch, Settings, Truck, User } from "lucide-react";

export const NAVI_CONFIG: Record<
    string,
    { href: string; label: string; icon: ComponentType<any> }[]
> = {
    ADMIN: [
        { href: "/admin/dashboard", label: "Dashboard", icon: Home },
        { href: "/admin/product-batch", label: "Product Batches", icon: Package },
        { href: "/admin/inventory", label: "Inventory", icon: PackageSearch },
        { href: "/admin/shipment", label: "Shipment", icon: Truck },
        { href: "/admin/users", label: "Users", icon: User },
        { href: "/admin/contact", label: "Customer Contact", icon: Contact },
        { href: "/admin/settings", label: "Settings", icon: Settings },
    ],

    FARMER: [
        { href: "/farmer/dashboard", label: "Dashboard", icon: Home },
        { href: "/farmer/product-batch", label: "My Batches", icon: Package },
        { href: "/farmer/inventory", label: "Inventory", icon: PackageSearch },
        { href: "/farmer/shipment", label: "Shipment", icon: Truck },
        { href: "/farmer/settings", label: "Settings", icon: Settings },
    ],
    DISTRIBUTOR: [
        { href: "/distributor/dashboard", label: "Dashboard", icon: Home },
        { href: "/distributor/inventory", label: "Inventory", icon: PackageSearch },
        { href: "/distributor/shipment", label: "Shipment", icon: Truck },
        { href: "/distributor/settings", label: "Settings", icon: Settings },
    ],
    RETAILER: [
        { href: "/retailer/dashboard", label: "Dashboard", icon: Home },
        { href: "/retailer/inventory", label: "Inventory", icon: PackageSearch },
        { href: "/retailer/shipment", label: "Shipment", icon: Truck },
        { href: "/retailer/settings", label: "Settings", icon: Settings },
    ],
};