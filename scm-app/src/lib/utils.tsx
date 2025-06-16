import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => {
    return twMerge(clsx(inputs));
};

export const WithRoleGuard = (Component: any, allowedRole: string[]) => {
    return (props: any) => {
        const { user } = props.session || {};
        if (!user && !allowedRole.includes(user.role)) {
            return <p>Access Denied</p>;
        }
        return <Component {...props} />;
    };
};

export const getDirtyVlaues = <T extends Record<string, any>>(
    dirtyFields: Partial<Record<keyof T, boolean>>,
    values: T
): Partial<T> => {
    const result: Partial<T> = {};

    Object.keys(dirtyFields).forEach((key) => {
        const typedKey = key as keyof T;
        if (dirtyFields[typedKey]) {
            result[typedKey] = values[typedKey];
        }
    });

    return result;
};
