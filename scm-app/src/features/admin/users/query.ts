import { CreateUserData, UpdateUserData, UserRow } from "./type";
import { apiClient } from "@/lib/axios/api-client";

export const getUsers = async (): Promise<UserRow[]> => {
    const response = await apiClient.get<UserRow[]>("/api/admin/users");
    return response.data;
};

// Get user by ID
export const getUserById = async (id: string) => {
    const response = await apiClient.get(`/api/admin/users/?id=${id}`);
    return response.data;
};

// Create a new user
export const createUser = async (data: CreateUserData) => {
    const response = await apiClient.post("/api/admin/users", data);
    return response.data;
};

// Update an existing user
export const updateUser = async ({ id, data }: UpdateUserData) => {
    const response = await apiClient.put(`/api/admin/users/?id=${id}`, data);
    return response.data;
};

// Delete a user
export const deleteUser = async (id: string) => {
    const response = await apiClient.delete(`/api/admin/users/?id=${id}`);
    return response.data;
};


// fabric enroll user 
export const fabricEnrollUser = async (data: {
    enrollmentId: string;
    enrollmentSecret: string;
    affiliation: string;
    role: string;
    msp: string;
}) => {
    const response = await apiClient.post("/api/admin/fabric-users", {
        enroll: true,
        ...data,
    });
    return response.data;
};

// fabric revoke user
export const fabricRevokeUser = async (data: {
    enrollmentId: string;
    msp: string;
}) => {
    const response = await apiClient.post("/api/admin/fabric-users", {
        revoke: true,
        ...data,
    });
    return response.data;
};
