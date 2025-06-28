import { apiClient } from "@/lib/axios/api-client";
import { CreateProductBatchData, UpdateProductBatchData } from "./type";

export const getProductBatches = async () => {
    const response = await apiClient.get("/api/farmer/product-batches");
    return response.data;
};

export const getProductBatchById = async (id: string) => {
    const response = await apiClient.get(
        `/api/farmer/product-batches?id=${id}`
    );
    return response.data;
};

export const getProductBatchByUserId = async (userId: string) => {
    const response = await apiClient.get(
        `/api/farmer/product-batches?userId=${userId}`
    );
    return response.data;
};

export const createProductBatch = async (data: CreateProductBatchData) => {
    const response = await apiClient.post("/api/farmer/product-batches", data);
    return response.data;
};

export const updateProductBatch = async ({
    id,
    data,
}: UpdateProductBatchData) => {
    const response = await apiClient.put(
        `/api/farmer/product-batches?id=${id}`,
        data
    );
    return response.data;
};

export const deleteProductBatch = async (id: string) => {
    const response = await apiClient.delete(
        `/api/farmer/product-batches?id=${id}`
    );
    return response.data;
};

export const getFarmerNameQuery = async (farmerId: string | null) => {
    const response = await apiClient.get(`/api/farmer/users?id=${farmerId}`);
    return response.data;
};

export const getFarmerList = async () => {
    const response = await apiClient.get("/api/farmer/users?role=FARMER");
    return response.data;
}