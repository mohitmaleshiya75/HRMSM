import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { passwordFormSchema, PasswordFormValues } from "@/zod/authSchema";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { ChangePasswordResponse } from "../../types";
import { api, getReadableErrorMessage } from "@/lib/utils/apiUtils";
import { toast } from "sonner";
import useCurrentUser from "../../hooks/useCurrentUser";
import PasswordEyeButton from "@/components/button/PasswordEyeButton";

const ChangePasswordForm = () => {
  const { data: user } = useCurrentUser();
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      old_password: "",
      new_password: "",
      confirmPassword: "",
    },
  });

  const { mutate, isPending } = useMutation<
    ChangePasswordResponse,
    unknown,
    PasswordFormValues
  >({
    mutationFn: async (values) => {
      const { data } = await api.put<ChangePasswordResponse>(
        "/accounts/change-password/",
        values,
        {
          headers: { Authorization: `Bearer ${user?.token}` },
        },
      );
      return data;
    },
    onSuccess: (data) => {
      form.reset();
      toast.success(data?.detail || "Password reset successfully");
    },
    onError: (error) => {
      
      form.setError("old_password", { message: getReadableErrorMessage(error) });
        console.error("Error updating password:", error);
      toast.error(getReadableErrorMessage(error));
    },
  });

  const onSubmit = async (data: PasswordFormValues) => {
    mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        {/* <Input readOnly hidden value={user.} /> */}
        <FormField
          control={form.control}
          name="old_password"
          render={({ field }) => (
            <FormItem className="relative">
              <FormLabel>Current Password</FormLabel>
              <FormControl>
                <Input
                  disabled={isPending}
                  id="currentPassword"
                  type="password"
                  {...field}
                />
              </FormControl>
              <PasswordEyeButton passInpId="currentPassword" />
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="new_password"
            render={({ field }) => (
              <FormItem className="relative">
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <Input
                    disabled={isPending}
                    id="newPassword"
                    type="password"
                    {...field}
                  />
                </FormControl>
                <PasswordEyeButton passInpId="newPassword" />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem className="relative">
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input
                    disabled={isPending}
                    id="confirmPassword"
                    type="password"
                    {...field}
                  />
                </FormControl>
                <PasswordEyeButton passInpId="confirmPassword" />

                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-end">
          <Button disabled={isPending} spinner type="submit">
            {form.formState.isSubmitting ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ChangePasswordForm;
