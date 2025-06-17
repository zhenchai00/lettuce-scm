import { CreateUserData, UserData } from "@/features/admin/users/type";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

export const getUsers = async () => {
    const users = await prisma.user.findMany({
        orderBy: {
            createdAt: "desc",
        },
    });
    return users || [];
};

export const getUserById = async (id: string) => {
    console.log("Fetching user with ID:", id);
    const user = await prisma.user.findUnique({
        where: { id },
    });
    console.log("Fetched users:", user);
    return user || [];
};

export const getUserByEmail = async (email: string) => {
    if (!email) {
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
};

export const createUser = async (data: CreateUserData) => {
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
};

export const updateUser = async (id: string, data: UserData) => {
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
};

export const deleteUser = async (id: string) => {
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
};
