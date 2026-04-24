import useCurrentUser from "@/features/auth/hooks/useCurrentUser";
import { useQuery } from "@tanstack/react-query";
import { AttendanceStatusRequestT, AttendanceStatusResponseT } from "../type";
import { api } from "@/lib/utils/apiUtils";
import { useSearchParams } from "next/navigation";
import { convertAttendanceToEvents } from "@/lib/utils/dataFormatUtils";
import { convertToOnlyDate } from "@/lib/utils/dateUtils";

const useViewCalendarStatus = ({
  employee_id,
  start_date,
  end_date,
  enabled,
  formatType,
}: Partial<AttendanceStatusRequestT> & {
  enabled: boolean;
  formatType: "event" | "dataOnly";
}) => {
  const { data: user } = useCurrentUser();

  const searchParams = useSearchParams();

  const today = new Date().toISOString().split("T")[0]; // Get today's date in "YYYY-MM-DD" format

  const endDateParam =
    end_date ?? (searchParams.get("end_date") || convertToOnlyDate(new Date()));
  const validEndDate =
    endDateParam && endDateParam > today ? today : endDateParam;

  const params: AttendanceStatusRequestT = {
    employee_id: employee_id ?? searchParams.get("employee_id") ?? undefined,
    start_date: start_date ?? searchParams.get("start_date") ?? "",
    end_date: validEndDate!,
  };

  return useQuery({
    queryKey: ["viewCalendarStatus", params],
    queryFn: async () => {
      try {
        const { data } = await api.get<AttendanceStatusResponseT>(
          "/accounts/attendance-status/",
          {
            params,
            headers: {
              Authorization: `Bearer ${user?.token}`,
            },
          },
        );
        if (formatType === "event") {
          return {
            type: formatType,
            data: convertAttendanceToEvents(data.attendance_records),
          };
        }

        return { data: data, type: formatType };
      } catch (error) {
        // const err = getReadableErrorMessage(error);
        // toast.error(err);
        console.error(error);
        return;
      }
    },
    // 🔁 refetch every 10 seconds
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
    // 🚫 don’t run until token exists
    enabled: !!(enabled && user?.token),
  });
};

export default useViewCalendarStatus;
