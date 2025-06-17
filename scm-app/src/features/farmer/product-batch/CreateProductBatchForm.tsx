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
import { useMutation } from "@tanstack/react-query";
import { FC } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { queryClient } from "@/lib/react-query";
import { createProductBatch } from "./query";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { useSession } from "next-auth/react";
import { useGenericErrorHandler } from "@/hooks/use-GenericErrorHandling";

const FormSchema = z.object({
    produceType: z.enum(
        ["BUTTERHEAD", "LOOSELEAF", "OAKLEAF", "ROMAINE", "SPINACH"],
        {
            errorMap: () => ({ message: "Produce type is required" }),
        }
    ),
    description: z.string().min(1, "Description is required"),
    plantingDate: z.coerce
        .date({
            errorMap: () => ({ message: "Planting date is required" }),
        })
        .refine(
            (date) => date >= new Date("2020-01-01") && date <= new Date(),
            {
                message: "Planting date must be between 2020-01-01 and today.",
            }
        ),
});

type FormData = z.infer<typeof FormSchema>;

interface CreateProductBatchFormProps {
    onSuccess: () => void;
    onCancel: () => void;
}

const CreateProductBatchForm: FC<CreateProductBatchFormProps> = ({
    onSuccess,
    onCancel,
}) => {
    const { data: session } = useSession();
    const form = useForm<FormData>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            produceType: "BUTTERHEAD", // Default produce type
            description: "",
            plantingDate: new Date(),
        },
    });

    const mutation = useMutation({
        mutationFn: createProductBatch,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["farmer", "product-batches"],
            });
            form.reset();
            onSuccess();
            toast.success("Product batch created successfully!");
        },
        onError: useGenericErrorHandler(form),
    });

    const onSubmit = (data: FormData) => {
        mutation.mutate({
            ...data,
            farmer: session?.user?.id || "",
        });
    };

    return (
        <Dialog open onOpenChange={onCancel}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Product Batch</DialogTitle>
                    <DialogDescription>
                        Please fill in the details below to create a new product
                        batch.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-4"
                    >
                        <FormField
                            control={form.control}
                            name="produceType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Produce Type</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {[
                                                "BUTTERHEAD",
                                                "LOOSELEAF",
                                                "OAKLEAF",
                                                "ROMAINE",
                                                "SPINACH",
                                            ].map((produceType) => (
                                                <SelectItem
                                                    key={produceType}
                                                    value={produceType}
                                                >
                                                    {produceType
                                                        .charAt(0)
                                                        .toUpperCase() +
                                                        produceType.slice(1)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
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
                            name="plantingDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Planting Date</FormLabel>
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
                                                        <span>Pick a date</span>
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
                                                    if (
                                                        date > new Date() ||
                                                        date <
                                                            new Date(
                                                                "2020-01-01"
                                                            )
                                                    ) {
                                                        toast.error(
                                                            "Planting date must be between 2020-01-01 and today."
                                                        );
                                                        form.setError(
                                                            "plantingDate",
                                                            {
                                                                type: "manual",
                                                                message:
                                                                    "Planting date must be between 2020-01-01 and today.",
                                                            }
                                                        );
                                                        return;
                                                    }
                                                    form.clearErrors(
                                                        "plantingDate"
                                                    );
                                                    field.onChange(date);
                                                }}
                                                captionLayout="dropdown"
                                                fromYear={2020}
                                                toYear={new Date().getFullYear()}
                                            />
                                        </PopoverContent>
                                    </Popover>
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
                                    : "Create Product Batch"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default CreateProductBatchForm;
