"use client";

import { CardTitle } from "@/components/ui/card";
import { webName } from "@/constant";
import LoginForm from "./LoginForm";
import SignUpForm from "./RegisterForm";
// import Link from "next/link";

interface AuthFormProps {
  formType: "login" | "signup";
  hardRefresh?: boolean
}
export default function AuthForm({ formType }: AuthFormProps) {
  return (
    <>
      <CardTitle className="text-center">
        Welcome {formType == "login" ? "back" : ""} to {webName}
      </CardTitle>
      <div className="flex w-full flex-col space-y-2 text-center">
        <p className="text-sm text-muted-foreground">
          {formType === "login"
            ? "Login with your credentials"
            : "Create an account"}
        </p>
      </div>
      {formType === "login" ? (
        <LoginForm />
      ) : (
        <SignUpForm />
      )}
      {/* <p className="my-2 flex items-center gap-2 px-8 text-center text-sm text-muted-foreground">
        {formType === "login"
          ? "Don't have an account? "
          : "Already have an account? "}
        <Link
          href={formType === "login" ? "/auth/sign-up" : "/auth/login"}
          className="underline underline-offset-4 hover:text-primary"
        >
          {formType === "login" ? "Sign up" : "Login"}
        </Link>
      </p> */}
    </>
  );
}
