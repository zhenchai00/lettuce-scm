import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { ComponentPropsWithoutRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { signIn } from "next-auth/react";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";

const loginSchema = z.object({
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
});

interface SignInResponse {
    error?: string;
    ok?: boolean;
    status?: number;
    url?: string;
}

type LoginForm = z.infer<typeof loginSchema>;

const LoginForm = ({
    className,
    ...props
}: ComponentPropsWithoutRef<"div">) => {
    const router = useRouter();
    const form = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const mutationFn = async (data: LoginForm) => {
        const result = await signIn("credentials", {
            redirect: false,
            email: data.email,
            password: data.password,
        });
        return result as any;
    };

    const mutation = useMutation<
        SignInResponse | undefined,
        unknown,
        LoginForm
    >({
        mutationFn,
        onSuccess: async (result: any) => {
            if (result?.error) {
                console.error(result.error);
                toast.error(
                    `Login failed: ${result.error}. Please check your credentials and try again.`
                );
                form.reset();
            } else if (result?.ok) {
                const session = await fetch("/api/auth/session").then((res) =>
                    res.json()
                );
                const role = session?.user?.role;
                switch (role) {
                    case "ADMIN":
                        router.push("/admin/dashboard");
                        break;
                    case "FARMER":
                        router.push("/farmer/dashboard");
                        break;
                    case "DISTRIBUTOR":
                        router.push("/distributor/dashboard");
                        break;
                    case "RETAILER":
                        router.push("/retailer/dashboard");
                        break;
                    default:
                        router.push("/");
                        break;
                }
                toast.success("Login successful!");
            }
        },
        onError: (error) => {
            console.error("Error during login:", error);
            toast.error(
                "Login failed. Please check your credentials and try again."
            );
            form.reset();
        },
    });

    const onSubmit = async (data: LoginForm) => {
        mutation.mutate(data);
    };

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">Login</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <div className="flex flex-col gap-6">
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel htmlFor="email">
                                                Email
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="admin@mail.com"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel htmlFor="password">
                                                Password
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="********"
                                                    type="password"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={mutation.status === "pending"}
                                >
                                    {mutation.status === "pending"
                                        ? "Loading..."
                                        : "Login"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
};

export default LoginForm;
