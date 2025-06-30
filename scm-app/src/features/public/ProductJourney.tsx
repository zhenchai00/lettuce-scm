import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { FC, JSX } from "react";

export interface ProductJourneyEvent {
    eventType: string;
    timestamp: string | Date;
    description: string;
    txHash: string;
    user: {
        id: string;
        name: string;
        email: string;
    };
}

export interface ProductJourneyData {
    batchId: string;
    trackingKey: string;
    events: ProductJourneyEvent[];
}

interface ProductJourneyProps {
    data: ProductJourneyData;
}

const badgeVariants: Record<string, JSX.Element> = {
    PLANTED: (
        <Badge variant="outline" className="bg-green-100 text-green-800">
            PLANTED
        </Badge>
    ),
    HARVESTED: (
        <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            HARVESTED
        </Badge>
    ),
    SHIPPED: (
        <Badge variant="outline" className="bg-blue-100 text-blue-800">
            OUTOFDELIVERY
        </Badge>
    ),
    DELIVERED: (
        <Badge variant="outline" className="bg-purple-100 text-purple-800">
            DELIVERED
        </Badge>
    ),
};

const ProductJourney: FC<ProductJourneyProps> = ({ data }) => {
    if (!data || !data.events || data.events.length === 0) {
        return (
            <Card className="w-full mt-6">
                <CardHeader>
                    <h3 className="text-xl font-semibold">Product Journey</h3>
                    <p className="text-sm text-gray-500">
                        No journey data available for this tracking number.
                    </p>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card className="w-full mt-6">
            <CardHeader>
                <h3 className="text-xl font-semibold">Product Journey</h3>
                <p className="text-sm text-gray-500">
                    Batch ID: {data.batchId}
                </p>
                <p className="text-sm text-gray-500">
                    Tracking Key: {data.trackingKey}
                </p>
            </CardHeader>
            <CardContent className="space-y-4">
                {data && (
                    <div className="space-y-2">
                        {data.events.map((event, index) => (
                            <div
                                key={index}
                                className="flex items-start space-x-4 mb-2 p-4 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex-shrink-0 w-30">
                                    {badgeVariants[event.eventType] || (
                                        <Badge
                                            variant="outline"
                                            className="bg-gray-100 text-gray-800"
                                        >
                                            UNKNOWN
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex-1 space-y-2">
                                    <p className="font-medium">
                                        {event.description}
                                    </p>
                                    <p className="text-xs font-semibold text-gray-500">
                                        TxHash: {event.txHash}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {format(
                                            new Date(event.timestamp),
                                            "PPPpp"
                                        )}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        by {event.user.name} ({event.user.email}
                                        )
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default ProductJourney;
