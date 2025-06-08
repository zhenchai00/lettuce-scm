import PublicNav from "@/components/nav/PublicNav";

const AboutPage = () => {
    return (
        <div>
                <PublicNav />
            <main className="container mx-auto p-4">
                <h1 className="text-3xl font-bold mb-4">
                    About Lettuce Supply Chain
                </h1>
                <p className="mb-4">
                    Lettuce Supply Chain is a sample application designed to
                    demonstrate the capabilities of a supply chain management
                    system.
                </p>
                <p className="mb-4">
                    This application allows users to manage various aspects of
                    the supply chain, including inventory management, order
                    processing, and logistics.
                </p>
                <p>
                    The goal is to provide a comprehensive solution that
                    enhances efficiency and transparency in supply chain
                    operations.
                </p>
            </main>
        </div>
    );
};

export default AboutPage;
