import axios from "axios";
import { API_URL } from "@/config";

const apiClient = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const message = error.response?.data?.message || error.response?.data.error || error.message || "An unexpected error occurred.";
        return Promise.reject(new Error(message));
    }
);

export { apiClient };
