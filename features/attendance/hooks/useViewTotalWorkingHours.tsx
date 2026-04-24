import { useQuery } from "@tanstack/react-query";
import { TotalWorkingHours } from "../type";
import useCurrentUser from "@/features/auth/hooks/useCurrentUser";
import { api, getReadableErrorMessage } from "@/lib/utils/apiUtils";
import { toast } from "sonner";
import { convertToOnlyDate } from "@/lib/utils/dateUtils";
import { useParams } from "next/navigation";
import useGetOfficeId from "@/hooks/useGetOfficeId";

const useViewTotalWorkingHours = (date?: Date) => {
  const { data: user } = useCurrentUser();
  const { empId } = useParams();
  const officeId = useGetOfficeId();

  const url = `${empId || user?.id}/?office=${officeId}`;

  return useQuery({
    queryKey: ["totalWorkingHours", date, url],
    queryFn: async () => {
      try {
        // accounts/total-hours/2025-03-10/1/
        const { data } = await api.get<TotalWorkingHours>(
          `accounts/total-hours/${date && convertToOnlyDate(date)}/${user?.role === "Admin" || user?.role === "HR" || user?.role === "Manager" || user?.role === "SuperAdmin" ? url : `?office=${officeId}`}`,
          {
            headers: {
              Authorization: `Bearer ${user?.token}`,
            },
          },
        );
        return data;
      } catch (error) {
        const err = getReadableErrorMessage(error);
        toast.error(err);
        console.error(error);
        return null;
      }
    },
    // 🔁 refetch every 10 seconds
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
    // 🚫 don’t run until token exists
    enabled: !!(user?.token && date),
  });
};

export default useViewTotalWorkingHours;
