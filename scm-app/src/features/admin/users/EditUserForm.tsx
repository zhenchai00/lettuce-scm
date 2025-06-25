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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { FC, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { getUserById, updateUser } from "./query";
import { Loader } from "lucide-react";
import { toast } from "sonner";
import { queryClient } from "@/lib/react-query";
import { USER_ROLES } from "@/lib/constant";

const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    role: z.enum(USER_ROLES),
});

type FormData = z.infer<typeof formSchema>;

interface EditUserFormProps {
    userId: string;
    onSuccess: () => void;
    onCancel: () => void;
}

const EditUserForm: FC<EditUserFormProps> = ({
    userId,
    onSuccess,
    onCancel,
}) => {
    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
    });

    const { data, isLoading } = useQuery({
        queryKey: ["user", userId],
        queryFn: () => getUserById(userId),
    });

    const mutation = useMutation({
        mutationFn: (data: FormData) => updateUser({ id: userId, data }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "user", userId] });
            form.reset();
            onSuccess();
            toast.success("User updated successfully.");
        },
        onError: (error: Error) => {
            console.error("Error updating user:", error);
            toast.error("Failed to update user. Please try again later.");
        },
    });

    const onSubmit = (data: FormData) => {
        mutation.mutate(data);
    };

    useEffect(() => {
        if (data && data.role !== form.getValues("role")) {
            form.reset(data);
        }
    }, [data, form]);

    return (
        <Dialog open onOpenChange={onCancel}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit User</DialogTitle>
                    <DialogDescription>
                        Please fill in the details below to edit the user.
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
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Enter user name"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="email"
                                                placeholder="Enter user email"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="role"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Role</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value ?? ""}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {USER_ROLES.map((role) => (
                                                    <SelectItem
                                                        key={role}
                                                        value={role}
                                                    >
                                                        {role}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
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

export default EditUserForm;
