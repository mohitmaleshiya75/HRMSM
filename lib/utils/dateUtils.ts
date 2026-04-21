import { format, isToday, parseISO } from "date-fns";

export const formattedDate = (date: string | Date) => format(date, "PPP");

export const convertToOnlyDate = (dateString: string | Date) => {
  try {
    return format(dateString, "yyyy-MM-dd"); // Format to YYYY-MM-DD
  } catch (error) {
    console.error("Invalid date:", error);
    return null;
  }
};
export const convertOnlyTime = (timeString: string | Date) => {
  try {
    return format(new Date(timeString).toISOString(), "HH:mm:ss"); // Format to HH:mm:ss
  } catch (error) {
    console.error("Invalid time string:", error);
    return null;
  }
};

// export const getCompleteDateTime = (
//   date: string | Date,
//   time: string | Date,
// ) => {
//   try {
//     return new Date(`${date}T${time}Z`);
//   } catch (error) {
//     console.error("Invalid date or time:", error);
//     return;
//   }
// };

export const getCompleteDateTime = (
  date: string | Date,
  time: string | Date,
) => {
  try {
    const dateStr = typeof date === "string" ? date : date.toISOString().split("T")[0];
    const timeStr = typeof time === "string" ? time : time.toTimeString().slice(0, 5);
    return new Date(`${dateStr}T${timeStr}`);
  } catch (error) {
    console.error("Invalid date or time:", error);
    return;
  }
};

export const getLocalISODateTime = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000; // Offset in milliseconds
  const localTime = new Date(now.getTime() - offset); // Adjust for local timezone
  return localTime.toISOString().slice(0, 16); // Format correctly for <input>
};

export const formateTime = (time: string | Date) =>
  format(new Date(time), "hh:mm a");

export function formatSearchDate(dateString: string): string {
  try {
    const date = parseISO(dateString);
    if (isToday(date)) {
      return "Today";
    }
    return format(date, "MMM d, yyyy"); // Example format: "Aug 30, 2024"
  } catch (error) {
    console.error("Invalid date string:", dateString, error);
    return "Invalid date";
  }
}
