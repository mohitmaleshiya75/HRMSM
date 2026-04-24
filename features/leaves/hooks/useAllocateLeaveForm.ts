"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, getReadableErrorMessage } from "@/lib/utils/apiUtils";
import useCurrentUser from "@/features/auth/hooks/useCurrentUser";
import { LeaveApplyResponseT } from "@/features/leaves/types";
import useGetLeaveType from "./useGetLeaveType";
import { allocateLeaveSchema, AllocateLeaveSchemaT } from "@/zod/leaveSchema";
import useEditAllocatedLeaveDialog from "./useEditAllocatedLeaveDialog";
import { usePathname, useRouter } from "next/navigation";
import useGetOfficeId from "@/hooks/useGetOfficeId";

const useAllocateLeaveForm = () => {
  const { data: user } = useCurrentUser();
  const { leaveTypes } = useGetLeaveType();
  const officeId = useGetOfficeId();
  const queryClient = useQueryClient();
  const { onClose, allocateLeaveInfo } = useEditAllocatedLeaveDialog();
  const pathName = usePathname()
  const {push} = useRouter()

  const getDefaultValues = (): Partial<AllocateLeaveSchemaT> => {
    if (allocateLeaveInfo?.type === "edit") {
      return {
        leave_type: String(allocateLeaveInfo?.allocateLeaveInfo?.leave_type),
        employee: String(allocateLeaveInfo?.allocateLeaveInfo?.employee),
        yearly_quota: allocateLeaveInfo?.allocateLeaveInfo?.yearly_quota||0,
        used_leaves: allocateLeaveInfo?.allocateLeaveInfo?.used_leaves||0,
      };
    }
    return {
      leave_type: undefined,
      used_leaves:0,
      employee: undefined,
      yearly_quota: "" as unknown as number,
    };
  };

  const form = useForm<AllocateLeaveSchemaT>({
    resolver: zodResolver(allocateLeaveSchema),
    defaultValues: getDefaultValues(),
  });

  const { mutate, isPending } = useMutation<
    LeaveApplyResponseT,
    unknown,
    AllocateLeaveSchemaT
  >({
    mutationFn: async (values) => {
      const url =
        allocateLeaveInfo?.type === "edit"
          ? `/accounts/leave-allocations/${allocateLeaveInfo?.allocateLeaveInfo?.id}/?office=${officeId}`
          : "/accounts/leave-allocations/?office=${officeId}";

      const method = allocateLeaveInfo?.type === "edit" ? "patch" : "post";
      const { data } = await api[method](
        url,
        {
          ...values, 
          office:officeId,
        },
        {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        },
      );

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaveBalance"] });
      queryClient.invalidateQueries({ queryKey: ["leaves-allocations-by-id"] });
      toast.message(
        `Leave ${
          allocateLeaveInfo?.type === "edit" ? "updated" : "allocated"
        } successfully`,
      );
      queryClient.invalidateQueries({ queryKey: ["leaves-allocations"] });
      form.reset();
      push(pathName);
      setTimeout(() => {
        onClose();
      }, 0);
    },
    onError: (error) => {
      toast.error(
        getReadableErrorMessage(error) === "The fields employee, leave_type must make a unique set."
          ? "This leave type is already assigned to the employee"
          : getReadableErrorMessage(error)
      );
    },
  });

  function onSubmit(values: AllocateLeaveSchemaT) {
    mutate(values);
  }

  return {
    onSubmit,
    // startDate,
    isPending,
    leaveTypes,
    form,
  };
};

export default useAllocateLeaveForm;
