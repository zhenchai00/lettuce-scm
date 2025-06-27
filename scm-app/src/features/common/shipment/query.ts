import { apiClient } from "@/lib/axios/api-client";
import { useQuery } from "@tanstack/react-query";

export const getShipment = async () => {
    const response = await apiClient.get("/api/shipment");
    return response.data;
};

export const getShipmentById = async (id: string) => {
    const response = await apiClient.get(`/api/shipment?id=${id}`);
    return response.data;
};

export const getAllShipmentByUserId = async (userId: string) => {
    const response = await apiClient.get(`/api/shipment?userId=${userId}`);
    return response.data;
};

export const createShipment = async (data: any) => {
    const response = await apiClient.post("/api/shipment", data);
    return response.data;
};

export const updateShipment = async (id: string, data: any) => {
    const response = await apiClient.put(`/api/shipment?id=${id}`, data);
    return response.data;
};

export const deleteShipment = async (id: string) => {
    const response = await apiClient.delete(`/api/shipment?id=${id}`);
    return response.data;
};

// -----
export const getAvaliableProductBatches = async () => {
    const response = await apiClient.get(
        "/api/farmer/product-batches?avaliable=true"
    );
    return response.data;
};

export const getUsersByRole = async (role: string) => {
    const response = await apiClient.get(`/api/admin/users?role=${role}`);
    return response.data;
};

export const getUsersById = async (id: string) => {
    const response = await apiClient.get(`/api/admin/users?id=${id}`);
    return response.data;
};

export const getInventoryByRole = async (role: string) => {
    const response = await apiClient.get(`/api/inventory?role=${role}`);
    return response.data;
};

export const getInventories = async () => {
    const response = await apiClient.get("/api/inventory");
    return response.data;
};


// ----- custom query hooks -----
export const useInventoryByOwnedRole = (role: string) => {
    return useQuery({
        queryKey: ["inventory", role],
        queryFn: async () => await getInventoryByRole(role),
        enabled: !!role,
        refetchOnWindowFocus: false,
    })
};