import PublicNav from "@/components/nav/PublicNav";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import ProductJourney from "@/features/public/ProductJourney";
import { getLettuceTrackingInfo } from "@/features/public/query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Loader } from "lucide-react";
import Head from "next/head";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

export default function Home() {
    const [submitted, setSubmitted] = useState<string>("");
    const formSchema = z.object({
        trackingNumber: z.string().min(1, "Tracking number is required"),
    });
    type TrackingForm = z.infer<typeof formSchema>;

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            trackingNumber: "",
        },
    });

    const { data, isLoading, isError } = useQuery({
        queryKey: ["trackingInfo", submitted],
        queryFn: async () => getLettuceTrackingInfo(submitted),
        enabled: !!submitted,
    });

    const onSubmit = (data: TrackingForm) => {
        setSubmitted(data.trackingNumber);
        console.log("Tracking number submitted:", data.trackingNumber);
    };
    
    return (
        <div>
            <Head>
                <title>Lettuce Supply Chain</title>
                <meta name="description" content="Track your lettuce supply chain" />
            </Head>
            <PublicNav />
            <main className="container mx-auto p-4">
                <h1 className="text-3xl font-bold mb-4">
                    Welcome to Lettuce Supply Chain
                </h1>
                <p className="mb-4">
                    This is a sample application demonstrating a supply chain
                    management system.
                </p>

                <Card className="mx-auto mt-8 ">
                    <CardHeader>
                        <h2 className="text-xl font-semibold">
                            Track Your Lettuce
                        </h2>
                        <p className="text-sm text-gray-500">
                            Enter the tracking number to view the status of your lettuce.
                        </p>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form
                                onSubmit={form.handleSubmit(onSubmit)}
                                className="space-y-4"
                            >
                                <FormField
                                    control={form.control}
                                    name="trackingNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tracking Number</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="Enter tracking number"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <button
                                    type="submit"
                                    className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors"
                                >Let's See The Product Journey</button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>

                {isLoading && (
                    <div className="flex items-center justify-center h-64">
                        <Loader className="animate-spin h-8 w-8 text-gray-500" />
                    </div>
                )}
                {isError && toast.error("Failed to load product journey. Please try again later.")}
                {data && <ProductJourney data={data} />}
            </main>
        </div>
    );
}
