import { useMutation, useQueryClient } from "@tanstack/react-query";
import useCurrentUser from "@/features/auth/hooks/useCurrentUser";
import { api, getReadableErrorMessage } from "@/lib/utils/apiUtils";
import { LeaveStatus } from "../type";

type StatusT = "Approved" | "Rejected" | "Cancelled";

const useUpdateLeaveStatus = () => {
  const { data: userSession } = useCurrentUser();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      leaveId,
      status,
    }: {
      leaveId: number;
      status: LeaveStatus;
    }) => {
      const { data } = await api.put(
        `/accounts/leave-requests/${leaveId}/?office=${userSession?.office}`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${userSession?.token}`,
          },
        }
      );
      return data;
    },

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["leaves"] });
      queryClient.invalidateQueries({ queryKey: ["leaveBalance"] });
      queryClient.invalidateQueries({ queryKey: ["user_leaves"] });

      // toast.success(`Leave ${variables.status.toLowerCase()} successfully`);
    },

    onError: (err) => {
      // toast.error(getReadableErrorMessage(err));
    },
  });

  return {
    updateStatus: mutation.mutate,
    isPending: mutation.isPending,
  };
};

export default useUpdateLeaveStatus;