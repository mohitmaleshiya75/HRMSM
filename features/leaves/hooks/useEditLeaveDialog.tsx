import { create } from "zustand";
import { GetLeavesResponseT } from "../types";

type UseEditLeaveDialogT = {
  onOpen: (leaveInfo: GetLeavesResponseT) => void;
  onClose: () => void;
  leaveInfo?: GetLeavesResponseT;
  isOpen: boolean;
};

export const useEditLeaveDialog = create<UseEditLeaveDialogT>((set) => ({
  isOpen: false,
  onClose: () => set({ isOpen: false, leaveInfo: undefined }),
  onOpen: (leaveInfo) => {
    set({ isOpen: true, leaveInfo });
  },
}));
