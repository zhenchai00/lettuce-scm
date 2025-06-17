import { apiClient } from "@/lib/axios/api-client";

export const getContacts = async () => {
    const response = await apiClient.get("/api/contact");
    return response.data;
}