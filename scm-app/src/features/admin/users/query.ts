import { CreateUserData, UpdateUserData, UserData, UserRow } from "./type";

export const getUsers = async (): Promise<UserRow[]> => {
    const response = await fetch(`/api/admin/users`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch users");
    }

    return response.json();
};

// Get user by ID
export const getUserById = async (id: string) => {
    const response = await fetch(`/api/admin/users/?id=${id}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch user");
    }
    return response.json();
};

// Create a new user
export const createUser = async (data: CreateUserData) => {
    const response = await fetch(`/api/admin/users`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create user");
    }
    return response.json();
};

// Update an existing user
export const updateUser = async ({ id, data }: UpdateUserData) => {
    const response = await fetch(`/api/admin/users/?id=${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update user");
    }
    return response.json();
};

// Delete a user
export const deleteUser = async (id: string) => {
    const response = await fetch(`/api/admin/users/?id=${id}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete user");
    }
    return response.json();
};
