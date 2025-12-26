import React, { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { usePermissions } from "../hooks/usePermissions";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const permissions = usePermissions();

  const [openMenus, setOpenMenus] = useState({});

  const toggleSubMenu = (label) => {
    setOpenMenus((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  const navItems = useMemo(() => {
    const items = [];

    // Trang chủ
    if (permissions.canViewHome) {
      items.push({ label: "Trang chủ", path: "/home" });
    }

    // Khách hàng
    if (permissions.canViewCustomer) {
      const customerItems = [
        { label: "Tổng quan khách hàng", path: "/customer" },
      ];
      if (permissions.canCreateCustomer) {
        customerItems.push({ label: "Thêm khách hàng", path: "/customer/add" });
      }
      items.push({
        label: "Khách hàng",
        subItems: customerItems,
      });
    }

    // Phòng và Loại phòng
    if (permissions.canViewRoom || permissions.canViewType) {
      const roomItems = [];
      if (permissions.canViewRoom) {
        roomItems.push({ label: "Tổng quan phòng", path: "/room" });
        if (permissions.canCreateRoom) {
          roomItems.push({ label: "Thêm phòng", path: "/room/add" });
        }
      }
      if (permissions.canViewType) {
        roomItems.push({ label: "Loại phòng", path: "/type" });
        if (permissions.canCreateType) {
          roomItems.push({ label: "Thêm loại phòng", path: "/type/add" });
        }
      }
      items.push({
        label: "Phòng",
        subItems: roomItems,
      });
    }

    // Đặt phòng
    if (permissions.canViewBooking) {
      items.push({ label: "Đặt phòng", path: "/booking" });
    }

    // Nhân viên
    if (permissions.canViewStaff) {
      const staffItems = [{ label: "Tổng quan nhân viên", path: "/staff" }];
      if (permissions.canCreateStaff) {
        staffItems.push({ label: "Thêm nhân viên", path: "/staff/add" });
      }
      items.push({
        label: "Nhân viên",
        subItems: staffItems,
      });
    }

    // Dịch vụ
    if (permissions.canViewService) {
      const serviceItems = [{ label: "Tổng quan dịch vụ", path: "/service" }];
      if (permissions.canCreateService) {
        serviceItems.push({ label: "Thêm dịch vụ", path: "/service/add" });
      }
      items.push({
        label: "Dịch vụ",
        subItems: serviceItems,
      });
    }

    // Kho
    if (permissions.canViewInventory) {
      const inventoryItems = [{ label: "Kho vật tư", path: "/inventory" }];
      if (permissions.canCreateInventory) {
        inventoryItems.push({
          label: "Thêm vật tư",
          path: "/inventory/create",
        });
      }
      inventoryItems.push({
        label: "Phiếu vật tư",
        path: "/inventory/receipt",
      });
      inventoryItems.push({
        label: "Thêm phiếu vật tư",
        path: "/inventory/receipt/create",
      });
      items.push({
        label: "Vật tư",
        subItems: inventoryItems,
      });
    }

    // Công việc
    if (permissions.canViewTask) {
      const taskItems = [{ label: "Quản lý công việc", path: "/task" }];
      if (permissions.canCreateTask) {
        taskItems.push({ label: "Tạo công việc", path: "/task/create" });
      }
      items.push({
        label: "Buồng phòng",
        subItems: taskItems,
      });
    }

    // Sự cố (mục lớn, chỉ admin và manager)
    if (
      permissions.userRole === "admin" ||
      (permissions.userRole === "staff" &&
        permissions.userPosition === "manager")
    ) {
      items.push({
        label: "Sự cố",
        subItems: [
          { label: "Quản lý sự cố", path: "/issue-report" },
          { label: "Thêm sự cố", path: "/issue-report/add" },
        ],
      });
    }

    // Hình ảnh
    if (permissions.canViewImages) {
      const imageItems = [{ label: "Quản lý hình ảnh", path: "/images" }];
      if (permissions.canCreateImages) {
        imageItems.push({ label: "Tải lên hình ảnh", path: "/images/upload" });
      }
      items.push({
        label: "Hình ảnh",
        subItems: imageItems,
      });
    }

    // Thống kê
    if (permissions.canViewStatistics) {
      items.push({ label: "Thống kê", path: "/statistics" });
    }

    // Đánh giá
    if (permissions.canViewReview) {
      items.push({ label: "Đánh giá", path: "/review" });
    }

    return items;
  }, [permissions]);

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <aside className="w-64 h-screen bg-white shadow-md p-4 fixed top-0 left-0 z-10 overflow-y-auto">
      <div
        className="text-2xl font-bold text-blue-600 mb-6 cursor-pointer"
        onClick={() => navigate("/")}
      >
        HaiAuHotel
      </div>
      <nav className="flex flex-col gap-2">
        {navItems.map((item) =>
          item.subItems ? (
            <div key={item.label}>
              <button
                onClick={() => toggleSubMenu(item.label)}
                className={`w-full flex justify-between items-center px-2 py-2 text-left font-medium transition cursor-pointer text-base ${
                  isActive(item.subItems[0].path)
                    ? "text-blue-600"
                    : "text-gray-700 hover:text-blue-600"
                }`}
              >
                {item.label}
                {openMenus[item.label] ? (
                  <FaChevronUp className="text-xs" />
                ) : (
                  <FaChevronDown className="text-xs" />
                )}
              </button>
              {item.subItems && (
                <div
                  className={`ml-4 mt-1 flex flex-col gap-1 overflow-hidden transition-all duration-300 ease-in-out ${
                    openMenus[item.label] ? "max-h-40" : "max-h-0"
                  }`}
                >
                  {item.subItems.map((sub) => (
                    <button
                      key={sub.path}
                      onClick={() => navigate(sub.path)}
                      className={`text-sm text-left px-2 py-1 rounded transition cursor-pointer ${
                        location.pathname === sub.path
                          ? "text-blue-600 font-semibold"
                          : "text-gray-600 hover:text-blue-600"
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`px-2 py-2 text-left font-medium transition cursor-pointer text-base ${
                item.path === "/home" // Chỉ áp dụng riêng cho Trang chủ
                  ? location.pathname === "/home"
                    ? "text-blue-600"
                    : "text-gray-700 hover:text-blue-600"
                  : isActive(item.path)
                  ? "text-blue-600"
                  : "text-gray-700 hover:text-blue-600"
              }`}
            >
              {item.label}
            </button>
          )
        )}
      </nav>
    </aside>
  );
}
