import { QueryClient } from "@tanstack/react-query";
import { ContactFormData } from "./types/contact";

export const queryClient = new QueryClient();

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
