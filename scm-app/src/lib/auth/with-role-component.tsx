import { useHasAccess } from "@/hooks/use-HasAccess";
import { FC } from "react";

interface WithRoleComponentProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

const WithRoleComponent: FC<WithRoleComponentProps> = ({ allowedRoles, children }) => {
  const hasAccess = useHasAccess(allowedRoles);

  return <>{hasAccess ? children : null}</>;
};

export default WithRoleComponent;