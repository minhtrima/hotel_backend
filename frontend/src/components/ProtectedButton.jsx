import { usePermissions } from "../hooks/usePermissions";

export default function ProtectedButton({
  permission,
  children,
  className,
  ...props
}) {
  const permissions = usePermissions();

  if (!permissions.checkPermission(permission)) {
    return null;
  }

  return (
    <button className={className} {...props}>
      {children}
    </button>
  );
}
