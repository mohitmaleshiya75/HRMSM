import { useEffect, useState } from "react";
import { calculateTotalWorkingTime } from "@/lib/utils/dataFormatUtils";
import { AttendanceFilters } from "../type";
import useLiveWorkingHoursForAdmin from "./useLiveWorkingHoursForAdmin";
const useLiveWorkingHours = (filtersProps?: AttendanceFilters) => {
  const { attendance, isLoading } = useLiveWorkingHoursForAdmin(filtersProps);
  const [totalWorkingTime, setTotalWorkingTime] = useState<string>("0h 0m 0s");
  const [isClockedOut, setIsClockedOut] = useState(false);
  useEffect(() => {
    if (attendance) {
      const workingHours = calculateTotalWorkingTime(attendance);
      setIsClockedOut(workingHours.isClockOut);
      setTotalWorkingTime(workingHours.totalWorkingTime);
    }
    const interval = setInterval(() => {
      if (attendance) {
        const workingHours = calculateTotalWorkingTime(attendance);
        setIsClockedOut(workingHours.isClockOut);
        setTotalWorkingTime(workingHours.totalWorkingTime);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [attendance]);
  return { totalWorkingTime, attendance, isClockedOut, isLoading };
};
export default useLiveWorkingHours;