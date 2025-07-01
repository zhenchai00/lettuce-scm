import { CreateUserData, UserData } from "@/features/admin/users/type";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

export const getUsers = async () => {
    try {
        const users = await prisma.user.findMany({
            orderBy: {
                createdAt: "desc",
            },
        });
        return users || [];
    } catch (error) {
        console.error("Error fetching users:", error);
        throw new Error("Failed to fetch users: " + error);
    }
};

export const getUserById = async (id: string) => {
    try {
        console.log("Fetching user with ID:", id);
        const user = await prisma.user.findUnique({
            where: { id },
        });
        console.log("Fetched users:", user);
        return user || [];
    } catch (error) {
        console.error("Error fetching user by ID:", error);
        throw new Error(`User with ID ${id} not found`);
    }
};

export const getUserByEmail = async (email: string) => {
    try {
        if (!email || email.trim() === "") {
            throw new Error("Email is required to fetch user");
        }
        console.log("Fetching user with email:", email);
        const user = await prisma.user.findUnique({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
            where: { email },
        });
        console.log("Fetched user:", user);
        return user || [];
    } catch (error) {
        console.error("Error fetching user by email:", error);
        throw new Error(`User with email ${email} not found`);
    }
};

export const getUsersByRole = async (role: string) => {
    try {
        if (!role) {
            throw new Error("Role is required to fetch users");
        }
        console.log("Fetching users with role:", role);
        const users = await prisma.user.findMany({
            where: { role: role as any },
            orderBy: {
                createdAt: "desc",
            },
        });
        console.log("Fetched users:", users);
        return users || [];
    } catch (error) {
        console.error("Error fetching users by role:", error);
        throw new Error(`Users with role ${role} not found`);
    }
};

export const createUser = async (data: CreateUserData) => {
    try {
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existingUser) {
            throw new Error(`User with email ${data.email} already exists`);
        }

        let password = await bcrypt.hash(data.password, 10);
        const user = await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                passwordHash: password,
                role: data.role,
            },
        });
        console.log("Created user:", user);
        return user;
    } catch (error) {
        console.error("Error creating user:", error);
        throw new Error("Failed to create user: " + error);
    }
};

export const updateUser = async (id: string, data: UserData) => {
    try {
        const existingUser = await prisma.user.findUnique({
            where: { id },
        });
        if (!existingUser) {
            throw new Error(`User with ID ${id} not found`);
        }

        const user = await prisma.user.update({
            where: { id },
            data: {
                name: data.name,
                email: data.email,
                role: data.role,
            },
        });
        console.log("Updated user:", user);
        return user;
    } catch (error) {
        console.error("Error updating user:", error);
        throw new Error(`Failed to update user with ID ${id}: ` + error);
    }
};

export const deleteUser = async (id: string) => {
    try {
        const existingUser = await prisma.user.findUnique({
            where: { id },
        });
        if (!existingUser) {
            throw new Error(`User with ID ${id} not found`);
        }
        const user = await prisma.user.delete({
            where: { id },
        });
        console.log("Deleted user:", user);
        return user;
    } catch (error) {
        console.error("Error deleting user:", error);
        throw new Error(`Failed to delete user with ID ${id}: ` + error);
    }
};
