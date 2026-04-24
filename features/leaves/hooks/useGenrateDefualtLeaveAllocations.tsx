import useCurrentUser from "@/features/auth/hooks/useCurrentUser";
import { useAlertDialog } from "@/hooks/useAlertDialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, getReadableErrorMessage } from "@/lib/utils/apiUtils";
import { toast } from "sonner";
import useGetOfficeId from "@/hooks/useGetOfficeId";

export const useAllocateLeaves = () => {
    const { data: user } = useCurrentUser();
    const { showAlertDialog, setAlertDialogLoading, closeAlertDialog } =
        useAlertDialog();
    const officeId = useGetOfficeId();
    const queryClient = useQueryClient();

    const { mutate, isPending } = useMutation({
        mutationFn: async () => {
            setAlertDialogLoading(true);

            const res = await api.post(
                `/accounts/leave-allocations/allocate_default_leaves_api/?office=${officeId}`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${user?.token}`,
                    },
                }
            );

            return res.data;
        },

        onSuccess: (data) => {
            toast.success(data?.message || "Leave allocated successfully");

            // 🔄 Refresh relevant data
            queryClient.invalidateQueries({ queryKey: ["leaveAllocation"] });
            queryClient.invalidateQueries({ queryKey: ["leaveBalance"] });
            //   queryClient.invalidateQueries({ queryKey: ["employees"] });

            closeAlertDialog();
        },

        onError: (error) => {
            const err = getReadableErrorMessage(error);
            toast.error(err);
            setAlertDialogLoading(false);
        },
    });

    const onAllocateLeaves = async () => {
        const confirmed = await showAlertDialog({
            title: "Allocate Leaves?",
            description:
                "This will reset and reassign leave balances for all employees.",
            confirmLabel: !isPending ? "Yes, Allocate" : "Allocating..." ,
            cancelLabel: "Cancel",
        });

        if (confirmed) {
            mutate();
        }
    };

    return { onAllocateLeaves, isAllocating: isPending };
};