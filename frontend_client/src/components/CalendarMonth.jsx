import React from "react";

const daysOfWeek = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const generateCalendar = (month, year) => {
  const firstDate = new Date(year, month, 1);

  // 0=Sunday → convert to 0=Monday
  let firstDayOfWeek = (firstDate.getDay() + 6) % 7; // 0 = Monday

  // If the month starts on Monday, move startDate back one full week
  if (firstDayOfWeek === 0) {
    firstDayOfWeek = 7;
  }

  // Calculate start date
  const calendarStart = new Date(year, month, 1 - firstDayOfWeek);

  const weeks = [];
  let current = new Date(calendarStart);

  while (weeks.length < 6) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      week.push({
        date: new Date(current),
        day: current.getDate(),
        month: current.getMonth(),
        year: current.getFullYear(),
      });
      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
  }

  return weeks;
};

export default function CalendarMonth({
  month,
  year,
  startDay,
  endDay,
  onDayClick,
  calendarWidth = "w-[320px]",
  cellSize = "w-10 h-10",
  daySize = "w-7 h-7",
  hoverDay,
  setHoverDay,
}) {
  const weeks = generateCalendar(month, year);
  const today = new Date();

  let rangeStart = null;
  let rangeEnd = null;
  if (
    startDay &&
    endDay // <-- chỉ khi đã chọn cả hai ngày
  ) {
    if (
      startDay.getFullYear() === year &&
      endDay.getFullYear() === year &&
      startDay.getMonth() === month &&
      endDay.getMonth() === month
    ) {
      // Cùng tháng: bôi xám từ startDay đến endDay
      rangeStart = startDay;
      rangeEnd = endDay;
    } else if (
      startDay.getFullYear() === year &&
      startDay.getMonth() === month
    ) {
      // Tháng bắt đầu: bôi xám từ startDay đến hết tháng
      rangeStart = startDay;
      rangeEnd = new Date(year, month + 1, 0); // ngày cuối tháng
    } else if (endDay.getFullYear() === year && endDay.getMonth() === month) {
      // Tháng kết thúc: bôi xám từ ngày 1 đến endDay
      rangeStart = new Date(year, month, 1);
      rangeEnd = endDay;
    } else if (
      (year > startDay.getFullYear() ||
        (year === startDay.getFullYear() && month > startDay.getMonth())) &&
      (year < endDay.getFullYear() ||
        (year === endDay.getFullYear() && month < endDay.getMonth()))
    ) {
      // Tháng nằm giữa: bôi xám toàn bộ tháng
      rangeStart = new Date(year, month, 1);
      rangeEnd = new Date(year, month + 1, 0);
    }
  }

  const isInRange = (dateObj) => {
    if (!rangeStart || !rangeEnd) return false;
    const cellDate = new Date(
      dateObj.year,
      dateObj.month,
      dateObj.day,
      0,
      0,
      0,
      0
    );
    return cellDate >= rangeStart && cellDate <= rangeEnd;
  };

  const isCurrentMonth = (dateObj) =>
    dateObj.month === month && dateObj.year === year;

  // (Copy all logic from your CalendarMonth in the original file here)

  return (
    <div className={calendarWidth}>
      <table className="table-fixed border-collapse w-full">
        <thead>
          <tr>
            {daysOfWeek.map((d) => (
              <th key={d} className="py-2 text-sm font-bold text-gray-800">
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, i) => (
            <tr key={i}>
              {week.map((dateObj, j) => {
                const cellDate = new Date(
                  dateObj.year,
                  dateObj.month,
                  dateObj.day,
                  0,
                  0,
                  0,
                  0
                );
                const isPast =
                  cellDate <
                  new Date(
                    today.getFullYear(),
                    today.getMonth(),
                    today.getDate(),
                    0,
                    0,
                    0,
                    0
                  );

                const isStart =
                  startDay &&
                  dateObj.year === startDay.getFullYear() &&
                  dateObj.month === startDay.getMonth() &&
                  dateObj.day === startDay.getDate() &&
                  dateObj.month === month &&
                  dateObj.year === year;

                const isEnd =
                  endDay &&
                  dateObj.year === endDay.getFullYear() &&
                  dateObj.month === endDay.getMonth() &&
                  dateObj.day === endDay.getDate() &&
                  dateObj.month === month &&
                  dateObj.year === year;

                const isSingle =
                  isStart &&
                  isEnd &&
                  startDay &&
                  endDay &&
                  startDay.getTime() === endDay.getTime();

                const isRange = !isStart && !isEnd && isInRange(dateObj);

                // --- Hover range preview logic ---
                // Khi đã chọn startDay và chưa chọn endDay, hoverDay sẽ là ngày preview endDay
                let isPreviewRange = false;
                let isPreviewEnd = false;
                if (startDay && !endDay && hoverDay) {
                  // Chỉ preview nếu hoverDay >= startDay
                  if (hoverDay.getTime() > startDay.getTime()) {
                    const min = startDay;
                    const max = hoverDay;
                    isPreviewRange = cellDate > min && cellDate < max;
                    isPreviewEnd = cellDate.getTime() === hoverDay.getTime();
                  }
                }

                return (
                  <td
                    key={j}
                    className={`
                      relative align-middle text-center border border-gray-200 p-0
                      ${cellSize}
                      ${isRange || isPreviewRange ? "bg-gray-200" : ""}
                      ${
                        !isCurrentMonth(dateObj)
                          ? "text-gray-500"
                          : "text-gray-900"
                      }
                      ${isPast ? "" : "cursor-pointer"}
                      group
                    `}
                    style={{
                      width: "40px",
                      height: "40px",
                      minWidth: "40px",
                      minHeight: "40px",
                      maxWidth: "40px",
                      maxHeight: "40px",
                      aspectRatio: "1 / 1",
                      position: "relative",
                      overflow: "visible",
                    }}
                    onClick={() => {
                      if (!isPast) onDayClick(dateObj);
                    }}
                    onMouseEnter={() => {
                      if (!isPast && startDay && !endDay) setHoverDay(cellDate);
                      else if (!isPast && !startDay) setHoverDay(cellDate);
                    }}
                    onMouseLeave={() => {
                      setHoverDay(null);
                    }}
                  >
                    {/* Hover circle khi CHƯA chọn startDay và endDay */}
                    {!isPast && (
                      <span
                        className="absolute inset-0 rounded-full bg-gray-200 opacity-0 group-hover:opacity-100 z-0 transition"
                        style={{
                          width: "40px",
                          height: "40px",
                          left: "50%",
                          top: "50%",
                          transform: "translate(-50%, -50%)",
                          position: "absolute",
                          pointerEvents: "none",
                        }}
                      ></span>
                    )}
                    {/* Preview endDay (hover) */}
                    {isPreviewEnd && (
                      <span className="absolute inset-0 bg-blue-500 rounded-full z-0"></span>
                    )}
                    {/* Only one day selected (start == end) */}
                    {isSingle && (
                      <span className="absolute inset-0 bg-blue-500 rounded-full z-0"></span>
                    )}
                    {/* Start of range */}
                    {isStart && !isEnd && (
                      <span
                        className="absolute inset-0 bg-blue-500 rounded-l-full z-0"
                        style={{
                          borderTopRightRadius: 0,
                          borderBottomRightRadius: 0,
                        }}
                      ></span>
                    )}
                    {/* End of range */}
                    {isEnd && !isStart && (
                      <span
                        className="absolute inset-0 bg-blue-500 rounded-r-full z-0"
                        style={{
                          borderTopLeftRadius: 0,
                          borderBottomLeftRadius: 0,
                        }}
                      ></span>
                    )}
                    <span
                      className={`
                        relative z-10 ${daySize} flex items-center justify-center mx-auto font-semibold
                        ${
                          isStart || isEnd || isPreviewEnd
                            ? "text-white font-bold"
                            : ""
                        }
                        ${isPast ? "text-gray-500 line-through" : ""}
                      `}
                      style={{
                        borderRadius:
                          isSingle || isPreviewEnd ? "9999px" : undefined,
                        width: "28px",
                        height: "28px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {dateObj.day}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
