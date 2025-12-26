import { Routes, Route, Navigate } from "react-router-dom";

// component
import RoleBasedRoute from "./components/RoleBasedRoute";

//pages
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Home from "./pages/Home";
import Staff from "./pages/Staff";
import StaffAdd from "./pages/StaffAdd";
import StaffDetail from "./pages/StaffDetail";
import Room from "./pages/Room";
import RoomAdd from "./pages/RoomAdd";
import RoomDetail from "./pages/RoomDetail";
import Customer from "./pages/Customer";
import CustomerAdd from "./pages/CustomerAdd";
import CustomerDetail from "./pages/CustomerDetail";
import Booking from "./pages/Booking";
import BookingAdd from "./pages/BookingAdd";
import Type from "./pages/Type";
import TypeAdd from "./pages/TypeAdd";
import BookingSummary from "./pages/BookingSummary";
import BookingDetail from "./pages/BookingDetail";
import Payment from "./pages/Payment";
import Layout from "./components/Layout";
import Service from "./pages/Service";
import ServiceAdd from "./pages/ServiceAdd";
import ServiceDetail from "./pages/ServiceDetail";
import ServiceImage from "./pages/ServiceImage";
import TypeDetail from "./pages/TypeDetail";
import TypeImage from "./pages/TypeImage";
import ServiceForBooking from "./pages/ServiceForBooking";
import Statistics from "./pages/Statistics";
import Inventory from "./pages/Inventory";
import InventoryAdd from "./pages/InventoryAdd";
import InventoryDetail from "./pages/InventoryDetail";
import InventoryEdit from "./pages/InventoryEdit";
import Task from "./pages/Task";
import TaskAdd from "./pages/TaskAdd";
import TaskDetail from "./pages/TaskDetail";
import IssueReportManagement from "./pages/IssueReportManagement";
import IssueReport from "./pages/IssueReport";
import IssueReportDetail from "./pages/IssueReportDetail";
import Unauthorized from "./pages/Unauthorized";
import ActivateAccount from "./pages/ActivateAccount";
import ChangePassword from "./pages/ChangePassword";
import ImageManagement from "./pages/ImageManagement";
import ImageUpload from "./pages/ImageUpload";
import ImageDetail from "./pages/ImageDetail";
import ImageEdit from "./pages/ImageEdit";
import InventorySlipList from "./pages/InventorySlipList";
import InventorySlipAdd from "./pages/InventorySlipAdd";
import InventorySlipDetail from "./pages/InventorySlipDetail";
import Receipt from "./pages/Receipt";
import Review from "./pages/Review";
import ReviewDetail from "./pages/ReviewDetail";
import ChangeRoom from "./pages/ChangeRoom";

function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/receipt" element={<Receipt />} />
        <Route element={<RoleBasedRoute />}>
          <Route element={<Layout />}>
            <Route path="/home" element={<Home />} />
            <Route path="/" element={<Navigate to="/home" />} />
            <Route path="/staff" element={<Staff />} />
            <Route path="/staff/add" element={<StaffAdd />} />
            <Route path="/staff/:staffId" element={<StaffDetail />} />
            <Route path="/room" element={<Room />} />
            <Route path="/room/add" element={<RoomAdd />} />
            <Route path="/room/:roomId" element={<RoomDetail />} />
            <Route path="/type" element={<Type />} />
            <Route path="/type/add" element={<TypeAdd />} />
            <Route path="/type/:typeId" element={<TypeDetail />} />
            <Route path="/type/:typeId/images" element={<TypeImage />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/booking/add" element={<BookingAdd />} />
            <Route path="/booking/summary" element={<BookingSummary />} />
            <Route path="/booking/:bookingId" element={<BookingDetail />} />
            <Route path="/booking/:bookingId/payment" element={<Payment />} />
            <Route
              path="/booking/:bookingId/services"
              element={<ServiceForBooking />}
            />
            <Route
              path="/booking/:bookingId/change-room"
              element={<ChangeRoom />}
            />
            <Route path="/customer" element={<Customer />} />
            <Route path="/customer/add" element={<CustomerAdd />} />
            <Route path="/customer/:customerId" element={<CustomerDetail />} />
            <Route path="/service" element={<Service />} />
            <Route path="/service/add" element={<ServiceAdd />} />
            <Route path="/service/:serviceId" element={<ServiceDetail />} />
            <Route
              path="/service/:serviceId/images"
              element={<ServiceImage />}
            />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/inventory/create" element={<InventoryAdd />} />
            <Route path="/inventory/:id" element={<InventoryDetail />} />
            <Route path="/inventory/:id/edit" element={<InventoryEdit />} />
            <Route path="/inventory/receipt" element={<InventorySlipList />} />
            <Route
              path="/inventory/receipt/create"
              element={<InventorySlipAdd />}
            />
            <Route
              path="/inventory/receipt/:id"
              element={<InventorySlipDetail />}
            />
            <Route path="/task" element={<Task />} />
            <Route path="/task/create" element={<TaskAdd />} />
            <Route path="/task/:id" element={<TaskDetail />} />
            <Route path="/issue-report" element={<IssueReportManagement />} />
            <Route path="/issue-report/add" element={<IssueReport />} />
            <Route path="/issue-report/:id" element={<IssueReportDetail />} />
            <Route path="/images" element={<ImageManagement />} />
            <Route path="/images/upload" element={<ImageUpload />} />
            <Route path="/images/:id" element={<ImageDetail />} />
            <Route path="/images/:id/edit" element={<ImageEdit />} />
            <Route path="/review" element={<Review />} />
            <Route path="/review/:reviewId" element={<ReviewDetail />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Route>
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/activate" element={<ActivateAccount />} />
      </Routes>
    </>
  );
}

export default App;
