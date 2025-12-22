import React, { useEffect, useState } from "react";
import CalendarMonth from "./CalendarMonth";
import { createPortal } from "react-dom";

const showDate = (date) => {
  if (!date) return "";
  let day = date.getDate();
  if (day < 10) day = "0" + day;
  let month = date.getMonth() + 1;
  if (month < 10) month = "0" + month;
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// --- DatePicker component - chỉ để chọn ngày ---
export default function DatePicker({
  isOpen,
  onClose,
  onDateSelect,
  startDay: initialStartDay,
  endDay: initialEndDay,
}) {
  const today = new Date();
  const [leftMonth, setLeftMonth] = useState(today.getMonth());
  const [leftYear, setLeftYear] = useState(today.getFullYear());
  const [startDay, setStartDay] = useState(initialStartDay);
  const [endDay, setEndDay] = useState(initialEndDay);
  const [selectingStart, setSelectingStart] = useState(true);
  const [hoverDay, setHoverDay] = useState(null);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "auto";
  }, [isOpen]);

  if (!isOpen) return null;

  // Right calendar is always next month of left
  const rightMonth = (leftMonth + 1) % 12;
  const rightYear = leftMonth === 11 ? leftYear + 1 : leftYear;

  const handleDayClick = (dateObj) => {
    const clickedDate = new Date(
      dateObj.year,
      dateObj.month,
      dateObj.day,
      0,
      0,
      0,
      0
    );

    if (!startDay || (startDay && endDay)) {
      setStartDay(clickedDate);
      setEndDay(null);
      setSelectingStart(false);
    } else if (!endDay) {
      if (clickedDate < startDay) {
        setStartDay(clickedDate);
        setEndDay(null);
        setSelectingStart(false);
      } else if (clickedDate.getTime() === startDay.getTime()) {
        setEndDay(clickedDate);
        setSelectingStart(true);
      } else {
        setEndDay(clickedDate);
        setSelectingStart(true);
      }
    }
  };

  const handlePrevMonth = () => {
    if (leftMonth === 0) {
      setLeftMonth(11);
      setLeftYear(leftYear - 1);
    } else {
      setLeftMonth(leftMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (leftMonth === 11) {
      setLeftMonth(0);
      setLeftYear(leftYear + 1);
    } else {
      setLeftMonth(leftMonth + 1);
    }
  };

  const handleOK = () => {
    if (startDay && endDay) {
      onDateSelect(startDay, endDay);
      onClose();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 relative max-w-4xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          className="absolute top-4 right-4 text-2xl text-gray-500 hover:text-gray-700 z-10 cursor-pointer"
          onClick={onClose}
        >
          ×
        </button>

        <div className="flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
            Chọn Ngày
          </h2>

          {/* Date Display */}
          <div className="flex gap-4 mb-6 text-center">
            <div className="px-4 py-2 bg-blue-50 rounded-lg">
              <label className="text-sm font-medium text-gray-600 block">
                Nhận phòng
              </label>
              <div className="text-lg font-semibold text-blue-600">
                {showDate(startDay) || "Chọn ngày"}
              </div>
            </div>
            <div className="px-4 py-2 bg-blue-50 rounded-lg">
              <label className="text-sm font-medium text-gray-600 block">
                Trả phòng
              </label>
              <div className="text-lg font-semibold text-blue-600">
                {showDate(endDay) || "Chọn ngày"}
              </div>
            </div>
          </div>

          {/* Calendar Navigation */}
          <div className="flex items-center justify-center mb-4 w-full max-w-2xl">
            <button
              onClick={handlePrevMonth}
              className="px-3 py-1 text-xl font-bold text-gray-600 hover:bg-gray-200 rounded transition cursor-pointer"
            >
              ‹
            </button>
            <div className="flex-1 text-center mx-4">
              <span className="text-lg font-semibold text-gray-800">
                Tháng {leftMonth + 1}, {leftYear} - Tháng {rightMonth + 1},{" "}
                {rightYear}
              </span>
            </div>
            <button
              onClick={handleNextMonth}
              className="px-3 py-1 text-xl font-bold text-gray-600 hover:bg-gray-200 rounded transition cursor-pointer"
            >
              ›
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="flex gap-4">
            <CalendarMonth
              month={leftMonth}
              year={leftYear}
              onDayClick={handleDayClick}
              startDay={startDay}
              endDay={endDay}
              hoverDay={hoverDay}
              setHoverDay={setHoverDay}
              selectingStart={selectingStart}
            />
            <CalendarMonth
              month={rightMonth}
              year={rightYear}
              onDayClick={handleDayClick}
              startDay={startDay}
              endDay={endDay}
              hoverDay={hoverDay}
              setHoverDay={setHoverDay}
              selectingStart={selectingStart}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-6">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleOK}
              disabled={!startDay || !endDay}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.getElementById("modal-root")
  );
}
