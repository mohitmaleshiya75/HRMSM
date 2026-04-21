"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { whoCanAccessSpecialFieldsWithManager } from "@/constant";
import AuthForm from "../components/form/AuthForm";
import { useAddUserDialog } from "../hooks/useAddUserDialog";
import useCurrentUser from "../hooks/useCurrentUser";

const SignUpDialog = () => {
  const { data: user } = useCurrentUser();
  const { isOpen, onClose,  } = useAddUserDialog();
  if (!user) return null;

  if (!whoCanAccessSpecialFieldsWithManager.includes(user?.role)) return;
  return (
    <>
   
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription className="sr-only">
              Please fill out the information below to create a new user.
            </DialogDescription>
          </DialogHeader>
          <AuthForm formType="signup" hardRefresh />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SignUpDialog;
