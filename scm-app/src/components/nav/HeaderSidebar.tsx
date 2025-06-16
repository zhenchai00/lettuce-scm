import { Button } from "@/components/ui/button";
import { Loader, LogOut, UserCircle2 } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { FC, useEffect } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import Head from "next/head";

interface SidebarHeaderProps {
    title?: string;
}

const SidebarHeader: FC<SidebarHeaderProps> = ({ title }) => {
    const { data: session } = useSession();

    useEffect(() => {
        console.log("Session changed:", session?.user);
    }, [session]);
    return (
        <header className="flex justify-between p-4 border-b">
            <div className="flex items-center space-x-4">
                <SidebarTrigger />
                <Separator
                    orientation="vertical"
                    className="mx-2 data-[orientation=vertical]:h-4"
                />
                <Head>
                    <title>{title}</title>
                </Head>
                <h1 className="text-lg font-semibold">{title}</h1>
            </div>
            <div className="flex items-center space-x-4">
                <Button variant="ghost" className="flex items-center space-x-2">
                    <UserCircle2 className="w-5 h-5" />
                    <span>
                        {session ? (
                            session?.user.name
                        ) : (
                            <Loader className="animate-spin w-5 h-5" />
                        )}
                    </span>
                </Button>
                <Button
                    variant="ghost"
                    onClick={() => void signOut({ callbackUrl: "/auth/login" })}
                >
                    <LogOut className="w-5 h-5" />
                </Button>
            </div>
        </header>
    );
};

export default SidebarHeader;
