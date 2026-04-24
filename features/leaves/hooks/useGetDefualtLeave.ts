import { api, getReadableErrorMessage } from "@/lib/utils/apiUtils";
import { DefualtLeaveResponseT } from "../types";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import useCurrentUser from "@/features/auth/hooks/useCurrentUser";
import useGetOfficeId from "@/hooks/useGetOfficeId";

const useGetDefualtLeave = () => {
  const { data: user } = useCurrentUser();
  const officeId = useGetOfficeId();
  const {
    data: DefualtLeave,
    isLoading,
    isRefetching,
  } = useQuery({
    queryKey: ["DefualtLeave",officeId],
    queryFn: async () => {
      try {
        const { data } = await api.get<DefualtLeaveResponseT[]>(
          `/accounts/default-leaves/?office=${officeId}`,
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

  return { DefualtLeave, isLoading: isLoading || isRefetching };
};

export default useGetDefualtLeave;
