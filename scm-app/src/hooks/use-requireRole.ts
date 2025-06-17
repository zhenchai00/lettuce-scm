import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

/**
 * Custom hook to protect pages based on user roles.
 * This hook checks if the user has one of the allowed roles and redirects them if they do not.
 * If the user is not logged in, they will be redirected to the login page.
 * If the user does not have the required role, they will be redirected to a 403 Forbidden page.
 */
export const useRequireRole = (allowedRoles: readonly string[]): boolean => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.replace('/auth/login');
      return;
    }

    const userRole = session.user?.role;
    if (!userRole ||!allowedRoles.includes(userRole)) {
      router.replace('/403');
    }
  }, [status, session, router, allowedRoles]);

  return Boolean(session && allowedRoles.includes(session.user?.role));
};