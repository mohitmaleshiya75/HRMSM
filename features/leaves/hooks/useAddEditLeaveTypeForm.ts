import useCurrentUser from "@/features/auth/hooks/useCurrentUser";
import { api, getReadableErrorMessage } from "@/lib/utils/apiUtils";
import { leaveTypeSchema, LeaveTypeSchemaT } from "@/zod/leaveSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import {
  AddEditLeaveType,
  useAddEditLeaveTypeDialog,
} from "./useAddEditLeaveTypeDialog";
import { toast } from "sonner";
import { AddEditLeaveTypeResponseT } from "../types";
import useGetOfficeId from "@/hooks/useGetOfficeId";

const useAddEditLeaveTypeForm = (isEditOrAdd: AddEditLeaveType) => {
  const { data: userSession } = useCurrentUser();
  const queryClient = useQueryClient();
  const officeId = useGetOfficeId();
  const onClose = useAddEditLeaveTypeDialog((s) => s.onClose);
  const getDefaultValues = () => {
    if (isEditOrAdd.type === "edit") {
      return {
        name: isEditOrAdd.leaveInfo.name,
        full_time_default_days: Number(isEditOrAdd.leaveInfo.full_time_default_days),
        part_time_default_days: Number(isEditOrAdd.leaveInfo.part_time_default_days),
        internship_default_days: Number(isEditOrAdd.leaveInfo.internship_default_days),
        contract_default_days:Number(isEditOrAdd.leaveInfo.contract_default_days),
        created_by: String(isEditOrAdd.leaveInfo.created_by),
        is_unlimited: isEditOrAdd.leaveInfo.is_unlimited,
        office: officeId,
      };
    }
    return {
        name:"",
        full_time_default_days: 0,
        part_time_default_days: 0,
        internship_default_days: 0,
        contract_default_days: 0,
        is_unlimited: false,
        created_by: String(userSession?.id),
        office: officeId,
    };
  };

  const form = useForm<LeaveTypeSchemaT>({
    resolver: zodResolver(leaveTypeSchema),
    defaultValues: getDefaultValues(),
  });

  const { isPending, mutate } = useMutation<
    AddEditLeaveTypeResponseT,
    unknown,
    LeaveTypeSchemaT
  >({
    mutationFn: async (input) => {
      const url =
        isEditOrAdd.type === "create"
          ? `/accounts/leave-types/?office=${officeId}`
          : `/accounts/leave-types/${isEditOrAdd.id}/?office=${officeId}`;

      const method = isEditOrAdd.type === "create" ? "post" : "put";

      const { data } = await api[method]<AddEditLeaveTypeResponseT>(
        url,
        {...input, office:officeId},
        {
          headers: {
            Authorization: `Bearer ${userSession?.token}`,
          },
        },
      );

      return data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaveTypes"] });
      queryClient.invalidateQueries({ queryKey: ["leaveBalance"] });
      toast.success(
        `Leave type ${isEditOrAdd.type === "create" ? "created" : "updated"}`,
      );
      setTimeout(() => {
        onClose();
      }, 0);
    },
    onError: (err) => {
      toast.error(getReadableErrorMessage(err));
    },
  });

  const onSubmit = async (data: LeaveTypeSchemaT) => {
    mutate(data);
  };

  const isLoading = isPending || form.formState.isLoading;
  return {
    form,
    onSubmit,
    isLoading,
  };
};

export default useAddEditLeaveTypeForm;
