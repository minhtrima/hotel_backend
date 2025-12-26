import React from "react";

export default function LoadingPage() {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-60 flex items-center justify-center z-50">
      <div className="w-16 h-16 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
    </div>
  );
}
