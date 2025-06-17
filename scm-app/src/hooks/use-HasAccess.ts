import { useSession } from "next-auth/react";

/**
 * Custom hook to check if the user has access to the resource (components) based on their role.
 */
export const useHasAccess = (allowedRoles: string[]): boolean => {
  const { data: session } = useSession();
  const userRole = session?.user?.role;

  return Boolean(userRole && allowedRoles.includes(userRole));
};