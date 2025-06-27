import { InventoryRow } from "@/features/common/inventory/type";
import prisma from "@/lib/prisma";

export const getInventory = async () => {
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
};

export const getInventoryById = async (id: string) => {
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
};

export const getInventoryByUserId = async (userId: string) => {
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
};

export const getInventoryByUserRole = async (role: string) => {
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
};

export const createInventory = async (data: any) => {
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
};

export const updateInventory = async (id: string, updatedData: any) => {
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
};

export const deleteInventory = async (id: string) => {
    console.log("Deleting inventory with ID:", id);
    const inventory = await prisma.inventory.delete({
        where: { id },
    });
    console.log("Deleted inventory:", inventory);
    return inventory;
};
