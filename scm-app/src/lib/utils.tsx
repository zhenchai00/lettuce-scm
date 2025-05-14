import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"


export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs))
}

export const WithRoleGuard = (Component: any, allowedRole: string[]) => {
  return (props: any) => {
    const { user } = props.session || {};
    if (!user && !allowedRole.includes(user.role)) {
      return (
        <p>Access Denied</p>
      );
    }
    return <Component {...props} />;
  }
}