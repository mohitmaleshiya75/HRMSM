import { api, getReadableErrorMessage } from "@/lib/utils/apiUtils";
import { changePasswordSchema } from "@/zod/resetPasswordschema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";



export type ChangePasswordSchemaT = z.infer<typeof changePasswordSchema>;

const useChangePasswordForm = () => {
  const defaultValues= <ChangePasswordSchemaT>{
    code: "",
    new_password: "",
    confirm_password: "",
  }
  const form = useForm<ChangePasswordSchemaT>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues,
  });

  const { isPending, mutateAsync } = useMutation<
    { detail: string },
    unknown,
    ChangePasswordSchemaT
  >({
    mutationFn: async (input) => {
      const { data } = await api.post<{ detail: string }>(
        "/accounts/password-reset/confirm/",
        {
          code: input.code,
          new_password: input.new_password,
        },
      );
      return data;
    },
    onError: (err) => {
      toast.error(getReadableErrorMessage(err));
    },
  });

  const onSubmit = async (data: ChangePasswordSchemaT) => {
    try {
      const res = await mutateAsync(data);
      toast.success(res.detail); // e.g. "Password changed successfully"
      return res;
    } catch (e) {
      console.error(e);
      // already handled in onError
    }
  };

  return {
    form,
    onSubmit,
    isLoading: isPending || form.formState.isSubmitting,
    otpDefaultValues: defaultValues
  };
};

export default useChangePasswordForm;
