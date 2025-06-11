import { CreateUserData, UserData } from "@/features/admin/users/type";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

export const getUsers = async () => {
    const users = await prisma.user.findMany({
        orderBy: {
            createdAt: "desc",
        },
    });
    if (!users || users.length === 0) {
        throw new Error("No users found");
    }
    return users;
};

export const getUserById = async (id: string) => {
    console.log("Fetching user with ID:", id);
    const user = await prisma.user.findUnique({
        where: { id },
    });
    console.log("Fetched users:", user);
    if (!user) {
        throw new Error(`User with ID ${id} not found`);
    }
    return user;
}
export const createUser = async (data: CreateUserData) => {
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
}

export const updateUser = async (id: string, data: UserData) => {
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
    const user = await prisma.user.delete({
        where: { id },
    });
    console.log("Deleted user:", user);
    return user;
}