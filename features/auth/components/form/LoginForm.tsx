import PasswordEyeButton from "@/components/button/PasswordEyeButton";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ResetPasswordDialog } from "@/features/reset-password/dialog/ResetPasswordDialog";
import { useResetPasswordDialog } from "@/features/reset-password/hooks/useResetPasswordDialog";
import useLoginForm from "../../hooks/useLoginForm";

const LoginForm = () => {
  const { onOpen } = useResetPasswordDialog();
  const { form, isLoading, onSubmit } = useLoginForm();
  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>UserName</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="username"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="relative">
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    id="password"
                    placeholder="********"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <PasswordEyeButton passInpId="password" />
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" spinner className="w-full" disabled={isLoading}>
            Login
          </Button>
        </form>
      </Form>
      <Button
        variant="link"
        className="w-full mt-4 text-sm  text-foreground hover:text-primary"
        onClick={onOpen}
        type="button"
      >
        Reset Password
      </Button>
      <ResetPasswordDialog />
    </>
  );
};

export default LoginForm;
