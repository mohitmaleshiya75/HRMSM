import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { api, getReadableErrorMessage } from "@/lib/utils/apiUtils"
import { sendOtpSchema } from "@/zod/resetPasswordschema"



export type SendOtpSchemaT = z.infer<typeof sendOtpSchema>

const useSendOtpForm = () => {
  const form = useForm<SendOtpSchemaT>({
    resolver: zodResolver(sendOtpSchema),
    defaultValues: {
      email: "",
    },
  })

  const { isPending, mutateAsync } = useMutation<
    { detail: string },
    unknown,
    SendOtpSchemaT
  >({
    mutationFn: async (input) => {
      const { data } = await api.post<{ detail: string }>(
        "/accounts/password-reset/request/",
        input,
      )
      return data
    },
    onError: (err) => {
      toast.error(getReadableErrorMessage(err))
    },
  })

  const onSubmit = async (data: SendOtpSchemaT) => {
    try {
      const res = await mutateAsync(data)
      toast.success(res.detail) // "If email exists, OTP sent"
      return res
    } catch (e) {
        console.error(e)
      // already handled in onError
    }
  }

  return {
    form,
    onSubmit,
    isLoading: isPending || form.formState.isSubmitting,
  }
}

export default useSendOtpForm
