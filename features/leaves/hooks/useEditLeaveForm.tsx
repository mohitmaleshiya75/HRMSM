import useCurrentUser from "@/features/auth/hooks/useCurrentUser";
import { useEditLeaveDialog } from "./useEditLeaveDialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { editLeaveSchema, EditLeaveSchemaT } from "@/zod/leaveSchema";
import { GetLeavesResponseT } from "../types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api, getReadableErrorMessage } from "@/lib/utils/apiUtils";
import { toast } from "sonner";
import useGetOfficeId from "@/hooks/useGetOfficeId";

const useEditLeaveForm = (leaveInfo: GetLeavesResponseT) => {
  const { data: userSession } = useCurrentUser();
  const onClose = useEditLeaveDialog((s) => s.onClose);
  const queryClient = useQueryClient();
  const officeId = useGetOfficeId();
  const defaultValue: EditLeaveSchemaT = {
    employee: String(leaveInfo.employee),
    leave_type: String(leaveInfo.leave_type),
    status: leaveInfo.status,
  };
  const form = useForm<EditLeaveSchemaT>({
    resolver: zodResolver(editLeaveSchema),
    defaultValues: defaultValue,
  });

  const { mutate, isPending } = useMutation<
    GetLeavesResponseT,
    unknown,
    EditLeaveSchemaT
  >({
    mutationFn: async (input) => {
      const { data } = await api.put(
        `/accounts/leave-requests/${leaveInfo.id}/?office=${officeId}`,
        input,
        {
          headers: {
            Authorization: `Bearer ${userSession?.token}`,
          },
        },
      );

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaves"] });
      queryClient.invalidateQueries({ queryKey: ["leaveBalance"] });
      queryClient.invalidateQueries({ queryKey: ["user_leaves"] });
      toast.success(
        `Leave request for ${leaveInfo.employee_name} has been updated from ${leaveInfo.status} to ${form.getValues().status}.`,
      );
      setTimeout(() => {
        onClose();
      }, 0);
    },
    onError: (err) => {
      toast.error(getReadableErrorMessage(err));
    },
  });
  const onSubmit = (data: EditLeaveSchemaT) => {
    mutate(data);
  };

  return {
    onSubmit,
    form,
    isPending,
  };
};

export default useEditLeaveForm;
