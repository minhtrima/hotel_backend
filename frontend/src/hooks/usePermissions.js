import { useSelector } from "react-redux";
import {
  hasPermission,
  canAccessRoute,
  getUserPosition,
} from "../utils/permissions";

export const usePermissions = () => {
  const { currentUser } = useSelector((state) => state.user);

  // Extract the actual user object
  const user = currentUser?.user || currentUser;

  const checkPermission = (permission) => {
    return hasPermission(user, permission);
  };

  const checkRouteAccess = (routePath) => {
    return canAccessRoute(user, routePath);
  };

  // Lấy role gốc (admin, staff, customer)
  const userRole = user?.role || "";
  // Lấy position chuẩn hóa (manager, receptionist, housekeeping) cho staff, rỗng cho admin/customer
  let userPosition = "";
  if (userRole === "staff" && user.staffId && user.staffId.position) {
    userPosition = user.staffId.position.toLowerCase();
  }

  return {
    user: user,
    userRole,
    userPosition,
    checkPermission,
    checkRouteAccess,
    // Specific permissions for easy access
    canViewHome: checkPermission("canViewHome"),
    canViewStatistics: checkPermission("canViewStatistics"),
    canViewCustomer: checkPermission("canViewCustomer"),
    canViewRoom: checkPermission("canViewRoom"),
    canViewType: checkPermission("canViewType"),
    canViewBooking: checkPermission("canViewBooking"),
    canViewStaff: checkPermission("canViewStaff"),
    canViewService: checkPermission("canViewService"),
    canViewInventory: checkPermission("canViewInventory"),
    canViewTask: checkPermission("canViewTask"),
    canViewImages: checkPermission("canViewImages"),
    // CRUD permissions
    canCreateCustomer: checkPermission("canCreateCustomer"),
    canEditCustomer: checkPermission("canEditCustomer"),
    canDeleteCustomer: checkPermission("canDeleteCustomer"),
    canCreateRoom: checkPermission("canCreateRoom"),
    canEditRoom: checkPermission("canEditRoom"),
    canDeleteRoom: checkPermission("canDeleteRoom"),
    canCreateType: checkPermission("canCreateType"),
    canEditType: checkPermission("canEditType"),
    canDeleteType: checkPermission("canDeleteType"),
    canCreateBooking: checkPermission("canCreateBooking"),
    canEditBooking: checkPermission("canEditBooking"),
    canDeleteBooking: checkPermission("canDeleteBooking"),
    canCreateStaff: checkPermission("canCreateStaff"),
    canEditStaff: checkPermission("canEditStaff"),
    canDeleteStaff: checkPermission("canDeleteStaff"),
    canCreateService: checkPermission("canCreateService"),
    canEditService: checkPermission("canEditService"),
    canDeleteService: checkPermission("canDeleteService"),
    canCreateInventory: checkPermission("canCreateInventory"),
    canEditInventory: checkPermission("canEditInventory"),
    canDeleteInventory: checkPermission("canDeleteInventory"),
    canCreateTask: checkPermission("canCreateTask"),
    canEditTask: checkPermission("canEditTask"),
    canDeleteTask: checkPermission("canDeleteTask"),
    canCreateImages: checkPermission("canCreateImages"),
    canEditImages: checkPermission("canEditImages"),
    canDeleteImages: checkPermission("canDeleteImages"),
    canViewAllStatistics: checkPermission("canViewAllStatistics"),
    canViewReview: checkPermission("canViewReview"),
  };
};
