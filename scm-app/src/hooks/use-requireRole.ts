import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export const useRequireRole = (allowedRoles: readonly string[]): void => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.replace('/auth/login');
      return;
    }

    if (!allowedRoles.includes(session.user.role)) {
      router.replace('/403');
    }
  }, [status, session, router, allowedRoles]);
};