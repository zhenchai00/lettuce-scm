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
import { useMutation, useQuery } from "@tanstack/react-query";
import { FC, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CalendarIcon, Loader } from "lucide-react";
import { toast } from "sonner";
import { queryClient } from "@/lib/react-query";
import { getProductBatchById, updateProductBatch } from "./query";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
import { useGenericErrorHandler } from "@/hooks/use-GenericErrorHandling";

interface EditProductBatchFormProps {
    batchId: string;
    onSuccess: () => void;
    onCancel: () => void;
}

const EditProductBatchForm: FC<EditProductBatchFormProps> = ({
    batchId,
    onSuccess,
    onCancel,
}) => {
    const { data: productBatch, isLoading } = useQuery({
        queryKey: ["product-batch", batchId],
        queryFn: () => getProductBatchById(batchId),
    });

    const formSchema = z.object({
        description: z.string().min(1, "Description is required"),
        harvestDate: z.coerce
            .date({
                errorMap: () => ({ message: "Harvest date is required" }),
            })
            .refine(
                (date) => {
                    if (date < new Date()) {
                        return false;
                    }
                    return true;
                },
                {
                    message: "Harvest date must be today or in the future.",
                }
            )
            .refine(
                (date) => {
                    if (
                        productBatch &&
                        date < new Date(productBatch.plantingDate)
                    ) {
                        return false;
                    }
                    return true;
                },
                {
                    message: "Harvest date must be after planting date.",
                }
            ),
        quantity: z.number().min(1, "Quantity must be greater than 0"),
    });

    type FormData = z.infer<typeof formSchema>;
    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            description: productBatch?.description || "",
            harvestDate: productBatch?.harvestDate ? new Date(productBatch.harvestDate) : new Date(),
            quantity: productBatch?.quantity || 0,
        }
    });
    const { data: session } = useSession();

    const mutation = useMutation({
        mutationFn: (data: FormData) =>
            updateProductBatch({
                id: batchId,
                farmer: session?.user?.id || "",
                data: {
                    ...data,
                    harvestDate: new Date(data.harvestDate),
                },
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["product-batch", batchId],
            });
            form.reset();
            onSuccess();
            toast.success("Product batch updated successfully.");
        },
        onError: useGenericErrorHandler(form),
    });

    const onSubmit = (data: FormData) => {
        mutation.mutate(data);
    };

    useEffect(() => {
        if (productBatch) {
            form.reset(productBatch);
        }
    }, [productBatch, form]);

    return (
        <Dialog open onOpenChange={onCancel}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Product Batch</DialogTitle>
                    <DialogDescription>
                        Please fill in the details below to edit the product
                        batch.
                    </DialogDescription>
                </DialogHeader>
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader className="animate-spin h-8 w-8 text-gray-500" />
                    </div>
                ) : (
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-4"
                        >
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Enter product batch description"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="harvestDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Harvest Date</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-[240px] pl-3 text-left font-normal",
                                                            !field.value &&
                                                                "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(
                                                                field.value,
                                                                "PPP"
                                                            )
                                                        ) : (
                                                            <span>
                                                                Pick a date
                                                            </span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent
                                                className="w-auto p-0"
                                                align="start"
                                            >
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={(date) => {
                                                        if (!date) return;
                                                        const plantingDate = productBatch?.plantingDate
                                                            ? new Date(productBatch.plantingDate)
                                                            : null;

                                                        if (!plantingDate) {
                                                            toast.error("Planting date is missing.");
                                                            return;
                                                        }

                                                        if (date < plantingDate) {
                                                            form.setError("harvestDate", {
                                                                type: "manual",
                                                                message: "Harvest date must be after planting date.",
                                                            });
                                                            toast.error("Harvest date must be after planting date.");
                                                            return;
                                                        }

                                                        if (date < new Date()) {
                                                            form.setError("harvestDate", {
                                                                type: "manual",
                                                                message: "Harvest date must be today or in the future.",
                                                            });
                                                            toast.error("Harvest date cannot be in the past.");
                                                            return;
                                                        }
                                                        form.clearErrors(
                                                            "harvestDate"
                                                        );
                                                        field.onChange(date);
                                                    }}
                                                    captionLayout="dropdown"
                                                    fromYear={new Date().getFullYear()}
                                                />
                                            </PopoverContent>
                                        </Popover>
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
                                        <Input
                                            type="number"
                                            {...field}
                                            value={field.value ?? ""}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                field.onChange(
                                                    value === ""
                                                        ? 0
                                                        : Number(value)
                                                );
                                            }}
                                        />
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
                )}
            </DialogContent>
        </Dialog>
    );
};

export default EditProductBatchForm;
