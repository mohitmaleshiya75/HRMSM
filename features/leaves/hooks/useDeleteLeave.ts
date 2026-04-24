import useCurrentUser from "@/features/auth/hooks/useCurrentUser";
import { useAlertDialog } from "@/hooks/useAlertDialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, getReadableErrorMessage } from "@/lib/utils/apiUtils";
import { toast } from "sonner";
import useGetOfficeId from "@/hooks/useGetOfficeId";

export const useDeleteLeave = () => {
  const { data: user } = useCurrentUser();
  const { showAlertDialog, setAlertDialogLoading, closeAlertDialog } =
    useAlertDialog();
    const officeId = useGetOfficeId();
  const queryClient = useQueryClient();

  const { mutate } = useMutation({
    mutationFn: async (leaveId: string) => {
      setAlertDialogLoading(true);

      await api.delete(`/accounts/leave-requests/${leaveId}/?office=${officeId}`, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });
      toast.success("Leave request has been deleted.");
    },

    onSuccess: () => {
      setAlertDialogLoading(true);

      queryClient.invalidateQueries({ queryKey: ["leaves"] });
      queryClient.invalidateQueries({ queryKey: ["leaveBalance"] });
      queryClient.invalidateQueries({ queryKey: ["user_leaves"] });
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
  const onDelete = async (leaveId: string) => {
    const confirmed = await showAlertDialog({
      title: "Are you sure?",
      description:
        "This action cannot be undone. This will permanently delete the leave request.",
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
    });
    if (confirmed) {
      mutate(leaveId);
    }
  };

  return { onDelete };
};
