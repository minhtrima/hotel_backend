import React, { useState } from "react";
import CalendarMonth from "./CalendarMonth";

const showDate = (date) => {
  if (!date) return "";
  let day = date.getDate();
  if (day < 10) day = "0" + day;
  let month = date.getMonth() + 1;
  if (month < 10) month = "0" + month;
  const year = date.getFullYear();
  return `${day} Tháng ${month}, ${year}`;
};

// --- Calendar component ---
export default function Calendar({ isOpen, onClose, onSubmit }) {
  const today = new Date();
  const [leftMonth, setLeftMonth] = useState(today.getMonth());
  const [leftYear, setLeftYear] = useState(today.getFullYear());
  const [startDay, setStartDay] = useState(null);
  const [endDay, setEndDay] = useState(null);
  const [selectingStart, setSelectingStart] = useState(true);
  const [hoverDay, setHoverDay] = useState(null);

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

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 ">
      <div className="flex gap-0 p-0 bg-white rounded shadow-lg items-stretch relative">
        {/* Close button for modal */}
        <button
          className="absolute top-3 right-3 text-2xl text-white hover:text-gray-700 z-10 cursor-pointer"
          onClick={onClose}
        >
          &times;
        </button>
        <div className="flex flex-col items-center justify-center px-8 py-6">
          <h2 className="text-3xl font-bold mb-6 text-center tracking-wide text-gray-800">
            ĐẶT PHÒNG
          </h2>
          <div className="flex gap-12">
            {/* Calendar header */}
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center mb-4 w-[700px]">
                <button
                  onClick={handlePrevMonth}
                  className="px-3 py-1 text-xl font-bold text-gray-600 hover:bg-gray-200 rounded transition cursor-pointer"
                >
                  {"<"}
                </button>
                <h3 className="font-semibold text-lg mx-4 text-gray-700 me-50">
                  Tháng {leftMonth + 1} {leftYear}
                </h3>
                <h3 className="font-semibold text-lg mx-4 text-gray-700">
                  Tháng {rightMonth + 1} {rightYear}
                </h3>
                <button
                  onClick={handleNextMonth}
                  className="px-3 py-1 text-xl font-bold text-gray-600 hover:bg-gray-200 rounded transition cursor-pointer"
                >
                  {">"}
                </button>
              </div>
              <div className="flex gap-8">
                <CalendarMonth
                  month={leftMonth}
                  year={leftYear}
                  startDay={startDay}
                  endDay={endDay}
                  onDayClick={handleDayClick}
                  selectingStart={selectingStart}
                  hideHeader
                  calendarWidth="w-[320px]"
                  cellSize="w-10 h-10"
                  daySize="w-7 h-7"
                  hoverDay={hoverDay}
                  setHoverDay={setHoverDay}
                />
                <CalendarMonth
                  month={rightMonth}
                  year={rightYear}
                  startDay={startDay}
                  endDay={endDay}
                  onDayClick={handleDayClick}
                  selectingStart={selectingStart}
                  hideHeader
                  calendarWidth="w-[320px]"
                  cellSize="w-10 h-10"
                  daySize="w-7 h-7"
                  hoverDay={hoverDay}
                  setHoverDay={setHoverDay}
                />
              </div>
            </div>
          </div>
        </div>
        {/* Sidebar */}
        <div className="w-[260px] flex flex-col justify-start bg-blue-500 text-white px-6 py-8 border-l border-gray-200">
          <div>
            <div className="mb-4">
              <label className="block mb-1">
                <b>Chọn điểm đến</b>
              </label>
              <div className="w-full px-3 py-2 border border-gray-300 rounded cursor-default">
                Hải Âu Hotel - Vũng Tàu
              </div>
            </div>
            <div className="mb-4">
              <label className="block mb-1">
                <b>Nhận phòng</b>
              </label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none"
                disabled
                value={showDate(startDay) || ""}
              />
            </div>
            <div className="mb-6">
              <label className="block mb-1">
                <b>Trả phòng</b>
              </label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none"
                disabled
                value={showDate(endDay) || ""}
              />
            </div>
            <button
              className="w-full bg-gray-800 text-white py-2 rounded font-semibold hover:bg-gray-700 transition cursor-pointer"
              onClick={() => onSubmit(startDay, endDay)}
            >
              ĐẶT NGAY
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
