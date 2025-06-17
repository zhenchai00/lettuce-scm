import { useForm } from "react-hook-form";
import { toast } from "sonner";

export type ApiError = {
    error?: string;
    message?: string;
    issues?: Array<{
        path: string[];
        message: string;
    }>;
};

export const useGenericErrorHandler = <T extends object>(
    form: ReturnType<typeof useForm<T>>
) => {
    return (error: any) => {
        const apiError = error.response?.data as ApiError;

        if (apiError.issues) {
            apiError.issues.forEach((issue) => {
                const field = issue.path.join(".");
                form.setError(field as any, {
                    type: "manual",
                    message: issue.message,
                });
            });
            toast.error("Validation Failed: Please fix the highlighted fields.");
        } else if (apiError.error || apiError.message) {
            toast.error(apiError.error || apiError.message || "Error: Something went wrong.");
        } else {
            toast.error("Unexpected Error: Failed to complete request.");
        }
    };
};