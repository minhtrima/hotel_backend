// Permission constants
export const ROLES = {
  ADMIN: "admin",
  CUSTOMER: "customer",
  STAFF: "staff",
};

export const STAFF_POSITIONS = {
  MANAGER: "manager",
  RECEPTIONIST: "receptionist",
  HOUSEKEEPING: "housekeeping",
};

// Define permissions for each role and position
export const PERMISSIONS = {
  [ROLES.ADMIN]: {
    canViewHome: true,
    canViewStatistics: true,
    canViewCustomer: true,
    canViewRoom: true,
    canViewType: true,
    canViewBooking: true,
    canViewStaff: true,
    canViewService: true,
    canViewInventory: true,
    canViewTask: true,
    canViewImages: true,
    canCreateCustomer: true,
    canEditCustomer: true,
    canDeleteCustomer: true,
    canCreateRoom: true,
    canEditRoom: true,
    canDeleteRoom: true,
    canCreateType: true,
    canEditType: true,
    canDeleteType: true,
    canCreateBooking: true,
    canEditBooking: true,
    canDeleteBooking: true,
    canCreateStaff: true,
    canEditStaff: true,
    canDeleteStaff: true,
    canCreateService: true,
    canEditService: true,
    canDeleteService: true,
    canCreateInventory: true,
    canEditInventory: true,
    canDeleteInventory: true,
    canCreateTask: true,
    canEditTask: true,
    canDeleteTask: true,
    canCreateImages: true,
    canEditImages: true,
    canDeleteImages: true,
    canViewAllStatistics: true,
    canViewIssueReports: true,
    canAddIssueReport: true,
    canViewReview: true,
  },

  [ROLES.CUSTOMER]: {
    // Customers should get 404 - no permissions
  },

  [ROLES.STAFF]: {
    [STAFF_POSITIONS.MANAGER]: {
      canViewHome: true,
      canViewStatistics: true,
      canViewCustomer: true,
      canViewRoom: true,
      canViewType: true,
      canViewBooking: true,
      canViewStaff: true,
      canViewService: true,
      canViewInventory: true,
      canViewTask: true,
      canViewImages: true,
      canCreateCustomer: true,
      canEditCustomer: true,
      canDeleteCustomer: true,
      canCreateRoom: true,
      canEditRoom: true,
      canDeleteRoom: true,
      canCreateType: true,
      canEditType: true,
      canDeleteType: true,
      canCreateBooking: true,
      canEditBooking: true,
      canDeleteBooking: true,
      canCreateStaff: true,
      canEditStaff: true,
      canDeleteStaff: true,
      canCreateService: true,
      canEditService: true,
      canDeleteService: true,
      canCreateInventory: true,
      canEditInventory: true,
      canDeleteInventory: true,
      canCreateTask: true,
      canEditTask: true,
      canDeleteTask: true,
      canCreateImages: true,
      canEditImages: true,
      canDeleteImages: true,
      canViewAllStatistics: true,
      canViewIssueReports: true,
      canAddIssueReport: true,
      canViewReview: true,
    },

    [STAFF_POSITIONS.RECEPTIONIST]: {
      canViewHome: true,
      canViewStatistics: true,
      canViewCustomer: true,
      canViewRoom: true,
      canViewType: true,
      canViewBooking: true,
      canViewService: true,
      canViewTask: true,
      canCreateCustomer: true,
      canEditCustomer: true,
      canCreateBooking: true,
      canEditBooking: true,
      canEditService: true,
      canEditTask: true, // Can update task status
      canViewAllStatistics: false, // Limited statistics access
    },

    [STAFF_POSITIONS.HOUSEKEEPING]: {
      canViewHome: true,
      canViewTask: true,
      canViewInventory: true,
      canEditTask: true, // Can update task status
      canEditInventory: true, // Can update inventory quantities
      canViewAllStatistics: false,
    },
  },
};

/**
 * Check if user has specific permission
 * @param {Object} user - User object containing role and staffId
 * @param {string} permission - Permission to check
 * @returns {boolean} - Whether user has permission
 */
export const hasPermission = (user, permission) => {
  if (!user) return false;

  const { role, staffId } = user;

  // Admin has all permissions
  if (role === ROLES.ADMIN) {
    return PERMISSIONS[ROLES.ADMIN][permission] || false;
  }

  // Customer has no permissions (should get 404)
  if (role === ROLES.CUSTOMER) {
    return false;
  }

  // Staff permissions based on position
  if (role === ROLES.STAFF && staffId && staffId.position) {
    const position = staffId.position.toLowerCase();
    const staffPermissions = PERMISSIONS[ROLES.STAFF][position];
    return staffPermissions ? staffPermissions[permission] || false : false;
  }

  return false;
};

/**
 * Check if user can access a specific route
 * @param {Object} user - User object
 * @param {string} routePath - Route path to check
 * @returns {boolean} - Whether user can access route
 */
export const canAccessRoute = (user, routePath) => {
  if (!user) return false;

  // Remove leading slash and get route name
  const route = routePath.replace(/^\//, "").split("/")[0];

  switch (route) {
    case "":
    case "home":
      return hasPermission(user, "canViewHome");
    case "statistics":
      return hasPermission(user, "canViewStatistics");
    case "customer":
      return hasPermission(user, "canViewCustomer");
    case "room":
      return hasPermission(user, "canViewRoom");
    case "type":
      return hasPermission(user, "canViewType");
    case "booking":
      return hasPermission(user, "canViewBooking");
    case "staff":
      return hasPermission(user, "canViewStaff");
    case "service":
      return hasPermission(user, "canViewService");
    case "inventory":
      return hasPermission(user, "canViewInventory");
    case "task":
      return hasPermission(user, "canViewTask");
    case "issue-report":
      return hasPermission(user, "canViewIssueReports");
    case "images":
      return hasPermission(user, "canViewImages");
    case "review":
      return hasPermission(user, "canViewReview");
    default:
      return false;
  }
};

/**
 * Get user's position for display purposes
 * @param {Object} user - User object
 * @returns {string} - User's position or role
 */
export const getUserPosition = (user) => {
  if (!user) return "";

  if (user.role === ROLES.ADMIN) {
    return "Quản trị viên";
  }

  if (user.role === ROLES.STAFF && user.staffId && user.staffId.position) {
    const position = user.staffId.position.toLowerCase();
    switch (position) {
      case STAFF_POSITIONS.MANAGER:
        return "Quản lý";
      case STAFF_POSITIONS.RECEPTIONIST:
        return "Lễ tân";
      case STAFF_POSITIONS.HOUSEKEEPING:
        return "Dọn phòng";
      default:
        return "Nhân viên";
    }
  }

  if (user.role === ROLES.CUSTOMER) {
    return "Khách hàng";
  }

  return "";
};
