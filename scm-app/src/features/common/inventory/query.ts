import { apiClient } from "@/lib/axios/api-client"
import { InventoryRow } from "./type";

export const getInventory = async () => {
    const response = await apiClient.get("/api/inventory")
    return response.data
};

export const getInventoryById = async (id: string) => {
    const response = await apiClient.get(`/api/inventory?id=${id}`)
    return response.data
};

export const getInventoryByUserId = async (userId: string) => {
    const response = await apiClient.get(`/api/inventory?userId=${userId}`)
    return response.data
};

export const createInventory = async (data: InventoryRow) => {
    const response = await apiClient.post("/api/inventory", data)
    return response.data
};

export const updateInventory = async (id: string, data: InventoryRow) => {
    const response = await apiClient.put(`/api/inventory?id=${id}`, data)
    return response.data
};

export const deleteInventory = async (id: string) => {
    const response = await apiClient.delete(`/api/inventory?id=${id}`)
    return response.data
};

export const getUserById = async (id: string) => {
    const response = await apiClient.get(`/api/admin/users?id=${id}`)
    return response.data
}