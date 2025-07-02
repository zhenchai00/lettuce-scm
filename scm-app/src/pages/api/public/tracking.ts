import { getTrackingInfo } from "@/services/public/tracking";
import { NextApiRequest, NextApiResponse } from "next";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        const { id } = req.query;

        if (!id || typeof id !== 'string') {
            return res.status(400).json({ error: "Bad Request", message: "Tracking number is required" });
        }

        const trackingInfo = await getTrackingInfo(id);
        return res.status(200).json(trackingInfo);
    } catch (error) {
        console.error("Error fetching tracking info:", error);
        return res.status(500).json({ error: "Internal Server Error", message: "Failed to fetch tracking information " + error });
    }
}

export default handler;
