import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { FC, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { queryClient } from "@/lib/react-query";
import { createShipment, getInventories, getInventoryByRole, getUsersByRole } from "./query";
import { useSession } from "next-auth/react";
import { UserRow } from "@/features/admin/users/type";
import { InventoryRow } from "../inventory/type";

const ShipmentSchema = z.object({
    productBatch: z.string().refine((val) => val !== "", {
        message: "Product batch is required",
    }),
    toUser: z.string().refine((val) => val !== "", {
        message: "Requested user is required",
    }),
    fromUser: z.string().optional(),
    quantity: z.number().gte(1, {
        message: "Quantity must be at least 1",
    }),
});

type ShipmentForm = z.infer<typeof ShipmentSchema>;

interface CreateShipmentFormProps {
    onSuccess: () => void;
    onCancel: () => void;
}

const CreateShipmentForm: FC<CreateShipmentFormProps> = ({ onSuccess, onCancel }) => {
    const { data: session } = useSession();
    const userId =  session?.user?.id || "";
    const userRole = session?.user?.role || "";
    

    const ownedRole = useMemo<"FARMER" | "DISTRIBUTOR" | null>(() => {
        if (userRole === "DISTRIBUTOR") {
            return "FARMER";
        } else if (userRole === "RETAILER") {
            return "DISTRIBUTOR";
        }
        return null;
    }, [userRole]);

    const {
        data: inventory = [],
        isLoading: isInventoryLoading,
        isError: isInventoryError,
    } = useQuery<InventoryRow[]>({
        queryKey: ["shipment", "inventory", userRole, ownedRole],
        queryFn: () => 
            userRole === "ADMIN"
                ? getInventories()
                : ownedRole
                ? getInventoryByRole(ownedRole)
                : Promise.resolve([]),
        enabled: !!ownedRole || userRole === "ADMIN",
    });

    const {
        data: users = [],
        isLoading: isUsersLoading,
        isError: isUsersError,
    } = useQuery<UserRow[]>({
        queryKey: ["shipment", "users", "admin"],
        queryFn: () => getUsersByRole("DISTRIBUTOR").then(data => 
            Promise.all([
                Promise.resolve(data),
                getUsersByRole("RETAILER"),
            ]).then(([distributors, retailers]) => {
                return [...distributors, ...retailers];
            })
        ),
        enabled: userRole === "ADMIN",
    });

    const form = useForm<ShipmentForm>({
        resolver: zodResolver(ShipmentSchema),
        defaultValues: {
            toUser: userRole === "ADMIN" ? "" : userId,
            fromUser: "",
            productBatch: "",
            quantity: 1,
        },
    });

    const mutation = useMutation({
        mutationFn: createShipment,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["shipment"] });
            form.reset();
            onSuccess();
            toast.success("User created successfully.");
        },
        onError: (error: Error) => {
            console.error("Error creating user:", error);
            toast.error("Failed to create user. Please try again later.");
        },
    });

    const onSubmit = (data: ShipmentForm) => {
        console.log("Submitting shipment data:", data);
        mutation.mutate({
            ...data,
            toUser: data.toUser,
        });
    };

    const selectedInventoryBatchId = form.watch("productBatch");
    useMemo(() => {
        if (!selectedInventoryBatchId) {
            form.setValue("fromUser", "");
            return;
        }
        const entry = inventory.find(inv => inv.batch?.id === selectedInventoryBatchId);
        if (entry) {
            form.setValue("fromUser", entry.user?.id || "");
        } else {
            form.setValue("fromUser", "");
        }
    }, [selectedInventoryBatchId, inventory, form]);

    return (
        <Dialog open onOpenChange={onCancel}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Shipment</DialogTitle>
                    <DialogDescription>
                        Please fill in the details below to create a shipment.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-4"
                    >
                        { userRole === "ADMIN" && (
                            <FormField
                                control={form.control}
                                name="toUser"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Requested User</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select User" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {isUsersLoading ? (
                                                    <SelectItem value="distributor loading">
                                                        Loading...
                                                    </SelectItem>
                                                ) : isUsersError ? (
                                                    <SelectItem value="error">
                                                        Error loading distributors
                                                    </SelectItem>
                                                ) : (
                                                    users.map((user) => (
                                                        <SelectItem
                                                            key={user.id}
                                                            value={user.id}
                                                        >
                                                            {user.name} - {user.email}
                                                        </SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                        <FormField
                            control={form.control}
                            name="productBatch"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Available Products</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Products" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {isInventoryLoading ? (
                                                <SelectItem value="product loading">
                                                    Loading...
                                                </SelectItem>
                                            ) : isInventoryError ? (
                                                <SelectItem value="error">
                                                    Error loading products
                                                </SelectItem>
                                            ) : (
                                                inventory.map((product: InventoryRow) => (
                                                    <SelectItem
                                                        key={product.id}
                                                        value={product.batch?.id ?? ""}
                                                    >
                                                        {product.batch?.produceType} - {product.quantity} - {product.batch?.description ? product.batch?.description : ""} - {product.user?.name}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="quantity"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Quantity</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            placeholder="Enter quantity"
                                            {...field}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                field.onChange(value === "" ? "" : Number(value));
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="secondary" onClick={onCancel}>
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button type="submit">
                                {mutation.isPending
                                    ? "Creating..."
                                    : "Create Shipment"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default CreateShipmentForm;
