"use client";

import PublicNav from "@/components/nav/PublicNav";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMutation } from "@tanstack/react-query";
import { submitContactForm } from "@/lib/react-query";
import { toast } from "sonner";

const ContactFormSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    message: z.string().min(1, "Message is required"),
});

export default function ContactPage() {
    const form = useForm<z.infer<typeof ContactFormSchema>>({
        resolver: zodResolver(ContactFormSchema),
        defaultValues: {
            name: "",
            email: "",
            message: "",
        },
    });

    const { mutate, isPending, error, isError } = useMutation({
        mutationFn: submitContactForm,
        onSuccess: () => {
            form.reset();
            toast.success("Your message has been sent successfully!");
        },
        onError: (error: Error) => {
            console.error("Error submitting contact form:", error);
            toast.error("Failed to send your message. Please try again later.");
        },
    });

    const onSubmit = (values: z.infer<typeof ContactFormSchema>) => {
        mutate(values);
    };

    return (
        <div>
            <PublicNav />
            <main className="container mx-auto px-4 py-8 max-w-lg">
                <h1 className="text-3xl font-bold mb-4">Contact Us</h1>
                <p className="mb-6 text-muted-foreground">
                    We would love to hear from you! Please fill out the form
                    below to get in touch.
                </p>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-6"
                    >
                        {/* Name Field */}
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            placeholder="Your Name"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Email Field */}
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            placeholder="your@email.com"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Message Field */}
                        <FormField
                            control={form.control}
                            name="message"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Message</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            {...field}
                                            placeholder="How can we help you today?"
                                            className="resize-none"
                                            rows={5}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isPending}
                        >
                            {isPending ? "Submitting..." : "Send Message"}
                        </Button>
                    </form>
                </Form>

                {/* Error Alert - Only shows when there are form errors */}
                {isError && (
                    <Alert variant="destructive" className="mt-4">
                        <AlertDescription>
                            {error.message ||
                                "An error occurred while submitting your message. Please try again."}
                        </AlertDescription>
                    </Alert>
                )}
            </main>
        </div>
    );
}
