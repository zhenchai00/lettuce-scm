import { FC, ReactNode } from 'react';
import { useRequireRole } from '@/hooks/use-requireRole';

interface WithRolePageProps {
  allowedRoles: readonly string[];
  children: ReactNode;
}

/**
 * Page protection component that checks if user has the required role
 * @param param0 - The props for the component.
 * @returns The rendered component or null if the user does not have permission.
 */
const WithRolePage: FC<WithRolePageProps> = ({ allowedRoles, children }) => {
  const isValid = useRequireRole(allowedRoles);
  if (!isValid) {
    return null;
  }

  return <>{children}</>;
};

export default WithRolePage;