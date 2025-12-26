import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function Layout() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar (fixed width) */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col ml-64">
        <Header />
        <main className="flex-1 p-6 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
