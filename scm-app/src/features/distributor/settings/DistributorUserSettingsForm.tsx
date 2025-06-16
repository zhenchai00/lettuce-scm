import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { updateExistingUser } from "./query";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/router";

const formSchema = z.object({
    email: z.string().email().optional(),
    name: z.string().min(2).max(100).optional(),
});

type FormData = z.infer<typeof formSchema>;

const DistributorUserSettingsForm = () => {
    const { data, update: updateSession } = useSession();
    const router = useRouter();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            name: "",
        },
        mode: "onChange",
        criteriaMode: "all",
    });

    const mutation = useMutation({
        mutationFn: (formData: FormData) => updateExistingUser(data?.user?.id || "", formData),
        onSuccess: async () => {
            await updateSession();
            toast.success("User settings updated successfully!");
            setIsDialogOpen(false);
            router.push(`/${data?.user?.role.toLowerCase()}/dashboard`);
        },
        onError: (error) => {
            console.error("Error updating user settings:", error);
            toast.error("Failed to update user settings. Please try again.");
        }
    });

    const handleSaveClick = () => {
        form.handleSubmit(
            (data) => {
                setIsDialogOpen(true);
            },
            (errors) => {
                console.error("Form errors:", errors);
                form.setError("root", {
                    type: "manual",
                    message: "Please fix the errors before saving.",
                });
                toast.error("Please fix the errors before saving.");
            }
        )();
    };

    const handleConfirm = () => {
        form.handleSubmit((data) => {
            setIsSubmitting(true);
            try {
                onSubmit(data);
            } finally {
                setIsDialogOpen(false);
                setIsSubmitting(false);
            }
        })();
    };

    const onSubmit = (formData: FormData) => {
        mutation.mutate(formData);
    };

    return (
        <div>
            <Form {...form}>
                <form className="space-y-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="mb-2">Name</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        placeholder="Name"
                                        value={field.value || ""}
                                    />
                                </FormControl>
                                <FormDescription>
                                    This is your new name here
                                </FormDescription>
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
                                        {...field}
                                        placeholder="Email"
                                        value={field.value || ""}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Your new email address to get updates and
                                    your login username
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="button" onClick={handleSaveClick}>
                        Save Changes
                    </Button>

                    <AlertDialog
                        open={isDialogOpen}
                        onOpenChange={setIsDialogOpen}
                    >
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                    Confirm Changes?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to save these changes?
                                </AlertDialogDescription>
                            </AlertDialogHeader>

                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction asChild>
                                    <Button
                                        type="button"
                                        onClick={handleConfirm}
                                    >
                                        {isSubmitting ? "Submitting..." : "Confirm Changes"}
                                    </Button>
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </form>
            </Form>
        </div>
    );
};
export default DistributorUserSettingsForm;
