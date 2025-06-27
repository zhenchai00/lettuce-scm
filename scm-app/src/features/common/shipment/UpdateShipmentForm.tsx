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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { FC } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { queryClient } from "@/lib/react-query";
import { updateShipment } from "./query";
import { ShipmentRow } from "./type";
import { useSession } from "next-auth/react";

const formSchema = z.object({
    status: z.enum(["ORDERED", "OUTOFDELIVERY", "DELIVERED", "CANCELLED"]),
});

type FormData = z.infer<typeof formSchema>;

interface UpdateShipmentFormProps {
    shipment: ShipmentRow;
    onSuccess: () => void;
    onCancel: () => void;
    onUpdate?: () => void;
}

const UpdateShipmentForm: FC<UpdateShipmentFormProps> = ({
    shipment,
    onSuccess,
    onCancel,
    onUpdate,
}) => {
    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            status: "OUTOFDELIVERY",
        },
    });

    const mutation = useMutation({
        mutationFn: (data: FormData) => updateShipment(shipment.id || "", data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["shipment"] });
            form.reset();
            onSuccess();
            onUpdate?.();
            toast.success("shipment updated successfully.");
        },
        onError: (error: Error) => {
            console.error("Error updating shipment:", error);
            toast.error("Failed to update shipment. Please try again later.");
        },
    });

    const onSubmit = (data: FormData) => {
        console.log("Form submitted with data:", data);
        mutation.mutate(data);
    };

    return (
        <Dialog open onOpenChange={onCancel}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Update status shipment</DialogTitle>
                    <DialogDescription>
                        Please fill in the details below to edit the shipment.
                    </DialogDescription>
                </DialogHeader>
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-4"
                        >
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Status</FormLabel>
                                        <FormControl>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Products" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {["ORDERED", "OUTOFDELIVERY", "DELIVERED", "CANCELLED"]
                                                    .filter((status) => {
                                                        console.log("Filtering status:", status);
                                                        if (shipment.status === "ORDERED") {
                                                            return status === "OUTOFDELIVERY" || status === "CANCELLED";
                                                        }
                                                        if (shipment.status === "OUTOFDELIVERY") {
                                                            return status === "DELIVERED";
                                                        }
                                                    })
                                                    .map(
                                                        (status) => (
                                                            <SelectItem
                                                                key={status}
                                                                value={status}
                                                            >
                                                                {status}
                                                            </SelectItem>
                                                        )
                                                    )}
                                                </SelectContent>
                                            </Select>
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

export default UpdateShipmentForm;
