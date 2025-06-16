import { apiClient } from "@/lib/axios/api-client";

export const getUserById = async (id: string) => {
    const response = await apiClient.get(`/api/admin/users/?email=${id}`);
    return response.data;
};

export const updateExistingUser = async (id: string, data: any) => {
    console.log("Updating user with ID:", id, "and data:", data);
    const response = await apiClient.put(`/api/admin/users?id=${id}`, data);
    return response.data;
}