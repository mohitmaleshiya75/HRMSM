// import { CalendarEvent } from "@/components/ui/calendar/calendar-types";
// import AttendanceCircle from "@/features/attendance/components/sections/AttendanceCircle";
import {
  AttendanceStatusResponseT,
  GetAttendanceResponseT,
} from "@/features/attendance/type";
// import {
//   addMinutes,
//   eachDayOfInterval,
//   endOfMonth,
//   endOfWeek,
//   parseISO,
//   startOfMonth,
//   startOfWeek,
// } from "date-fns";

export function calculateTotalWorkingTime(data: GetAttendanceResponseT[]): {
  totalWorkingTime: string;
  isClockOut: boolean;
} {
  let totalMilliseconds = 0;
  let isClockOut = true;

  data.forEach((entry) => {
    if (!entry.clock_in_time) return; // Skip if clock_in_time is missing

    const clockInTime = new Date(entry.clock_in_time).getTime();
    const clockOutTime = entry.clock_out_time
      ? new Date(entry.clock_out_time).getTime()
      : null;

    if (clockOutTime) {
      totalMilliseconds += clockOutTime - clockInTime;
    } else {
      totalMilliseconds += Date.now() - clockInTime; // Calculate ongoing work duration
      isClockOut = false; // User is still working
    }
  });

  // Convert total milliseconds to hours, minutes, seconds
  const totalSeconds = Math.floor(totalMilliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    totalWorkingTime: `${hours}h ${minutes}m ${seconds}s`,
    isClockOut,
  };
}

// export function convertAttendanceToEvents(
//   attendanceData: AttendanceStatusResponseT["attendance_records"],
// ): CalendarEvent[] {
//   return attendanceData.map((record, i) => {
//     const start = parseISO(record.date);
//     const [hours, minutes, seconds] = record.total_hours_worked
//       .split(":")
//       .map(Number);
//     const totalMinutes = hours * 60 + minutes + seconds / 60;
//     const end = addMinutes(start, totalMinutes);

//     return {
//       id: `attendance-event-${i}`,
//       title: <AttendanceCircle status={record.attendance_status} />,
//       color:
//         record.attendance_status === "Absent"
//           ? "red"
//           : record.attendance_status === "Half Day"
//             ? "blue"
//             : record.attendance_status === "Holiday"
//               ? "amber"
//               : record.attendance_status === "Leave"
//                 ? "orange"
//                 : record.attendance_status === "Weekend"
//                 ? "amber"
//                 : "green",
//       start,
//       end,
//       variant: "attendance",
//     };
//   });
// }

// export const calendarMonthRange = (date: Date) => {
//   // Get the first day of the month
//   const monthStart = startOfMonth(date);
//   // Get the last day of the month
//   const monthEnd = endOfMonth(date);

//   // Get the first Monday of the first week (may be in previous month)
//   const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
//   // Get the last Sunday of the last week (may be in next month)
//   const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

//   // Get all days between start and end
//   const calendarDays = eachDayOfInterval({
//     start: calendarStart,
//     end: calendarEnd,
//   });

//   return {
//     calendarStart,
//     calendarEnd,
//     calendarDays,
//     monthEnd,
//     monthStart,
//   };
// };
