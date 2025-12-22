import React, { useState } from "react";
import CalendarMonth from "./CalendarMonth";

export default function CalendarDropdown({
  startDay: propStartDay,
  endDay: propEndDay,
  onChange,
  onClose,
}) {
  const today = new Date();
  const [leftMonth, setLeftMonth] = useState(
    propStartDay ? propStartDay.getMonth() : today.getMonth()
  );
  const [leftYear, setLeftYear] = useState(
    propStartDay ? propStartDay.getFullYear() : today.getFullYear()
  );
  const [startDay, setStartDay] = useState(propStartDay || null);
  const [endDay, setEndDay] = useState(propEndDay || null);
  const [selectingStart, setSelectingStart] = useState(true);
  const [hoverDay, setHoverDay] = useState(null);

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
      if (onChange) onChange(clickedDate, null);
    } else if (!endDay) {
      if (clickedDate < startDay) {
        setStartDay(clickedDate);
        setEndDay(null);
        setSelectingStart(false);
        if (onChange) onChange(clickedDate, null);
      } else if (clickedDate.getTime() === startDay.getTime()) {
        setEndDay(clickedDate);
        setSelectingStart(true);
        if (onChange) onChange(startDay, clickedDate);
      } else {
        setEndDay(clickedDate);
        setSelectingStart(true);
        if (onChange) onChange(startDay, clickedDate);
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
    <div className="bg-white rounded shadow-lg border px-8 py-2 min-w-[600px] max-w-[800px]">
      <div className="flex justify-end">
        <button
          className="text-lg hover:text-red-500 cursor-pointer"
          onClick={onClose}
        >
          &times;
        </button>
      </div>
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-15 justify-center mb-2 w-full">
          <button
            onClick={handlePrevMonth}
            className="px-2 py-1 text-lg font-bold text-gray-600 hover:bg-gray-200 rounded transition cursor-pointer"
          >
            {"<"}
          </button>
          <h3 className="font-semibold text-base mx-2 text-gray-700">
            Tháng {leftMonth + 1} {leftYear}
          </h3>
          <h3 className="font-semibold text-base mx-2 text-gray-700">
            Tháng {rightMonth + 1} {rightYear}
          </h3>
          <button
            onClick={handleNextMonth}
            className="px-2 py-1 text-lg font-bold text-gray-600 hover:bg-gray-200 rounded transition cursor-pointer"
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
            calendarWidth="w-[220px]"
            cellSize="w-10 h-6" // giảm chiều cao cell
            daySize="w-10 h-5" // giảm chiều cao số ngày
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
            calendarWidth="w-[220px]"
            cellSize="w-10 h-6" // giảm chiều cao cell
            daySize="w-10 h-5" // giảm chiều cao số ngày
            hoverDay={hoverDay}
            setHoverDay={setHoverDay}
          />
        </div>
      </div>
    </div>
  );
}
