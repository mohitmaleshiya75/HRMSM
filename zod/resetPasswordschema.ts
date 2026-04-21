import { z } from "zod";

export const changePasswordSchema = z
  .object({
    code: z
      .string()
      .min(6, "OTP must be at least 6 digits")
      .max(6, "OTP must be at most 6 digits"),
    new_password: z.string().min(8, "Password must be at least 6 characters"),
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  });

export const sendOtpSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});
