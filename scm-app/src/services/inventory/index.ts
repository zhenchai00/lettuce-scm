import prisma from "@/lib/prisma";

export const getInventory = async () => {
    try {
        console.log("Fetching inventory");
        const inventory = await prisma.inventory.findMany({
            orderBy: {
                createdAt: "desc",
            },
            include: {
                user: true,
                batch: true,
            },
        });
        console.log("Fetched inventory:", inventory);
        return inventory || [];
    } catch (error) {
        console.error("Error fetching inventory:", error);
        throw new Error("Failed to fetch inventory: " + error);
    }
};

export const getInventoryById = async (id: string) => {
    try {
        console.log("Fetching inventory with ID:", id);
        const inventory = await prisma.inventory.findUnique({
            where: { id },
            include: {
                user: true,
                batch: true,
            },
        });
        console.log("Fetched inventory:", inventory);
        return inventory || [];
    } catch (error) {
        console.error("Error fetching inventory:", error);
        throw new Error(`Inventory with ID ${id} not found`);
    }
};

export const getInventoryByUserId = async (userId: string) => {
    try {
        console.log("Fetching inventory for user ID:", userId);
        const inventory = await prisma.inventory.findMany({
            where: { userId },
            include: {
                user: true,
                batch: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        console.log("Fetched inventory for user:", inventory);
        return inventory || [];
    } catch (error) {
        console.error("Error fetching inventory by user ID:", error);
        throw new Error(`Inventory for user ID ${userId} not found`);
    }
};

export const getInventoryByUserRole = async (role: string) => {
    try {
        console.log("Fetching inventory for user role:", role);
        const inventory = await prisma.inventory.findMany({
            where: {
                user: {
                    role: role as any,
                },
            },
            include: {
                user: true,
                batch: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        console.log("Fetched inventory for role:", inventory);
        return inventory || [];
    } catch (error) {
        console.error("Error fetching inventory by user role:", error);
        throw new Error(`Inventory for user role ${role} not found`);
    }
};

export const createInventory = async (data: any) => {
    try {
        console.log("Creating inventory:", data);
        const inventory = await prisma.inventory.create({
            data: {
                ...data,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            include: {
                user: true,
                batch: true,
            },
        });
        console.log("Created inventory:", inventory);
        return inventory;
    } catch (error) {
        console.error("Error creating inventory:", error);
        throw new Error("Failed to create inventory: " + error);
    }
};

export const updateInventory = async (id: string, updatedData: any) => {
    try {
        console.log("Updating inventory with ID:", id, "Data:", updatedData);
        const inventory = await prisma.inventory.update({
            where: { id },
            data: {
                ...updatedData,
                quantity: updatedData.quantity || 0,
                updatedAt: new Date(),
            },
            include: {
                user: true,
                batch: true,
            },
        });
        console.log("Updated inventory:", inventory);
        return inventory;
    } catch (error) {
        console.error("Error updating inventory:", error);
        throw new Error(`Failed to update inventory with ID ${id}: ` + error);
    }
};

export const deleteInventory = async (id: string) => {
    try {
        console.log("Deleting inventory with ID:", id);
        const inventory = await prisma.inventory.delete({
            where: { id },
        });
        console.log("Deleted inventory:", inventory);
        return inventory;
    } catch (error) {
        console.error("Error deleting inventory:", error);
        throw new Error(`Failed to delete inventory with ID ${id}: ` + error);
    }
};
