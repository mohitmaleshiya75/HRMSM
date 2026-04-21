"use client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
// import { toast } from "sonner"
import useSendOtpForm from "../hooks/useSendOTP";
import useChangePasswordForm from "../hooks/useResetPassword";

export function ResetPasswordForm() {
  const [emailSent, setEmailSent] = useState(false);

  const {
    form: emailForm,
    onSubmit: sendOtp,
    isLoading: isSending,
  } = useSendOtpForm();

  const {
    form: changeForm,
    onSubmit: changePassword,
    isLoading: isChanging,
    otpDefaultValues,
  } = useChangePasswordForm();

  const handleSendOtp = async (data: { email: string }) => {
    const res = await sendOtp(data);
    if (res?.detail) {
      setEmailSent(true);
      setTimeout(() => {
        changeForm.reset(otpDefaultValues);
      }, 0);
    }
  };

  // const handleChangePassword = async (data: {
  //   code: string
  //   new_password: string
  //   confirm_password: string
  // }) => {
  //   await changePassword(data)
  // }

  return (
    <>
      {!emailSent ? (
        <Form {...emailForm}>
          <form
            onSubmit={emailForm.handleSubmit(handleSendOtp)}
            className="space-y-4"
          >
            <FormField
              control={emailForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      disabled={isSending}
                      {...emailForm.register("email")}
                      placeholder="you@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isSending}>
              {isSending ? "Sending..." : "Send OTP"}
            </Button>
          </form>
        </Form>
      ) : (
        <Form {...changeForm}>
          <form
            onSubmit={changeForm.handleSubmit(changePassword)}
            className="space-y-4"
          >
            <FormField
              control={emailForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      disabled={emailSent}
                      {...emailForm.register("email")}
                      placeholder="you@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={changeForm.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>OTP</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="Enter OTP" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={changeForm.control}
              name="new_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={changeForm.control}
              name="confirm_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="passsword" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* <Button type="submit" className="w-full" disabled={isChanging}> */}
            <Button type="submit" className="w-full" disabled={isChanging}>
              {isChanging ? "Changing..." : "Reset Password"}
            </Button>
          </form>
        </Form>
      )}
    </>
  );
}
