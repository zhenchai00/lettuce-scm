import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { ComponentPropsWithoutRef } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { signIn } from "next-auth/react";

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

interface SignInResponse {
    error?: string;
    ok?: boolean;
    status?: number;
}

type LoginForm = z.infer<typeof loginSchema>;

const LoginForm = ({
    className,
    ...props
}: ComponentPropsWithoutRef<"div">) => {
    const router = useRouter();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginForm>({
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
        return result as SignInResponse | undefined;
    };

    const mutation = useMutation<SignInResponse | undefined, unknown, LoginForm>({
        mutationFn,
        onSuccess: (result: any) => {
            console.log("result", result);
            if (result?.error) {
                // display error via mutation.error
                console.error(result.error);
            } else if (result?.ok) {
                router.push("/dashboard");
            }
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
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="flex flex-col gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="m@example.com"
                                    required
                                    {...register("email")}
                                />
                            </div>
                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password">Password</Label>
                                    <a
                                        href="#"
                                        className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                                    >
                                        Forgot your password?
                                    </a>
                                </div>
                                <Input id="password" type="password" required {...register("password")} />
                            </div>
                            <Button type="submit" className="w-full">
                                Login
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default LoginForm;
