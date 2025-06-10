import PublicNav from "@/components/nav/PublicNav";
import { useSession } from "next-auth/react";

const ForbiddenPage = () => {
    const { data: session } = useSession();
    let loginButton = session ? true : false;
    return (
        <div>
            <PublicNav visibleLogin={loginButton} />
            <main className="container mx-auto px-4 py-8">
                <p className="text-4xl font-bold">403 - Forbidden</p>
                <p>You do not have permission to access this page.</p>
            </main>
        </div>
    );
};

export default ForbiddenPage;
