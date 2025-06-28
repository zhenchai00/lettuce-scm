import PublicNav from "@/components/nav/PublicNav";
import LoginForm from "@/features/auth/Login-Form";
import { Loader } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";

const LoginPage = () => {
    const { data: session, status } = useSession();
    const router = useRouter();
    useEffect(() => {
        if (status === "authenticated") {
            router.replace("/");
        }
    }, [status, router]);

    if (status === "loading") {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader className="animate-spin h-8 w-8 text-gray-500" />
            </div>
        );
    }

    if (status === "authenticated") {
        return null;
    }

    return (
        <div>
            <PublicNav visibleLogin={false} />
            <main className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
                <div className="w-full max-w-sm">
                    <LoginForm />
                </div>
            </main>
        </div>
    );
};

export default LoginPage;
