import { api, getReadableErrorMessage } from "@/lib/utils/apiUtils";
// import { AddEditLeaveTypeResponseT } from "../types";
import { useQuery } from "@tanstack/react-query";
// import { toast } from "sonner";
import useCurrentUser from "@/features/auth/hooks/useCurrentUser";
import { DashboardStatsResponseT } from "../type";
// import useGetOfficeId from "@/hooks/useGetOfficeId";

const useGetDashboardStats = () => {
  const { data: user } = useCurrentUser();
  // const officeId = useGetOfficeId();
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      try {
        const { data } = await api.get<DashboardStatsResponseT>(
          `/accounts/admin-dashboard/stats/?office=${user?.office}`,
          {
            headers: {
              Authorization: `Bearer ${user?.token}`,
            },
          },
        );
        return data;
      } catch (error) {
        // toast.error(getReadableErrorMessage(error));
        return null;
      }
    },
    // 🔁 refetch every 10 seconds
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
    // 🚫 don’t run until token exists
    enabled: !!user?.token,
  });
};

export default useGetDashboardStats;
