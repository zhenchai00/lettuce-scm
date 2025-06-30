import { apiClient } from "@/lib/axios/api-client";
import { ContactFormData } from "./type";

export const submitContactForm = async (data: ContactFormData) => {
    const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit contact form");
    }
    return response.json();
};

export const getLettuceTrackingInfo = async (trackingNumber: string) => {
    const url = `/api/public/tracking`;
    const params = { id: trackingNumber };
    try {
        const response = await apiClient.get(url, { params });
        return response.data; // ← don’t call `.json()` on response.data!
    } catch (err: any) {
        console.error(
            "[getLettuceTrackingInfo] ERROR status:",
            err.response?.status,
            "data:",
            err.response?.data
        );
        throw err;
    }
};

export const getShopProducts = async () => {
    const url = `/api/public/shop`;
    try {
        const response = await apiClient.get(url);
        return response.data; // ← don’t call `.json()` on response.data!
    } catch (err: any) {
        console.error(
            "[getShopProducts] ERROR status:",
            err.response?.status,
            "data:",
            err.response?.data
        );
        throw err;
    }
}