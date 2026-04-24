import useCurrentUser from "@/features/auth/hooks/useCurrentUser";
import { useAlertDialog } from "@/hooks/useAlertDialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, getReadableErrorMessage } from "@/lib/utils/apiUtils";
import { toast } from "sonner";
import { LeaveAllocationResponseT } from "../types";
import useGetOfficeId from "@/hooks/useGetOfficeId";

export const useDeleteAllocatedLeave = () => {
  const { data: user } = useCurrentUser();
  const officeId = useGetOfficeId();
  const { showAlertDialog, setAlertDialogLoading, closeAlertDialog } =
    useAlertDialog();
  const queryClient = useQueryClient();

  const { mutate } = useMutation({
    mutationFn: async (allocationId: string) => {
      setAlertDialogLoading(true);

      await api.delete(`/accounts/leave-allocations/${allocationId}/?office=${officeId}`, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });
    },

    onSuccess: () => {
      setAlertDialogLoading(true);

      queryClient.invalidateQueries({ queryKey: ["leaves-allocations"] });
      queryClient.invalidateQueries({ queryKey: ["leaves-allocations-by-id"] });
      setTimeout(() => {}, 0);
      toast.success("Employee leave allocation has been successfully deleted.");
      setTimeout(() => {
        closeAlertDialog();
      }, 0);
    },
    onError: (error) => {
      const err = getReadableErrorMessage(error);
      toast.error(err);
      setAlertDialogLoading(false);
    },
  });
  const onDelete = async (allocatedLeaveInfo: LeaveAllocationResponseT) => {
    const confirmed = await showAlertDialog({
      title: "Are you sure?",
      description: (
        <>
          This action cannot be undone. This will permanently delete the leave
          allocation for{" "}
          <strong className="mx-2 text-primary">
            {`${allocatedLeaveInfo?.employee_name || ""}`}
          </strong>
        </>
      ),
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
    });
    if (confirmed) {
      mutate(allocatedLeaveInfo.id);
    }
  };

  return { onDelete };
};
