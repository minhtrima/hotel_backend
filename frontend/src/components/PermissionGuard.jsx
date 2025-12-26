import { usePermissions } from "../hooks/usePermissions";

export default function PermissionGuard({
  children,
  permission,
  fallback = null,
  showMessage = false,
  message = "Bạn không có quyền truy cập chức năng này.",
}) {
  const permissions = usePermissions();

  if (!permissions.checkPermission(permission)) {
    if (showMessage) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-800">{message}</p>
            </div>
          </div>
        </div>
      );
    }
    return fallback;
  }

  return children;
}
