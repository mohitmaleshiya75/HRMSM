"use client";
import useCurrentUser from "@/features/auth/hooks/useCurrentUser";
import { LeaveApplyResponseT } from "@/features/leaves/types";
import { api, getReadableErrorMessage } from "@/lib/utils/apiUtils";
import { convertToOnlyDate } from "@/lib/utils/dateUtils";
import { leaveSchema, LeaveSchemaT } from "@/zod/leaveSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import useGetLeaveType from "./useGetLeaveType";
import useGetOfficeId from "@/hooks/useGetOfficeId";

const useLeaveApplyForm = () => {
  const { data: user } = useCurrentUser();
  const { leaveTypes } = useGetLeaveType();
  const queryClient = useQueryClient();
  const officeId = useGetOfficeId();

  const form = useForm<LeaveSchemaT>({
    resolver: zodResolver(leaveSchema),
    defaultValues: {
      leave_type: undefined,
      start_date: undefined,
      end_date: undefined,
      duration: undefined,
      reason: "",
    },
  });

  const { mutate, isPending } = useMutation<
    LeaveApplyResponseT,
    unknown,
    LeaveSchemaT
  >({
    mutationFn: async (values) => {
      const { data } = await api.post(
        `/accounts/leave-requests/?office=${officeId}`,
        {
          ...values,
          office:officeId,
          end_date: convertToOnlyDate(values.end_date),
          start_date: convertToOnlyDate(values.start_date),
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
      toast.message("Leave request submitted");
      queryClient.invalidateQueries({ queryKey: ["leaves"] });
      queryClient.invalidateQueries({ queryKey: ["leaveBalance"] });
      setTimeout(() => {
        form.reset({});
      }, 0);
      setTimeout(() => {
        form.reset({});
      }, 10);
    },
    onError: (error) => {
      toast.error(getReadableErrorMessage(error));
    },
  });

  // Get the current start date value
  const startDate = form.watch("start_date");

  function onSubmit(values: LeaveSchemaT) {
    mutate(values);
  }

  return {
    onSubmit,
    startDate,
    isPending,
    leaveTypes,
    form,
  };
};

export default useLeaveApplyForm;
