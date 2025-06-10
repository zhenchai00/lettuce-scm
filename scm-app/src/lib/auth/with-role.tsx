import { FC, ReactNode } from 'react';
import { useRequireRole } from '@/hooks/use-requireRole';

interface WithRoleProps {
  allowedRoles: readonly string[];
  children: ReactNode;
}

const WithRole: FC<WithRoleProps> = ({ allowedRoles, children }) => {
  useRequireRole(allowedRoles);

  return <>{children}</>;
};

export default WithRole;