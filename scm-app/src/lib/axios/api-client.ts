import axios from "axios";
import { API_URL } from "@/config";

const apiClient = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});
export { apiClient };
