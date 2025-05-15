import { Button } from "@/components/ui/button";
import { LogOut, UserCircle2 } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { FC } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

const SidebarHeader: FC = () => {
    const { data: session } = useSession();
    return (
        <header className="flex justify-between p-4 border-b">
            <div className="flex items-center space-x-4">
                <SidebarTrigger />
                <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
                <h1 className="text-xl font-semibold">Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
                <Button variant="ghost" className="flex items-center space-x-2">
                    <UserCircle2 className="w-5 h-5" />
                    <span>{session?.user.name}</span>
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
