import prisma from "@/lib/prisma"

export const getShopProducts = async () => {
    const response = await prisma.inventory.findMany({
        where: {
            user: {
                role: "RETAILER",
            },
        },
        include: {
            batch: true,
            user: true,
        },
        orderBy: {
            createdAt: "asc",
        },
    });
    console.log("Fetched shop products:", response);
    return response || [];
}