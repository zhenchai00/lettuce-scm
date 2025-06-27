import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogContent,
    DialogDescription,
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { FC } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { queryClient } from "@/lib/react-query";
import { updateInventory } from "./query";

const formSchema = z.object({
    quantity: z.number().gte(1, "Quantity is required"),
});

type FormData = z.infer<typeof formSchema>;

interface EditInventoryFormProps {
    inventoryId: string;
    onSuccess: () => void;
    onCancel: () => void;
    onUpdate?: () => void;
}

const EditInventoryForm: FC<EditInventoryFormProps> = ({
    inventoryId,
    onSuccess,
    onCancel,
    onUpdate,
}) => {
    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            quantity: 0, // Default value, will be updated once data is fetched
        },
    });

    const mutation = useMutation({
        mutationFn: (data: FormData) => updateInventory(inventoryId, data ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["inventory", inventoryId] });
            form.reset();
            onSuccess();
            onUpdate?.();
            toast.success("Inventory updated successfully.");
        },
        onError: (error: Error) => {
            console.error("Error updating inventory:", error);
            toast.error("Failed to update inventory. Please try again later.");
        },
    });

    const onSubmit = (data: FormData) => {
        mutation.mutate(data);
    };

    return (
        <Dialog open onOpenChange={onCancel}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Inventory</DialogTitle>
                    <DialogDescription>
                        Please fill in the details below to edit the inventory.
                    </DialogDescription>
                </DialogHeader>
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-4"
                        >
                            <FormField
                                control={form.control}
                                name="quantity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Quantity</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="Enter inventory quantity"
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
                                <Button
                                    variant={"secondary"}
                                    onClick={onCancel}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit">
                                    {mutation.isPending
                                        ? "Submitting..."
                                        : "Submit"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
            </DialogContent>
        </Dialog>
    );
};

export default EditInventoryForm;
