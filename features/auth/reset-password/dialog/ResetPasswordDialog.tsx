"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ResetPasswordForm } from "../form/ResetPasswordForm"
import { useResetPasswordDialog } from "../hooks/useResetPasswordDialog"

export function ResetPasswordDialog() {
  const { isOpen, onClose } = useResetPasswordDialog()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
        </DialogHeader>
        <ResetPasswordForm />
      </DialogContent>
    </Dialog>
  )
}

