import useCurrentUser from "@/features/auth/hooks/useCurrentUser";
import { useAlertDialog } from "@/hooks/useAlertDialog";
import useGetOfficeId from "@/hooks/useGetOfficeId";
import { api, getReadableErrorMessage } from "@/lib/utils/apiUtils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const useDeleteLeaveType = () => {
  const { data: user } = useCurrentUser();
  const { showAlertDialog, setAlertDialogLoading, closeAlertDialog } =
    useAlertDialog();
    const officeId = useGetOfficeId();
  const queryClient = useQueryClient();
  const { mutate } = useMutation<unknown, unknown, string>({
    mutationFn: async (leaveTypeId) => {
      setAlertDialogLoading(true);
      const { data } = await api.delete(
        `/accounts/leave-types/${leaveTypeId}/?office=${officeId}`,
        {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaveTypes"] });
      queryClient.invalidateQueries({ queryKey: ["leaveBalance"] });
      toast.success("Leave type deleted successfully");
      setAlertDialogLoading(false);
      closeAlertDialog();
    },
    onError: (error) => {
      toast.error(getReadableErrorMessage(error));
      setAlertDialogLoading(false);
    },
  });

  const onDelete = async (leaveTypeId: string) => {
    const confirmed = await showAlertDialog({
      title: "Are you sure?",
      description:
        "This action cannot be undone. This will permanently delete the leave type.",
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
    });
    if (confirmed) {
      mutate(leaveTypeId);
    }
  };

  return { onDelete };
};

export default useDeleteLeaveType;
