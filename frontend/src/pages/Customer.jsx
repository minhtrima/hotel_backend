import React, { useEffect, useState } from "react";
import DataTable from "../components/DataTable";
import LoadingPage from "../components/Loading";
import { useNavigate } from "react-router-dom";
import { GoArrowRight } from "react-icons/go";
import { usePermissions } from "../hooks/usePermissions";

export default function CustomerPage() {
  const navigate = useNavigate();
  const permissions = usePermissions();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCustomerData = async () => {
    setLoading(true);
    const response = await fetch("/api/customer");
    if (!response.ok) throw new Error("Failed to fetch customer data");

    const data = await response.json();
    if (!data.success) throw new Error("Failed to fetch customer data");

    return data.customers.map((customer) => ({
      id: customer._id,
      lastName: customer.lastName || customer.fullName?.split(" ")[0] || "",
      firstName:
        customer.firstName ||
        customer.fullName?.split(" ").slice(1).join(" ") ||
        "",
      email: customer.email,
      phoneNumber: customer.phoneNumber,
      identification: customer.identification,
      identificationNumber: customer.identificationNumber,
      nationality: customer.nationality,
      dateOfBirth: customer.dateOfBirth,
    }));
  };

  useEffect(() => {
    fetchCustomerData()
      .then((data) => {
        setCustomers(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load customers:", err);
        setError("Không thể tải dữ liệu khách hàng.");
        setLoading(false);
      });
  }, []);

  const reloadCustomers = async () => {
    setLoading(true);
    try {
      const data = await fetchCustomerData();
      setCustomers(data);
    } catch (err) {
      console.error("Failed to load customers:", err);
      setError("Không thể tải dữ liệu khách hàng.");
    } finally {
      setLoading(false);
    }
  };

  const extraHeaderContent = (
    <div className="flex space-x-3">
      {permissions.canCreateCustomer && (
        <button
          onClick={() => navigate("/customer/add")}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center space-x-2"
        >
          <span>+ Thêm khách hàng</span>
        </button>
      )}
      <button
        onClick={reloadCustomers}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Tải lại
      </button>
    </div>
  );

  // Calculate stats
  const stats = {
    total: customers.length,
    withEmail: customers.filter((customer) => customer.email).length,
    withPhone: customers.filter((customer) => customer.phoneNumber).length,
  };

  const columns = [
    { header: "Họ", accessorKey: "lastName" },
    { header: "Tên", accessorKey: "firstName" },
    { header: "Email", accessorKey: "email" },
    { header: "SĐT", accessorKey: "phoneNumber" },
    { header: "Quốc tịch", accessorKey: "nationality" },
    {
      header: "Ngày sinh",
      accessorKey: "dateOfBirth",
      cell: ({ getValue }) => {
        const dob = new Date(getValue());
        return dob.toLocaleDateString("vi-VN");
      },
    },
    {
      header: "Thao tác",
      id: "arrow",
      cell: ({ row }) => {
        const customerId = row.original.id;
        return (
          <div
            className="ml-auto cursor-pointer"
            onClick={() => navigate("/customer/" + customerId)}
          >
            <GoArrowRight className="w-5 h-5 text-gray-500" />
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Quản lý khách hàng
          </h1>
          <div className="flex space-x-4 mt-2 text-sm text-gray-600">
            <span>
              Tổng: <strong>{stats.total}</strong>
            </span>
            <span className="text-blue-600">
              Có email: <strong>{stats.withEmail}</strong>
            </span>
            <span className="text-green-600">
              Có SĐT: <strong>{stats.withPhone}</strong>
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingPage />
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : customers.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">Không có khách hàng nào.</p>
          {permissions.canCreateCustomer && (
            <button
              onClick={() => navigate("/customer/add")}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center space-x-2 mx-auto"
            >
              <span>+ Thêm khách hàng đầu tiên</span>
            </button>
          )}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={customers}
          extraHeaderContent={extraHeaderContent}
        />
      )}
    </div>
  );
}
