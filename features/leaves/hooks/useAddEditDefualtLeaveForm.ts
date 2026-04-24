import useCurrentUser from "@/features/auth/hooks/useCurrentUser";
import { api, getReadableErrorMessage } from "@/lib/utils/apiUtils";
import {
  defualtLeaveSchema,
  DefualtLeaveSchemaT,
} from "@/zod/defualtLeaveSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import {
  useAddEditDefualtLeaveDialog,
} from "./useAddEditDefualtLeaveDialog";
import { toast } from "sonner";
import useGetOfficeId from "@/hooks/useGetOfficeId";
import { DefualtLeaveResponseT } from "../types";

const useAddEditDefualtLeaveForm = () => {
  const { leaveInfo:isEditOrAdd } = useAddEditDefualtLeaveDialog();
  const { data: userSession } = useCurrentUser();
  const queryClient = useQueryClient();
  const officeId = useGetOfficeId();
  const onClose = useAddEditDefualtLeaveDialog((s) => s.onClose);

  const getDefaultValues = (): DefualtLeaveSchemaT => {
    if (isEditOrAdd?.type === "edit") {
      return {
        employee_type: isEditOrAdd.leaveInfo.employee_type,
        leave_type: isEditOrAdd.leaveInfo.leave_type,
        default_days: isEditOrAdd.leaveInfo.default_days,
        created_by: isEditOrAdd.leaveInfo.created_by,
      };
    }

    return {
      employee_type: "FULL_TIME", // required enum
      leave_type: 0,
      default_days: 0,
      created_by: 0,
    };
  };

  const form = useForm<DefualtLeaveSchemaT>({
    resolver: zodResolver(defualtLeaveSchema),
    defaultValues: getDefaultValues(),
  });

  const { isPending, mutate } = useMutation<
    DefualtLeaveResponseT,
    unknown,
    DefualtLeaveSchemaT
  >({
    mutationFn: async (input) => {
      const url =
        isEditOrAdd?.type === "create"
          ? `/accounts/default-leaves/`
          : `/accounts/default-leaves/${isEditOrAdd?.id}/?office=${officeId}`;

      const method =
        isEditOrAdd?.type === "create" ? "post" : "put";

      const { data } = await api[method](
        url,
        { ...input, office: officeId },
        {
          headers: {
            Authorization: `Bearer ${userSession?.token}`,
          },
        }
      );

      return data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["DefualtLeave",officeId] });

      toast.success(
        `Default leave ${
          isEditOrAdd?.type === "create" ? "created" : "updated"
        }`
      );

      setTimeout(() => {
        onClose();
      }, 0);
    },

    onError: (err) => {
      toast.error(getReadableErrorMessage(err));
    },
  });

  const onSubmit = async (data: DefualtLeaveSchemaT) => {
    mutate(data);
  };

  const isLoading = isPending || form.formState.isLoading;

  return {
    form,
    onSubmit,
    isLoading,
  };
};

export default useAddEditDefualtLeaveForm;