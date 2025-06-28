import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { FC, JSX } from "react";

export interface ProductJourneyEvent {
    eventType: string;
    timestamp: string | Date;
    description: string;
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
                {data.events.map((event, idx) => (
                    <div key={idx} className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-30">
                            {badgeVariants[event.eventType] ?? (
                                <Badge variant="outline" className="bg-gray-100 text-gray-800">
                                    {event.eventType}
                                </Badge>
                            )}
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-gray-400">
                                {format(
                                    new Date(event.timestamp),
                                    "yyyy-MM-dd HH:mm:ss"
                                )}
                            </p>
                            <p className="mt-1 text-sm">{event.description}</p>
                            <p className="mt-1 text-xs text-gray-500">
                                By {event.user.name} ({event.user.email})
                            </p>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
};

export default ProductJourney;
