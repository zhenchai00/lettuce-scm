import { apiClient } from "@/lib/axios/api-client";

export const getContacts = async () => {
    const response = await apiClient.get("/api/public/contact");
    return response.data;
}