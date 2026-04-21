import { create } from "zustand"

type UseResetPasswordDialogT = {
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
}

export const useResetPasswordDialog = create<UseResetPasswordDialogT>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
}))
