import useCurrentUser from "@/features/auth/hooks/useCurrentUser";
import { api, getReadableErrorMessage } from "@/lib/utils/apiUtils";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { LeaveBalance } from "../types";
import useGetOfficeId from "@/hooks/useGetOfficeId";

const useViewLeaveBalance = () => {
  const { data: user } = useCurrentUser();
  const officeId = useGetOfficeId();
  return useQuery<LeaveBalance[]>({
    queryKey: ["leaveBalance"],
    queryFn: async () => {
      try {
        const { data } = await api.get<LeaveBalance[]>(
          `/accounts/my-leave-balance/?office=${officeId}`,
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
        return [];
      }
    },
    enabled: !!user?.token,
  });
};

export default useViewLeaveBalance;
