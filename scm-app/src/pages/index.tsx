import PublicNav from "@/components/nav/PublicNav";

export default function Home() {
    return (
        <div>
            <PublicNav />
            <main className="container mx-auto p-4">
                <h1 className="text-3xl font-bold mb-4">
                    Welcome to Lettuce Supply Chain
                </h1>
                <p className="mb-4">
                    This is a sample application demonstrating a supply chain
                    management system.
                </p>
                <p>
                    Explore the features and functionalities by navigating
                    through the links above.
                </p>
            </main>
        </div>
    );
}
