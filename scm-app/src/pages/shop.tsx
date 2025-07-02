import PublicNav from "@/components/nav/PublicNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { getShopProducts } from "@/features/public/query";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader } from "lucide-react";
import { useState } from "react";

interface ShopProduct {
    id: string;
    quantity: number;
    trackingKey?: string;
    createdAt: string;
    updatedAt: string;
    batch: {
        id: string;
        produceType: string;
        description?: string;
        plantingDate: string;
        harvestDate: string;
        quantity: number;
        farmerId: string;
    };
    user: {
        id: string;
        name: string;
        email: string;
    };
}

export default function shop() {
    const [selected, setSelected] = useState<ShopProduct | null>(null);

    const { data, isLoading, isError } = useQuery<ShopProduct[]>({
        queryKey: ["shop"],
        queryFn: async () => getShopProducts(),
    });

    const closeDialog = () => setSelected(null);

    return (
        <div>
            <PublicNav />
            <main className="container mx-auto p-4">
                <h1 className="text-3xl font-bold mb-4">Shop</h1>
                <p className="mb-4">
                    Browse available product batches from our supply chain
                    management system.
                </p>
                {isLoading && (
                    <div className="flex items-center justify-center h-64">
                        <Loader className="animate-spin h-8 w-8 text-gray-500" />
                    </div>
                )}
                {isError && (
                    <p className="text-center text-red-500">
                        Failed to load products. Please try again later.
                    </p>
                )}

                {data && data.length === 0 && (
                    <p className="text-center text-gray-600">
                        No products available.
                    </p>
                )}

                {data && data.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {data.map((item) => (
                            <Card
                                key={item.id}
                                className="hover:shadow-lg transition-shadow"
                            >
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-lg font-semibold">
                                            {item.batch.produceType}
                                        </h2>
                                        <Badge
                                            variant="outline"
                                            className="uppercase"
                                        >
                                            {item.batch.produceType}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-600 mb-2">
                                        <strong>Description:</strong>{" "}
                                        {item.batch.description || "—"}
                                    </p>
                                    <p className="text-sm text-gray-600 mb-2">
                                        <strong>Available:</strong>{" "}
                                        {item.quantity} pcs
                                    </p>
                                    <p className="text-sm text-gray-600 mb-2">
                                        <strong>Harvested:</strong>{" "}
                                        {format(
                                            new Date(item.batch.harvestDate),
                                            "yyyy-MM-dd"
                                        )}
                                    </p>
                                    <p className="text-sm text-gray-600 mb-4">
                                        <strong>Seller:</strong>{" "}
                                        {item.user.name}
                                    </p>
                                    <Button
                                        className="w-full"
                                        onClick={() => {
                                            setSelected(item);
                                        }}
                                    >
                                        Buy Now
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {selected && (
                    <Dialog open={!!selected} onOpenChange={closeDialog}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Purchase Product</DialogTitle>
                                <DialogDescription>
                                    {selected.batch.produceType} — Qty: {selected.quantity}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="mt-2">
                                <p className="text-sm">
                                    <strong>Tracking Number:</strong>{" "}
                                    {selected.trackingKey || (
                                        <span className="italic text-gray-500">
                                            Not generated yet
                                        </span>
                                    )}
                                </p>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="secondary">Close</Button>
                                </DialogClose>
                                <Button onClick={closeDialog}>Confirm</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </main>
        </div>
    );
}
