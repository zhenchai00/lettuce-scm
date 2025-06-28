import { getShopProducts } from "@/services/public/shop";
import { NextApiRequest, NextApiResponse } from "next";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        const products = await getShopProducts();
        return res.status(200).json(products);
    } catch (error) {
        console.error("Error fetching shop products:", error);
        return res.status(500).json({ error: "Internal Server Error", message: "Failed to fetch shop products" });
    }
}

export default handler;
