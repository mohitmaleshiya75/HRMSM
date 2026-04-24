import { api, getReadableErrorMessage } from "@/lib/utils/apiUtils";
import { AddEditLeaveTypeResponseT } from "../types";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import useCurrentUser from "@/features/auth/hooks/useCurrentUser";

const useGetLeaveType = () => {
  const { data: user } = useCurrentUser();
  const {
    data: leaveTypes,
    isLoading,
    isRefetching,
  } = useQuery({
    queryKey: ["leaveTypes"],
    queryFn: async () => {
      try {
        const { data } = await api.get<AddEditLeaveTypeResponseT[]>(
          `/accounts/leave-types/?office=${user?.office || "0"}`,
          {
            headers: {
              Authorization: `Bearer ${user?.token}`,
            },
          },
        );
        return data;
      } catch (error) {
        toast.error(getReadableErrorMessage(error));
        return [];
      }
    },
    // 🔁 refetch every 10 seconds
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
    // 🚫 don’t run until token exists
    enabled: !!user?.token,
  });

  return { leaveTypes, isLoading: isLoading || isRefetching };
};

export default useGetLeaveType;
